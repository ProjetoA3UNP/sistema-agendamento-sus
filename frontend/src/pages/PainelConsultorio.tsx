import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Stethoscope,
  Users,
  AlertCircle,
  FileCheck2,
  MapPin,
  Hospital,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';
import type { Agendamento, Ubs } from '../types/index.js';

export const PainelConsultorio: React.FC = () => {
  const { user } = useAuth();

  const [ubss, setUbss] = useState<Ubs[]>([]);
  const [ubsSelecionadaId, setUbsSelecionadaId] = useState<string>('');
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Grupos de fila
  const [emAtendimento, setEmAtendimento] = useState<Agendamento[]>([]);
  const [filaEspera, setFilaEspera] = useState<Agendamento[]>([]);
  const [aguardandoChegada, setAguardandoChegada] = useState<Agendamento[]>([]);
  const [finalizados, setFinalizados] = useState<Agendamento[]>([]);

  // 1. Carregar UBSs
  useEffect(() => {
    async function carregarUbss() {
      try {
        const res = await api.get('/ubs');
        setUbss(res.data);
        if (res.data.length > 0) {
          setUbsSelecionadaId(res.data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar UBSs:', err);
      }
    }
    carregarUbss();
  }, []);

  // 2. Carregar fila do consultório
  const carregarFila = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agendamentos/fila-consultorio', {
        params: {
          ubsId: ubsSelecionadaId || undefined,
          data: dataSelecionada,
        },
      });

      setEmAtendimento(res.data.emAtendimento || []);
      setFilaEspera(res.data.filaEspera || []);
      setAguardandoChegada(res.data.aguardandoChegada || []);
      setFinalizados(res.data.finalizados || []);
    } catch (err) {
      console.error('Erro ao carregar fila do consultório:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFila();
  }, [ubsSelecionadaId, dataSelecionada]);

  // 3. Chamar / Iniciar Atendimento
  const handleIniciarAtendimento = async (agendamentoId: string, nomePaciente: string) => {
    setActionLoading(agendamentoId);
    setFeedback(null);
    try {
      await api.patch(`/agendamentos/${agendamentoId}/iniciar-atendimento`);
      setFeedback({
        tipo: 'sucesso',
        texto: `Atendimento iniciado para ${nomePaciente}.`,
      });
      await carregarFila();
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.response?.data?.message || 'Erro ao iniciar atendimento.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Finalizar Consulta
  const handleFinalizarAtendimento = async (agendamentoId: string, nomePaciente: string) => {
    setActionLoading(agendamentoId);
    setFeedback(null);
    try {
      await api.patch(`/agendamentos/${agendamentoId}/finalizar-atendimento`);
      setFeedback({
        tipo: 'sucesso',
        texto: `Consulta de ${nomePaciente} finalizada com sucesso!`,
      });
      await carregarFila();
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.response?.data?.message || 'Erro ao finalizar atendimento.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pacienteAtual = emAtendimento.length > 0 ? emAtendimento[0] : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Consultório */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Consultório Médico & Odontológico
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Painel Clínico de Atendimento {user?.nome ? `• ${user.nome}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200">
            Fila de chamada, acolhimento de pacientes e encerramento de consultas.
          </p>
        </div>

        {/* Seletores de Unidade e Data */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
            <Hospital className="w-4 h-4 text-blue-300 ml-1" />
            <select
              value={ubsSelecionadaId}
              onChange={(e) => setUbsSelecionadaId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="" className="text-slate-800">Todas as Unidades</option>
              {ubss.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-800">
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-300 ml-1" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            />
          </div>

          <button
            onClick={carregarFila}
            disabled={loading}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Atualizar fila"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span className="font-semibold">{feedback.texto}</span>
        </div>
      )}

      {/* PACIENTE ATUAL EM CONSULTA (HERO CARD) */}
      <div className="card-sus border-t-4 border-t-sus-primary p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Paciente em Atendimento Agora
            </h2>
          </div>
          {pacienteAtual && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Consulta em Andamento
            </span>
          )}
        </div>

        {pacienteAtual ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sus-primary">
                  {pacienteAtual.vaga.especialidade.nome} • {pacienteAtual.vaga.ubs.nome}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {pacienteAtual.paciente?.nome}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                  <span>CPF: {pacienteAtual.paciente?.cpf}</span>
                  <span>•</span>
                  <span>Cartão SUS: {pacienteAtual.paciente?.cartaoSus || 'Cadastrado'}</span>
                  <span>•</span>
                  <span>Protocolo: {pacienteAtual.codigoProtocolo}</span>
                </div>
              </div>

              {/* Botão de Finalizar */}
              <button
                type="button"
                disabled={actionLoading === pacienteAtual.id}
                onClick={() =>
                  handleFinalizarAtendimento(pacienteAtual.id, pacienteAtual.paciente?.nome || 'Paciente')
                }
                className="btn-green py-3 px-6 text-sm font-bold shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {actionLoading === pacienteAtual.id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FileCheck2 className="w-5 h-5" />
                    <span>Concluir e Finalizar Consulta</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-blue-200/60 text-xs">
              <div>
                <span className="text-slate-400 block">Horário Marcado:</span>
                <strong className="text-slate-800">{pacienteAtual.vaga.horarioInicio}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Check-in na UBS:</span>
                <strong className="text-emerald-700">
                  {pacienteAtual.checkInEm
                    ? new Date(pacienteAtual.checkInEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Registrado'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Bairro de Origem:</span>
                <strong className="text-slate-800">{pacienteAtual.paciente?.bairro || 'Natal-RN'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Telefone de Contato:</span>
                <strong className="text-slate-800">{pacienteAtual.paciente?.telefone || 'Não informado'}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-500 text-xs sm:text-sm">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">
              Nenhum paciente no consultório no momento.
            </p>
            <p className="text-slate-500">
              Chame o próximo paciente que já realizou check-in na recepção abaixo.
            </p>
          </div>
        )}
      </div>

      {/* SEÇÃO 1: FILA DE ESPERA NA RECEPÇÃO (CHECK-IN FEITO) */}
      <div className="card-sus space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Fila de Pacientes Presentes na Sala de Espera ({filaEspera.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pacientes que já compareceram à UBS e tiveram sua presença confirmada pela recepção.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Prontos para Atendimento
          </span>
        </div>

        {filaEspera.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            Nenhum paciente aguardando na recepção neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filaEspera.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      #{index + 1} da Fila
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {item.vaga.horarioInicio}
                    </span>
                  </div>

                  <strong className="block text-sm font-bold text-slate-900">
                    {item.paciente?.nome}
                  </strong>

                  <div className="text-[11px] text-slate-500 font-mono">
                    CPF: {item.paciente?.cpf} • SUS: {item.paciente?.cartaoSus || 'Sim'}
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.vaga.ubs.nome} • {item.vaga.especialidade.nome}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Chegada:{' '}
                    {item.checkInEm
                      ? new Date(item.checkInEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Hoje'}
                  </span>

                  <button
                    type="button"
                    disabled={actionLoading === item.id}
                    onClick={() =>
                      handleIniciarAtendimento(item.id, item.paciente?.nome || 'Paciente')
                    }
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold shadow-sm cursor-pointer"
                  >
                    {actionLoading === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Chamar Paciente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: PRÓXIMOS AGENDADOS & FINALIZADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Agendados (Ainda sem check-in) */}
        <div className="card-sus space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Próximos Agendados ({aguardandoChegada.length})</span>
            </h3>
            <span className="text-[11px] text-amber-700 font-medium">Aguardando na portaria</span>
          </div>

          {aguardandoChegada.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Não há outros agendamentos pendentes para hoje.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {aguardandoChegada.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div>
                    <strong className="block text-slate-800">{a.paciente?.nome}</strong>
                    <span className="text-[10px] text-slate-500">
                      Horário: {a.vaga.horarioInicio} • {a.vaga.especialidade.nome}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleIniciarAtendimento(a.id, a.paciente?.nome || 'Paciente')}
                    className="text-xs text-sus-primary font-semibold hover:underline"
                  >
                    Atender Direto
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consultas Concluídas Hoje */}
        <div className="card-sus space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sus-green" />
              <span>Consultas Concluídas Hoje ({finalizados.length})</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium">Atendimentos finalizados</span>
          </div>

          {finalizados.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Nenhuma consulta finalizada ainda nesta data.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {finalizados.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <strong className="block text-slate-800">{a.paciente?.nome}</strong>
                    <span className="text-[10px] text-slate-400">
                      Agendado: {a.vaga.horarioInicio} • {a.vaga.especialidade.nome}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Finalizado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
