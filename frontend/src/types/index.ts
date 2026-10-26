export type Role = 'CIDADAO' | 'ATENDENTE' | 'MEDICO' | 'GESTOR';

export type DistritoSanitario = 'NORTE' | 'SUL' | 'LESTE' | 'OESTE';

export type Turno = 'MANHA' | 'TARDE';

export type StatusVaga = 'DISPONIVEL' | 'RESERVADA' | 'BLOQUEADA';

export type StatusAgendamento =
  | 'AGENDADO'
  | 'CHECK_IN'
  | 'EM_ATENDIMENTO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'FALTA';

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  cartaoSus?: string | null;
  email: string;
  perfil: Role;
  telefone?: string | null;
  bairro?: string | null;
  dataNascimento?: string | null;
  aceitouTermosLgpd?: boolean;
}

export interface Especialidade {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface Ubs {
  id: string;
  nome: string;
  cnes?: string | null;
  logradouro: string;
  numero?: string | null;
  bairro: string;
  distritoSanitario: DistritoSanitario;
  telefone?: string | null;
  horarioAbertura: string;
  horarioFechamento: string;
  ativo: boolean;
  especialidades?: Array<{
    especialidade: Especialidade;
  }>;
}

export interface Vaga {
  id: string;
  ubsId: string;
  especialidadeId: string;
  medicoId?: string | null;
  data: string;
  turno: Turno;
  horarioInicio: string;
  horarioFim: string;
  status: StatusVaga;
  ubs: {
    id: string;
    nome: string;
    bairro: string;
    distritoSanitario: DistritoSanitario;
    logradouro: string;
    numero?: string | null;
  };
  especialidade: {
    id: string;
    nome: string;
  };
  medico?: {
    id: string;
    nome: string;
  } | null;
}

export interface Agendamento {
  id: string;
  codigoProtocolo: string;
  qrCodeToken: string;
  vagaId: string;
  pacienteId: string;
  status: StatusAgendamento;
  motivoCancelamento?: string | null;
  canceladoEm?: string | null;
  checkInEm?: string | null;
  finalizadoEm?: string | null;
  criadoEm: string;
  vaga: Vaga;
  paciente?: Usuario;
}
