import { PrismaClient, Role, DistritoSanitario, Turno, StatusVaga } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function semearBanco(p: PrismaClient) {
  console.log('🌱 Iniciando o seed completo do banco de dados Gestão SUS (Natal-RN)...');

  // 1. Criar Especialidades (incluindo Exames Básicos & Coleta)
  const espClinico = await p.especialidade.upsert({
    where: { nome: 'Clínico Geral' },
    update: {
      descricao: 'Consultas médicas gerais, avaliação clínica inicial e encaminhamentos.',
      ativo: true,
    },
    create: {
      nome: 'Clínico Geral',
      descricao: 'Consultas médicas gerais, avaliação clínica inicial e encaminhamentos.',
    },
  });

  const espOdonto = await p.especialidade.upsert({
    where: { nome: 'Odontologia' },
    update: {
      descricao: 'Atendimento odontológico básico, restaurações, profilaxia e extrações.',
      ativo: true,
    },
    create: {
      nome: 'Odontologia',
      descricao: 'Atendimento odontológico básico, restaurações, profilaxia e extrações.',
    },
  });

  const espPreNatal = await p.especialidade.upsert({
    where: { nome: 'Pré-natal' },
    update: {
      descricao: 'Acompanhamento obstétrico gestacional e saúde materno-infantil.',
      ativo: true,
    },
    create: {
      nome: 'Pré-natal',
      descricao: 'Acompanhamento obstétrico gestacional e saúde materno-infantil.',
    },
  });

  const espEnfermagem = await p.especialidade.upsert({
    where: { nome: 'Enfermagem' },
    update: {
      descricao: 'Acolhimento da família, imunização/vacinas, curativos e triagem.',
      ativo: true,
    },
    create: {
      nome: 'Enfermagem',
      descricao: 'Acolhimento da família, imunização/vacinas, curativos e triagem.',
    },
  });

  const espExames = await p.especialidade.upsert({
    where: { nome: 'Exames Básicos & Coleta' },
    update: {
      descricao: 'Coleta laboratorial (sangue, fezes, urina), preventivo (Papanicolau), testes rápidos (HIV/Sífilis/Hepatites) e glicemia.',
      ativo: true,
    },
    create: {
      nome: 'Exames Básicos & Coleta',
      descricao: 'Coleta laboratorial (sangue, fezes, urina), preventivo (Papanicolau), testes rápidos (HIV/Sífilis/Hepatites) e glicemia.',
    },
  });

  const especialidades = [espClinico, espOdonto, espPreNatal, espEnfermagem, espExames];

  // 2. Criar as 8 UBSs de Natal-RN
  const ubsList = [
    {
      nome: 'UBS Ponta Negra',
      cnes: '2408101',
      logradouro: 'Rua Alagamar',
      numero: 's/n',
      bairro: 'Ponta Negra',
      distritoSanitario: DistritoSanitario.SUL,
      telefone: '(84) 3232-8400',
    },
    {
      nome: 'UBS Candelária',
      cnes: '2408102',
      logradouro: 'Rua Marechal Rondon',
      numero: '120',
      bairro: 'Candelária',
      distritoSanitario: DistritoSanitario.SUL,
      telefone: '(84) 3232-8401',
    },
    {
      nome: 'UBS Brasília Teimosa',
      cnes: '2408103',
      logradouro: 'Rua Miramar',
      numero: 's/n',
      bairro: 'Praia do Meio',
      distritoSanitario: DistritoSanitario.LESTE,
      telefone: '(84) 3232-8410',
    },
    {
      nome: 'UBS São João',
      cnes: '2408104',
      logradouro: 'Av. Romualdo Galvão',
      numero: '890',
      bairro: 'Tirol',
      distritoSanitario: DistritoSanitario.LESTE,
      telefone: '(84) 3232-8411',
    },
    {
      nome: 'UBS Pajuçara',
      cnes: '2408105',
      logradouro: 'Rua Maracangalha',
      numero: 's/n',
      bairro: 'Pajuçara',
      distritoSanitario: DistritoSanitario.NORTE,
      telefone: '(84) 3232-8420',
    },
    {
      nome: 'UBS Nova Natal',
      cnes: '2408106',
      logradouro: 'Rua do Pastoril',
      numero: '45',
      bairro: 'Lagoa Azul',
      distritoSanitario: DistritoSanitario.NORTE,
      telefone: '(84) 3232-8421',
    },
    {
      nome: 'UBS Felipe Camarão',
      cnes: '2408107',
      logradouro: 'Rua Mirassol',
      numero: 's/n',
      bairro: 'Felipe Camarão',
      distritoSanitario: DistritoSanitario.OESTE,
      telefone: '(84) 3232-8430',
    },
    {
      nome: 'UBS Bom Pastor',
      cnes: '2408108',
      logradouro: 'Rua Bom Pastor',
      numero: '310',
      bairro: 'Bom Pastor',
      distritoSanitario: DistritoSanitario.OESTE,
      telefone: '(84) 3232-8431',
    },
  ];

  const ubsEntities = [];
  for (const ubsData of ubsList) {
    const ubs = await p.ubs.upsert({
      where: { cnes: ubsData.cnes },
      update: ubsData,
      create: ubsData,
    });
    ubsEntities.push(ubs);

    // Vincular todas as 5 especialidades a cada uma das UBSs
    for (const esp of especialidades) {
      await p.ubsEspecialidade.upsert({
        where: {
          ubsId_especialidadeId: {
            ubsId: ubs.id,
            especialidadeId: esp.id,
          },
        },
        update: {},
        create: {
          ubsId: ubs.id,
          especialidadeId: esp.id,
        },
      });
    }
  }

  // 3. Usuários dos 4 Perfis RBAC
  const senhaHashPadrao = await bcrypt.hash('Senha@123', 10);

  // Gestor SMS
  await p.usuario.upsert({
    where: { cpf: '00011122233' },
    update: {},
    create: {
      nome: 'Gestor SMS Natal',
      cpf: '00011122233',
      email: 'gestor@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.GESTOR,
      telefone: '(84) 98888-0001',
      bairro: 'Tirol',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  // Atendente Recepção
  await p.usuario.upsert({
    where: { cpf: '11122233344' },
    update: {},
    create: {
      nome: 'Ana Paula (Recepção)',
      cpf: '11122233344',
      email: 'atendente.pontanegra@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.ATENDENTE,
      telefone: '(84) 98888-0002',
      bairro: 'Ponta Negra',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  // Médicos e Profissionais de Saúde
  const medicoClinico = await p.usuario.upsert({
    where: { cpf: '22233344455' },
    update: {},
    create: {
      nome: 'Dra. Marina Medeiros (Clínica Geral)',
      cpf: '22233344455',
      email: 'dra.marina@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.MEDICO,
      telefone: '(84) 98888-0003',
      bairro: 'Candelária',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  const medicoOdonto = await p.usuario.upsert({
    where: { cpf: '33344455566' },
    update: {},
    create: {
      nome: 'Dr. Rafael Dantas (Odontologia)',
      cpf: '33344455566',
      email: 'dr.rafael@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.MEDICO,
      telefone: '(84) 98888-0004',
      bairro: 'Pajuçara',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  const medicoPreNatal = await p.usuario.upsert({
    where: { cpf: '44455566677' },
    update: {},
    create: {
      nome: 'Dra. Camila Vasconcelos (Obstetrícia / Pré-natal)',
      cpf: '44455566677',
      email: 'dra.camila@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.MEDICO,
      telefone: '(84) 98888-0005',
      bairro: 'Felipe Camarão',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  const profissionalEnf = await p.usuario.upsert({
    where: { cpf: '55566677788' },
    update: {},
    create: {
      nome: 'Enf. Lucas Bezerra (Enfermagem & Exames Laboratoriais)',
      cpf: '55566677788',
      email: 'enf.lucas@susnatal.rn.gov.br',
      senha: senhaHashPadrao,
      perfil: Role.MEDICO,
      telefone: '(84) 98888-0006',
      bairro: 'Bom Pastor',
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  // Cidadão
  await p.usuario.upsert({
    where: { cpf: '12345678900' },
    update: {},
    create: {
      nome: 'João da Silva Santos',
      cpf: '12345678900',
      cartaoSus: '700000000000001',
      email: 'joao.silva@email.com',
      senha: senhaHashPadrao,
      perfil: Role.CIDADAO,
      telefone: '(84) 99999-1234',
      bairro: 'Ponta Negra',
      dataNascimento: new Date('1990-05-15'),
      aceitouTermosLgpd: true,
      termosLgpdEm: new Date(),
    },
  });

  // 4. Limpar apenas vagas disponíveis não agendadas anteriormente
  await p.vaga.deleteMany({
    where: {
      status: StatusVaga.DISPONIVEL,
      agendamento: null,
    },
  });

  // 5. Configurar horários por especialidade
  const configuracaoHorarios: Record<
    string,
    { medicoId: string; manha: string[]; tarde: string[] }
  > = {
    [espClinico.id]: {
      medicoId: medicoClinico.id,
      manha: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
      tarde: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
    },
    [espOdonto.id]: {
      medicoId: medicoOdonto.id,
      manha: ['08:00', '09:00', '10:00', '11:00'],
      tarde: ['13:00', '14:00', '15:00', '16:00'],
    },
    [espPreNatal.id]: {
      medicoId: medicoPreNatal.id,
      manha: ['08:30', '09:30', '10:30'],
      tarde: ['13:30', '14:30', '15:30'],
    },
    [espEnfermagem.id]: {
      medicoId: profissionalEnf.id,
      manha: ['07:30', '08:30', '09:30', '10:30'],
      tarde: ['13:00', '14:00', '15:00', '16:00'],
    },
    [espExames.id]: {
      medicoId: profissionalEnf.id,
      manha: ['07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:20', '09:40', '10:00'],
      tarde: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
    },
  };

  const hoje = new Date();
  const vagasParaInserir: Array<{
    ubsId: string;
    especialidadeId: string;
    medicoId: string;
    data: Date;
    turno: Turno;
    horarioInicio: string;
    horarioFim: string;
    status: StatusVaga;
  }> = [];

  let diasUteisContados = 0;
  let offsetDia = 1;

  while (diasUteisContados < 10) {
    const dataVaga = new Date(hoje);
    dataVaga.setDate(hoje.getDate() + offsetDia);
    offsetDia++;

    const diaSemana = dataVaga.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;

    diasUteisContados++;
    const dataNormalizada = new Date(Date.UTC(dataVaga.getFullYear(), dataVaga.getMonth(), dataVaga.getDate()));

    for (const ubs of ubsEntities) {
      for (const esp of especialidades) {
        const config = configuracaoHorarios[esp.id];
        if (!config) continue;

        // Horários da Manhã
        for (const h of config.manha) {
          const [hora, min] = h.split(':').map(Number);
          const duracaoMinutos = esp.id === espExames.id ? 20 : esp.id === espOdonto.id ? 45 : 30;
          const totalMin = min + duracaoMinutos;
          const hFim =
            totalMin >= 60
              ? `${String(hora + Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
              : `${String(hora).padStart(2, '0')}:${String(totalMin).padStart(2, '0')}`;

          vagasParaInserir.push({
            ubsId: ubs.id,
            especialidadeId: esp.id,
            medicoId: config.medicoId,
            data: dataNormalizada,
            turno: Turno.MANHA,
            horarioInicio: h,
            horarioFim: hFim,
            status: StatusVaga.DISPONIVEL,
          });
        }

        // Horários da Tarde
        for (const h of config.tarde) {
          const [hora, min] = h.split(':').map(Number);
          const duracaoMinutos = esp.id === espExames.id ? 20 : esp.id === espOdonto.id ? 45 : 30;
          const totalMin = min + duracaoMinutos;
          const hFim =
            totalMin >= 60
              ? `${String(hora + Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
              : `${String(hora).padStart(2, '0')}:${String(totalMin).padStart(2, '0')}`;

          vagasParaInserir.push({
            ubsId: ubs.id,
            especialidadeId: esp.id,
            medicoId: config.medicoId,
            data: dataNormalizada,
            turno: Turno.TARDE,
            horarioInicio: h,
            horarioFim: hFim,
            status: StatusVaga.DISPONIVEL,
          });
        }
      }
    }
  }

  // Inserção em lotes de 1000
  const tamanhoLote = 1000;
  for (let i = 0; i < vagasParaInserir.length; i += tamanhoLote) {
    const lote = vagasParaInserir.slice(i, i + tamanhoLote);
    await p.vaga.createMany({
      data: lote,
    });
  }

  return {
    sucesso: true,
    vagasCriadas: vagasParaInserir.length,
    ubss: ubsEntities.length,
    especialidades: especialidades.length,
  };
}
