import { PrismaClient, Role, DistritoSanitario, Turno, StatusVaga } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados Gestão SUS...');

  // 1. Criar Especialidades
  const espClinico = await prisma.especialidade.upsert({
    where: { nome: 'Clínico Geral' },
    update: {},
    create: {
      nome: 'Clínico Geral',
      descricao: 'Consultas médicas gerais, avaliação clínica inicial e encaminhamentos.',
    },
  });

  const espOdonto = await prisma.especialidade.upsert({
    where: { nome: 'Odontologia' },
    update: {},
    create: {
      nome: 'Odontologia',
      descricao: 'Atendimento odontológico básico, restaurações, profilaxia e extrações.',
    },
  });

  const espPreNatal = await prisma.especialidade.upsert({
    where: { nome: 'Pré-natal' },
    update: {},
    create: {
      nome: 'Pré-natal',
      descricao: 'Acompanhamento obstétrico gestacional e saúde materno-infantil.',
    },
  });

  const espEnfermagem = await prisma.especialidade.upsert({
    where: { nome: 'Enfermagem' },
    update: {},
    create: {
      nome: 'Enfermagem',
      descricao: 'Acolhimento da família, imunização/vacinas, curativos e triagem.',
    },
  });

  console.log('✅ Especialidades cadastradas.');

  // 2. Criar UBSs por Distritos Sanitários de Natal
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

  const especialidadesIds = [espClinico.id, espOdonto.id, espPreNatal.id, espEnfermagem.id];
  const ubsEntities = [];

  for (const ubsData of ubsList) {
    const ubs = await prisma.ubs.upsert({
      where: { cnes: ubsData.cnes },
      update: {},
      create: ubsData,
    });
    ubsEntities.push(ubs);

    // Associar especialidades a cada UBS
    for (const espId of especialidadesIds) {
      await prisma.ubsEspecialidade.upsert({
        where: {
          ubsId_especialidadeId: {
            ubsId: ubs.id,
            especialidadeId: espId,
          },
        },
        update: {},
        create: {
          ubsId: ubs.id,
          especialidadeId: espId,
        },
      });
    }
  }

  console.log(`✅ ${ubsEntities.length} Unidades Básicas de Saúde (UBSs) cadastradas e vinculadas a especialidades.`);

  // 3. Usuários Iniciais dos 4 Perfis RBAC
  const senhaHashPadrao = await bcrypt.hash('Senha@123', 10);

  // Gestor da SMS
  await prisma.usuario.upsert({
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

  // Atendente da UBS Ponta Negra
  await prisma.usuario.upsert({
    where: { cpf: '11122233344' },
    update: {},
    create: {
      nome: 'Ana Paula (Recepção Ponta Negra)',
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

  // Médico / Profissional de Saúde
  const medico = await prisma.usuario.upsert({
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

  // Cidadão / Paciente de Teste
  await prisma.usuario.upsert({
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

  console.log('✅ Usuários de teste dos 4 perfis RBAC cadastrados (Senha padrão: Senha@123).');

  // 4. Gerar Vagas de Teste para os próximos 5 dias úteis na UBS Ponta Negra
  const ubsPontaNegra = ubsEntities[0];
  const horariosManha = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
  const horariosTarde = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  const hoje = new Date();
  let vagasCriadas = 0;

  for (let d = 1; d <= 5; d++) {
    const dataVaga = new Date(hoje);
    dataVaga.setDate(hoje.getDate() + d);
    // Ignorar fim de semana (0 = domingo, 6 = sábado)
    if (dataVaga.getDay() === 0 || dataVaga.getDay() === 6) continue;

    // Vagas de Manhã
    for (const h of horariosManha) {
      const [hora, min] = h.split(':').map(Number);
      const minFim = min + 30;
      const hFim = minFim === 60 ? `${String(hora + 1).padStart(2, '0')}:00` : `${String(hora).padStart(2, '0')}:${minFim}`;

      await prisma.vaga.create({
        data: {
          ubsId: ubsPontaNegra.id,
          especialidadeId: espClinico.id,
          medicoId: medico.id,
          data: dataVaga,
          turno: Turno.MANHA,
          horarioInicio: h,
          horarioFim: hFim,
          status: StatusVaga.DISPONIVEL,
        },
      });
      vagasCriadas++;
    }

    // Vagas de Tarde
    for (const h of horariosTarde) {
      const [hora, min] = h.split(':').map(Number);
      const minFim = min + 30;
      const hFim = minFim === 60 ? `${String(hora + 1).padStart(2, '0')}:00` : `${String(hora).padStart(2, '0')}:${minFim}`;

      await prisma.vaga.create({
        data: {
          ubsId: ubsPontaNegra.id,
          especialidadeId: espClinico.id,
          medicoId: medico.id,
          data: dataVaga,
          turno: Turno.TARDE,
          horarioInicio: h,
          horarioFim: hFim,
          status: StatusVaga.DISPONIVEL,
        },
      });
      vagasCriadas++;
    }
  }

  console.log(`✅ ${vagasCriadas} vagas criadas para a UBS Ponta Negra nos próximos dias úteis.`);
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
