import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StatusVaga, Turno } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AberturaBlocoVagasDto } from './dto/abertura-bloco-vagas.dto.js';
import { semearBanco } from './vagas-seed.helper.js';

@Injectable()
export class VagasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async popularVagasDemonstracao() {
    return semearBanco(this.prisma);
  }

  async buscarDisponiveis(
    ubsId?: string,
    especialidadeId?: string,
    dataStr?: string,
    turno?: Turno,
  ) {
    const inicioExecucao = performance.now();

    // Normalizar data (início do dia)
    let filtroData: Date | undefined = undefined;
    if (dataStr) {
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      filtroData = new Date(ano, mes - 1, dia);
    } else {
      // Por padrão, buscar a partir de hoje
      const hoje = new Date();
      filtroData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    }

    const vagas = await this.prisma.vaga.findMany({
      where: {
        status: StatusVaga.DISPONIVEL,
        ubsId: ubsId || undefined,
        especialidadeId: especialidadeId || undefined,
        data: dataStr ? filtroData : { gte: filtroData },
        turno: turno || undefined,
      },
      include: {
        ubs: {
          select: {
            id: true,
            nome: true,
            bairro: true,
            distritoSanitario: true,
            logradouro: true,
            numero: true,
          },
        },
        especialidade: {
          select: {
            id: true,
            nome: true,
          },
        },
        medico: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: [
        { data: 'asc' },
        { horarioInicio: 'asc' },
      ],
      take: 100, // Limite para garantir resposta rápida
    });

    const tempoRespostaMs = Math.round(performance.now() - inicioExecucao);

    return {
      total: vagas.length,
      tempoRespostaMs, // Garante monitoramento do RNF04 (< 500ms)
      vagas,
    };
  }

  async abrirBlocoVagas(dto: AberturaBlocoVagasDto, gestorId: string, ip?: string) {
    const ubs = await this.prisma.ubs.findUnique({ where: { id: dto.ubsId } });
    if (!ubs || !ubs.ativo) {
      throw new NotFoundException('UBS não encontrada ou inativa.');
    }

    const especialidade = await this.prisma.especialidade.findUnique({
      where: { id: dto.especialidadeId },
    });
    if (!especialidade || !especialidade.ativo) {
      throw new NotFoundException('Especialidade não encontrada ou inativa.');
    }

    const [ano, mes, dia] = dto.data.split('-').map(Number);
    const dataVaga = new Date(ano, mes - 1, dia);

    const duracao = dto.duracaoMinutos || 30;
    const vagasParaCriar = dto.horarios.map((hInicio) => {
      const [hora, min] = hInicio.split(':').map(Number);
      const totalMin = hora * 60 + min + duracao;
      const horaFim = Math.floor(totalMin / 60);
      const minFim = totalMin % 60;
      const hFim = `${String(horaFim).padStart(2, '0')}:${String(minFim).padStart(2, '0')}`;

      return {
        ubsId: dto.ubsId,
        especialidadeId: dto.especialidadeId,
        medicoId: dto.medicoId ?? null,
        data: dataVaga,
        turno: dto.turno,
        horarioInicio: hInicio,
        horarioFim: hFim,
        status: StatusVaga.DISPONIVEL,
      };
    });

    const resultado = await this.prisma.vaga.createMany({
      data: vagasParaCriar,
    });

    await this.auditoria.registrar({
      usuarioId: gestorId,
      acao: 'ABERTURA_BLOCO_VAGAS',
      entidade: 'Vaga',
      detalhesJson: {
        ubs: ubs.nome,
        especialidade: especialidade.nome,
        data: dto.data,
        turno: dto.turno,
        quantidade: resultado.count,
      },
      ip,
    });

    return {
      mensagem: `${resultado.count} vagas abertas com sucesso para ${ubs.nome}.`,
      quantidadeCriada: resultado.count,
    };
  }
}
