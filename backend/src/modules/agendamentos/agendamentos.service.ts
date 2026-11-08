import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatusAgendamento, StatusVaga } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AgendarConsultaDto } from './dto/agendar-consulta.dto.js';
import { CancelarConsultaDto } from './dto/cancelar-consulta.dto.js';
import { CheckInDto } from './dto/checkin.dto.js';
import { limparDocumento } from '../../common/utils/cpf.validator.js';

@Injectable()
export class AgendamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Reserva Atômica de Vaga com Bloqueio de Concorrência (Lock Pessimista) - RF04 / RF05
   */
  async agendar(
    dto: AgendarConsultaDto,
    usuarioSolicitanteId: string,
    perfilSolicitante: Role,
    ip?: string,
  ) {
    // Definir quem é o paciente atendido
    let pacienteId = usuarioSolicitanteId;

    // Se um atendente estiver no balcão fazendo agendamento assistido para outrem
    if (dto.pacienteId) {
      if (perfilSolicitante === Role.CIDADAO && dto.pacienteId !== usuarioSolicitanteId) {
        throw new ForbiddenException('Cidadãos só podem agendar consultas para o seu próprio CPF.');
      }
      pacienteId = dto.pacienteId;
    }

    // Verificar se o paciente existe e está ativo
    const paciente = await this.prisma.usuario.findUnique({
      where: { id: pacienteId },
    });
    if (!paciente || !paciente.ativo) {
      throw new NotFoundException('Paciente não encontrado ou com cadastro inativo.');
    }

    // TRANSAÇÃO ATÔMICA COM LOCK PESSIMISTA NO MYSQL (FOR UPDATE)
    const agendamentoCriado = await this.prisma.$transaction(async (tx) => {
      // 1. Bloquear a linha da vaga no MySQL InnoDB com FOR UPDATE
      const vagasEncontradas: any[] = await tx.$queryRaw`
        SELECT id, ubsId, especialidadeId, data, turno, horarioInicio, status 
        FROM vagas 
        WHERE id = ${dto.vagaId} 
        FOR UPDATE;
      `;

      if (!vagasEncontradas || vagasEncontradas.length === 0) {
        throw new NotFoundException('A vaga solicitada não foi encontrada.');
      }

      const vaga = vagasEncontradas[0];

      // 2. Verificar se a vaga continua disponível
      if (vaga.status !== StatusVaga.DISPONIVEL) {
        throw new ConflictException(
          'Esta vaga já foi reservada por outro paciente no mesmo instante. Por favor, escolha outro horário.',
        );
      }

      // 3. Impedir que o mesmo paciente possua dois agendamentos no mesmo turno/data (RF05)
      const dataVagaFormatada = new Date(vaga.data);
      const conflitoMesmoTurno = await tx.agendamento.findFirst({
        where: {
          pacienteId,
          status: StatusAgendamento.AGENDADO,
          vaga: {
            data: dataVagaFormatada,
            turno: vaga.turno,
          },
        },
      });

      if (conflitoMesmoTurno) {
        throw new BadRequestException(
          `O paciente já possui um agendamento ativo para a mesma data no turno da ${vaga.turno.toLowerCase()}. O SUS não permite múltiplos agendamentos no mesmo turno.`,
        );
      }

      // 4. Alterar o status da vaga para RESERVADA
      await tx.vaga.update({
        where: { id: dto.vagaId },
        data: { status: StatusVaga.RESERVADA },
      });

      // 5. Gerar protocolo amigável e Token único para o QR Code (RF06)
      const anoAtual = new Date().getFullYear();
      const sufixoAleatorio = randomBytes(3).toString('hex').toUpperCase(); // 6 chars
      const codigoProtocolo = `NAT-${anoAtual}-${sufixoAleatorio}`;
      const qrCodeToken = randomBytes(16).toString('hex'); // 32 chars seguros

      // 6. Criar o agendamento no banco
      return tx.agendamento.create({
        data: {
          codigoProtocolo,
          qrCodeToken,
          vagaId: dto.vagaId,
          pacienteId,
          status: StatusAgendamento.AGENDADO,
        },
        include: {
          vaga: {
            include: {
              ubs: true,
              especialidade: true,
              medico: {
                select: { id: true, nome: true },
              },
            },
          },
          paciente: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              cartaoSus: true,
              bairro: true,
              telefone: true,
            },
          },
        },
      });
    });

    // Gravar log na trilha de auditoria LGPD
    await this.auditoria.registrar({
      usuarioId: usuarioSolicitanteId,
      acao: 'RESERVA_CONSULTA',
      entidade: 'Agendamento',
      entidadeId: agendamentoCriado.id,
      detalhesJson: {
        protocolo: agendamentoCriado.codigoProtocolo,
        ubs: agendamentoCriado.vaga.ubs.nome,
        especialidade: agendamentoCriado.vaga.especialidade.nome,
        horario: `${agendamentoCriado.vaga.data.toISOString().split('T')[0]} às ${agendamentoCriado.vaga.horarioInicio}`,
        assistido: usuarioSolicitanteId !== pacienteId,
      },
      ip,
    });

    return {
      mensagem: 'Consulta agendada com sucesso!',
      agendamento: agendamentoCriado,
    };
  }

  /**
   * Cancelamento de Consulta com Regra de 24 horas - RF07
   */
  async cancelar(
    agendamentoId: string,
    dto: CancelarConsultaDto,
    usuarioId: string,
    perfil: Role,
    ip?: string,
  ) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        vaga: {
          include: { ubs: true, especialidade: true },
        },
      },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (agendamento.status !== StatusAgendamento.AGENDADO) {
      throw new BadRequestException(
        `Esta consulta não pode ser cancelada pois seu status atual é: ${agendamento.status}.`,
      );
    }

    // Se for o próprio cidadão, verificar se a consulta é dele
    if (perfil === Role.CIDADAO && agendamento.pacienteId !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para cancelar a consulta de outro cidadão.');
    }

    // Regra de antecedência de 24 horas para o cidadão (RF07)
    if (perfil === Role.CIDADAO) {
      const dataStr = agendamento.vaga.data.toISOString().split('T')[0];
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      const [hora, min] = agendamento.vaga.horarioInicio.split(':').map(Number);
      const dataHoraConsulta = new Date(ano, mes - 1, dia, hora, min);

      const agora = new Date();
      const diferencaMilissegundos = dataHoraConsulta.getTime() - agora.getTime();
      const horasRestantes = diferencaMilissegundos / (1000 * 60 * 60);

      if (horasRestantes < 24) {
        throw new BadRequestException(
          'Cancelamentos pelo cidadão só podem ser efetuados com antecedência mínima de 24 horas para que a vaga possa ser reaproveitada na rede pública.',
        );
      }
    }

    // TRANSAÇÃO ATÔMICA DE CANCELAMENTO
    await this.prisma.$transaction(async (tx) => {
      // 1. Atualizar agendamento para CANCELADO
      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: {
          status: StatusAgendamento.CANCELADO,
          motivoCancelamento: dto.motivo,
          canceladoEm: new Date(),
        },
      });

      // 2. Liberar a vaga imediatamente para a fila pública (RF07)
      await tx.vaga.update({
        where: { id: agendamento.vagaId },
        data: {
          status: StatusVaga.DISPONIVEL,
        },
      });
    });

    // Gravar auditoria LGPD
    await this.auditoria.registrar({
      usuarioId,
      acao: 'CANCELAMENTO_CONSULTA',
      entidade: 'Agendamento',
      entidadeId: agendamento.id,
      detalhesJson: {
        protocolo: agendamento.codigoProtocolo,
        motivo: dto.motivo,
        canceladoPorPerfil: perfil,
      },
      ip,
    });

    return {
      mensagem: 'Consulta cancelada com sucesso e vaga disponibilizada novamente na agenda pública.',
    };
  }

  /**
   * Histórico de Consultas do Cidadão - RF08
   */
  async minhasConsultas(pacienteId: string) {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: { pacienteId },
      include: {
        vaga: {
          include: {
            ubs: true,
            especialidade: true,
            medico: {
              select: { id: true, nome: true },
            },
          },
        },
      },
      orderBy: {
        vaga: {
          data: 'desc',
        },
      },
    });

    const proximas = agendamentos.filter((a) => a.status === StatusAgendamento.AGENDADO);
    const historico = agendamentos.filter((a) => a.status !== StatusAgendamento.AGENDADO);

    return {
      total: agendamentos.length,
      proximas,
      historico,
    };
  }

  /**
   * Obter Comprovante Digital por Protocolo ou Token QR Code - RF06
   */
  async obterComprovante(identificador: string) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        OR: [
          { codigoProtocolo: identificador },
          { qrCodeToken: identificador },
          { id: identificador },
        ],
      },
      include: {
        vaga: {
          include: {
            ubs: true,
            especialidade: true,
            medico: {
              select: { id: true, nome: true },
            },
          },
        },
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cartaoSus: true,
            bairro: true,
            telefone: true,
          },
        },
      },
    });

    if (!agendamento) {
      throw new NotFoundException('Comprovante de agendamento não encontrado.');
    }

    return agendamento;
  }

  /**
   * Check-in Presencial da UBS (Recepção / Triagem) - US05.2
   */
  async realizarCheckIn(dto: CheckInDto, atendenteId: string, ip?: string) {
    let agendamento = null;

    if (dto.qrCodeToken) {
      agendamento = await this.prisma.agendamento.findUnique({
        where: { qrCodeToken: dto.qrCodeToken },
        include: {
          vaga: { include: { ubs: true, especialidade: true } },
          paciente: true,
        },
      });
    } else if (dto.codigoProtocolo) {
      agendamento = await this.prisma.agendamento.findUnique({
        where: { codigoProtocolo: dto.codigoProtocolo.trim().toUpperCase() },
        include: {
          vaga: { include: { ubs: true, especialidade: true } },
          paciente: true,
        },
      });
    } else if (dto.cpf) {
      const cpfLimpo = limparDocumento(dto.cpf);
      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

      agendamento = await this.prisma.agendamento.findFirst({
        where: {
          paciente: { cpf: cpfLimpo },
          status: StatusAgendamento.AGENDADO,
          vaga: { data: { gte: inicioDia } },
        },
        include: {
          vaga: { include: { ubs: true, especialidade: true } },
          paciente: true,
        },
      });
    }

    if (!agendamento) {
      throw new NotFoundException('Nenhum agendamento ativo encontrado com os dados informados.');
    }

    if (agendamento.status === StatusAgendamento.CHECK_IN) {
      return {
        mensagem: 'O paciente já efetuou o check-in anteriormente e está na fila de espera do consultório.',
        agendamento,
      };
    }

    if (agendamento.status !== StatusAgendamento.AGENDADO) {
      throw new BadRequestException(
        `Não é possível realizar o check-in. O status atual desta consulta é: ${agendamento.status}.`,
      );
    }

    const agendamentoAtualizado = await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        status: StatusAgendamento.CHECK_IN,
        checkInEm: new Date(),
      },
      include: {
        vaga: { include: { ubs: true, especialidade: true } },
        paciente: true,
      },
    });

    await this.auditoria.registrar({
      usuarioId: atendenteId,
      acao: 'CHECK_IN_UBS',
      entidade: 'Agendamento',
      entidadeId: agendamento.id,
      detalhesJson: {
        protocolo: agendamento.codigoProtocolo,
        paciente: agendamento.paciente.nome,
        metodo: dto.qrCodeToken ? 'QR_CODE' : 'CPF_PROTOCOLO',
      },
      ip,
    });

    return {
      mensagem: `Check-in realizado com sucesso! Paciente ${agendamento.paciente.nome} direcionado à sala de espera.`,
      agendamento: agendamentoAtualizado,
    };
  }

  /**
   * Registro de Falta (Não Comparecimento) - US05.3
   */
  async registrarFalta(agendamentoId: string, atendenteId: string, ip?: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (agendamento.status !== StatusAgendamento.AGENDADO) {
      throw new BadRequestException(`Status inválido para registrar falta: ${agendamento.status}.`);
    }

    await this.prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: StatusAgendamento.FALTA,
      },
    });

    await this.auditoria.registrar({
      usuarioId: atendenteId,
      acao: 'REGISTRO_FALTA',
      entidade: 'Agendamento',
      entidadeId: agendamento.id,
      ip,
    });

    return {
      mensagem: 'Falta registrada com sucesso.',
    };
  }

  /**
   * Listar Agenda do Dia para a Recepção / Triagem da UBS (US05.1)
   */
  async listarAgendaDia(
    ubsId?: string,
    dataStr?: string,
    status?: StatusAgendamento,
    busca?: string,
  ) {
    let filtroData: Date | undefined = undefined;
    if (dataStr) {
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      filtroData = new Date(ano, mes - 1, dia);
    } else {
      const hoje = new Date();
      filtroData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    }

    const whereClause: any = {
      vaga: {
        data: filtroData,
        ...(ubsId ? { ubsId } : {}),
      },
      ...(status ? { status } : {}),
    };

    if (busca && busca.trim().length > 0) {
      const termo = busca.trim();
      const termoLimpo = limparDocumento(termo);
      whereClause.OR = [
        { codigoProtocolo: { contains: termo } },
        { paciente: { nome: { contains: termo } } },
        ...(termoLimpo.length >= 3 ? [{ paciente: { cpf: { contains: termoLimpo } } }] : []),
      ];
    }

    return this.prisma.agendamento.findMany({
      where: whereClause,
      include: {
        vaga: {
          include: {
            ubs: true,
            especialidade: true,
            medico: {
              select: { id: true, nome: true },
            },
          },
        },
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cartaoSus: true,
            telefone: true,
            bairro: true,
            dataNascimento: true,
          },
        },
      },
      orderBy: [
        { vaga: { horarioInicio: 'asc' } },
      ],
    });
  }

  /**
   * Listar Fila do Consultório Médico (US06.1)
   */
  async listarFilaConsultorio(medicoId?: string, ubsId?: string, dataStr?: string) {
    let filtroData: Date | undefined = undefined;
    if (dataStr) {
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      filtroData = new Date(ano, mes - 1, dia);
    } else {
      const hoje = new Date();
      filtroData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    }

    const whereClause: any = {
      vaga: {
        data: filtroData,
        ...(ubsId ? { ubsId } : {}),
        ...(medicoId ? { medicoId } : {}),
      },
      status: {
        in: [
          StatusAgendamento.CHECK_IN,
          StatusAgendamento.EM_ATENDIMENTO,
          StatusAgendamento.FINALIZADO,
          StatusAgendamento.AGENDADO,
        ],
      },
    };

    const agendamentos = await this.prisma.agendamento.findMany({
      where: whereClause,
      include: {
        vaga: {
          include: {
            ubs: true,
            especialidade: true,
            medico: { select: { id: true, nome: true } },
          },
        },
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cartaoSus: true,
            telefone: true,
            bairro: true,
            dataNascimento: true,
          },
        },
      },
      orderBy: [
        { vaga: { horarioInicio: 'asc' } },
      ],
    });

    const emAtendimento = agendamentos.filter((a) => a.status === StatusAgendamento.EM_ATENDIMENTO);
    const filaEspera = agendamentos.filter((a) => a.status === StatusAgendamento.CHECK_IN);
    const aguardandoChegada = agendamentos.filter((a) => a.status === StatusAgendamento.AGENDADO);
    const finalizados = agendamentos.filter((a) => a.status === StatusAgendamento.FINALIZADO);

    return {
      total: agendamentos.length,
      emAtendimento,
      filaEspera,
      aguardandoChegada,
      finalizados,
      todos: agendamentos,
    };
  }

  /**
   * Iniciar Atendimento Clínico (Médico / Dentista / Enfermeiro)
   */
  async iniciarAtendimento(agendamentoId: string, medicoId: string, ip?: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: { paciente: true, vaga: true },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (
      agendamento.status !== StatusAgendamento.CHECK_IN &&
      agendamento.status !== StatusAgendamento.AGENDADO
    ) {
      throw new BadRequestException(
        `Não é possível iniciar atendimento com status atual: ${agendamento.status}.`,
      );
    }

    const atualizado = await this.prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: StatusAgendamento.EM_ATENDIMENTO,
      },
      include: {
        paciente: true,
        vaga: { include: { ubs: true, especialidade: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: medicoId,
      acao: 'INICIO_ATENDIMENTO_MEDICO',
      entidade: 'Agendamento',
      entidadeId: agendamento.id,
      detalhesJson: {
        paciente: agendamento.paciente.nome,
        protocolo: agendamento.codigoProtocolo,
      },
      ip,
    });

    return {
      mensagem: `Atendimento iniciado para o paciente ${agendamento.paciente.nome}.`,
      agendamento: atualizado,
    };
  }

  /**
   * Finalizar Atendimento Clínico
   */
  async finalizarAtendimento(agendamentoId: string, medicoId: string, ip?: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: { paciente: true, vaga: true },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (
      agendamento.status !== StatusAgendamento.EM_ATENDIMENTO &&
      agendamento.status !== StatusAgendamento.CHECK_IN
    ) {
      throw new BadRequestException(
        `Apenas consultas 'Em Atendimento' ou com 'Check-in' podem ser finalizadas. Status atual: ${agendamento.status}.`,
      );
    }

    const atualizado = await this.prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: StatusAgendamento.FINALIZADO,
        finalizadoEm: new Date(),
      },
      include: {
        paciente: true,
        vaga: { include: { ubs: true, especialidade: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: medicoId,
      acao: 'FINALIZACAO_ATENDIMENTO_MEDICO',
      entidade: 'Agendamento',
      entidadeId: agendamento.id,
      detalhesJson: {
        paciente: agendamento.paciente.nome,
        protocolo: agendamento.codigoProtocolo,
      },
      ip,
    });

    return {
      mensagem: `Consulta finalizada com sucesso! Atendimento concluído.`,
      agendamento: atualizado,
    };
  }

  /**
   * Métricas Consolidadas para o Gestor da SMS
   */
  async obterMetricasGestao() {
    const [
      totalAgendamentos,
      agendados,
      checkIns,
      emAtendimento,
      finalizados,
      faltas,
      cancelados,
      totalVagas,
      vagasDisponiveis,
      vagasReservadas,
      ubssComContagem,
      especialidadesComContagem,
      logsAuditoria,
    ] = await Promise.all([
      this.prisma.agendamento.count(),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.AGENDADO } }),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.CHECK_IN } }),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.EM_ATENDIMENTO } }),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.FINALIZADO } }),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.FALTA } }),
      this.prisma.agendamento.count({ where: { status: StatusAgendamento.CANCELADO } }),
      this.prisma.vaga.count(),
      this.prisma.vaga.count({ where: { status: StatusVaga.DISPONIVEL } }),
      this.prisma.vaga.count({ where: { status: StatusVaga.RESERVADA } }),
      this.prisma.ubs.findMany({
        select: {
          id: true,
          nome: true,
          bairro: true,
          distritoSanitario: true,
          _count: {
            select: {
              vagas: true,
            },
          },
        },
      }),
      this.prisma.especialidade.findMany({
        select: {
          id: true,
          nome: true,
          _count: {
            select: {
              vagas: true,
            },
          },
        },
      }),
      this.prisma.logAuditoria.findMany({
        take: 15,
        orderBy: { criadoEm: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
            },
          },
        },
      }),
    ]);

    const totalPresencas = checkIns + emAtendimento + finalizados;
    const taxaAbsenteismo =
      totalAgendamentos > 0 ? Number(((faltas / totalAgendamentos) * 100).toFixed(1)) : 0;
    const taxaPresenca =
      totalAgendamentos > 0 ? Number(((totalPresencas / totalAgendamentos) * 100).toFixed(1)) : 0;

    return {
      kpis: {
        totalAgendamentos,
        agendados,
        checkIns,
        emAtendimento,
        finalizados,
        faltas,
        cancelados,
        taxaAbsenteismo,
        taxaPresenca,
        totalVagas,
        vagasDisponiveis,
        vagasReservadas,
      },
      distribuicaoUbs: ubssComContagem,
      distribuicaoEspecialidade: especialidadesComContagem,
      ultimosLogs: logsAuditoria,
    };
  }

  /**
   * Trilha de Auditoria LGPD para o Gestor
   */
  async listarLogsAuditoria(limite = 30) {
    return this.prisma.logAuditoria.findMany({
      take: Math.min(limite, 100),
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            email: true,
            perfil: true,
          },
        },
      },
    });
  }
}
