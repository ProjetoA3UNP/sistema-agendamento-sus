import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  XCircle,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { Agendamento } from '../types/index.js';

export const MinhasConsultas: React.FC = () => {
  const [proximas, setProximas] = useState<Agendamento[]>([]);
  const [historico, setHistorico] = useState<Agendamento[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'proximas' | 'historico'>('proximas');
  const [loading, setLoading] = useState(true);

  // Estado do Modal de Cancelamento
  const [consultaParaCancelar, setConsultaParaCancelar] = useState<Agendamento | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const carregarConsultas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agendamentos/minhas');
      setProximas(res.data.proximas || []);
      setHistorico(res.data.historico || []);
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConsultas();
  }, []);

  const handleAbrirModalCancelamento = (consulta: Agendamento) => {
    setConsultaParaCancelar(consulta);
    setMotivoCancelamento('');
    setErroCancelamento(null);
  };

  const handleConfirmarCancelamento = async () => {
    if (!consultaParaCancelar) return;
    if (motivoCancelamento.trim().length < 5) {
      setErroCancelamento('Por favor, informe uma justificativa com pelo menos 5 caracteres.');
      return;
    }

    setCancelando(true);
    setErroCancelamento(null);

    try {
      const res = await api.patch(`/agendamentos/${consultaParaCancelar.id}/cancelar`, {
        motivo: motivoCancelamento.trim(),
      });

      setSucessoMsg(res.data.mensagem || 'Consulta cancelada com sucesso!');
      setConsultaParaCancelar(null);
      await carregarConsultas();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao cancelar consulta.';
      setErroCancelamento(msg);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-sus-primary" />
            <span>Minhas Consultas no SUS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe suas consultas ativas e o histórico de atendimentos na rede básica.
          </p>
        </div>

        <Link to="/agendar" className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <Calendar className="w-4 h-4" />
          <span>Agendar Nova</span>
        </Link>
      </div>

      {/* Alerta de Sucesso */}
      {sucessoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <button
            onClick={() => setSucessoMsg(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Abas Superiores */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setAbaAtiva('proximas')}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            abaAtiva === 'proximas'
              ? 'border-sus-primary text-sus-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Próximas Consultas</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-sus-primary font-bold">
            {proximas.length}
          </span>
        </button>

        <button
          onClick={() => setAbaAtiva('historico')}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            abaAtiva === 'historico'
              ? 'border-sus-primary text-sus-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Histórico & Concluídas</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            {historico.length}
          </span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-sus-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Carregando histórico de consultas...</p>
        </div>
      ) : abaAtiva === 'proximas' ? (
        // ABA: PRÓXIMAS CONSULTAS
        proximas.length === 0 ? (
          <div className="card-sus p-10 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Nenhuma consulta agendada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Você não possui atendimentos futuros marcados. Deseja realizar um novo agendamento?
            </p>
            <Link to="/agendar" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              <span>Agendar Agora</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proximas.map((consulta) => (
              <div key={consulta.id} className="card-sus border-l-4 border-l-sus-primary space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase text-sus-primary tracking-wider">
                      {consulta.vaga.especialidade.nome}
                    </span>
                    <h3 className="text-base font-bold text-slate-800">
                      {consulta.vaga.ubs.nome}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{consulta.vaga.ubs.logradouro}, {consulta.vaga.ubs.bairro}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Confirmada
                    </span>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Protocolo: <strong>{consulta.codigoProtocolo}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Data da Consulta</span>
                    <strong className="text-slate-800 font-semibold">
                      {new Date(consulta.vaga.data).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Horário / Turno</span>
                    <strong className="text-slate-800 font-semibold">
                      {consulta.vaga.horarioInicio} às {consulta.vaga.horarioFim} (Turno da {consulta.vaga.turno.toLowerCase()})
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleAbrirModalCancelamento(consulta)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar Consulta</span>
                  </button>

                  <Link
                    to={`/comprovante/${consulta.codigoProtocolo}`}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver Comprovante</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // ABA: HISTÓRICO COMPLETO
        historico.length === 0 ? (
          <div className="card-sus p-10 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Nenhum histórico anterior</h3>
            <p className="text-xs text-slate-400">
              Seus atendimentos anteriores realizados ou cancelados aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((consulta) => {
              const eCancelada = consulta.status === 'CANCELADO';
              const eFalta = consulta.status === 'FALTA';
              const eCheckIn = consulta.status === 'CHECK_IN';
              const eFinalizado = consulta.status === 'FINALIZADO';

              return (
                <div key={consulta.id} className="card-sus space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">
                        {consulta.vaga.especialidade.nome} • {consulta.vaga.ubs.nome}
                      </span>
                      <p className="text-xs text-slate-400">
                        {new Date(consulta.vaga.data).toLocaleDateString('pt-BR')} às {consulta.vaga.horarioInicio}
                      </p>
                    </div>

                    <div>
                      {eCancelada && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                          Cancelada
                        </span>
                      )}
                      {eFalta && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Falta (Não compareceu)
                        </span>
                      )}
                      {eCheckIn && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Na Sala de Espera
                        </span>
                      )}
                      {eFinalizado && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Atendimento Realizado
                        </span>
                      )}
                    </div>
                  </div>

                  {eCancelada && consulta.motivoCancelamento && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                      Motivo do cancelamento: "{consulta.motivoCancelamento}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ========================================================== */}
      {/* MODAL DE CANCELAMENTO COM REGRA DE 24 HORAS (RF07)        */}
      {/* ========================================================== */}
      {consultaParaCancelar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-800">Confirmar Cancelamento</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está prestes a cancelar a consulta de <strong>{consultaParaCancelar.vaga.especialidade.nome}</strong> na <strong>{consultaParaCancelar.vaga.ubs.nome}</strong>.
            </p>

            {/* Aviso de 24h da LGPD / Regra de Negócio */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <strong>Regra do SUS Natal (RF07):</strong>
              <p>
                O cancelamento só é autorizado com <strong>antecedência mínima de 24 horas</strong>. A vaga será liberada imediatamente para outro paciente da fila pública.
              </p>
            </div>

            {erroCancelamento && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{erroCancelamento}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Motivo / Justificativa do Cancelamento *
              </label>
              <textarea
                rows={3}
                required
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Imprevisto de trabalho, melhora dos sintomas ou viagem urgente..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={cancelando}
                onClick={() => setConsultaParaCancelar(null)}
                className="btn-secondary text-xs py-2 px-3.5"
              >
                Voltar
              </button>

              <button
                type="button"
                disabled={cancelando}
                onClick={handleConfirmarCancelamento}
                className="btn-danger text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                {cancelando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Sim, Liberar Vaga</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
