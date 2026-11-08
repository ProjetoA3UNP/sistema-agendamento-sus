import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { Especialidade, MetricasGestao, Ubs } from '../types/index.js';

export const PainelGestor: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasGestao | null>(null);
  const [ubss, setUbss] = useState<Ubs[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'indicadores' | 'abertura-vagas' | 'auditoria'>('indicadores');

  // Formulário de Abertura de Vagas
  const [formUbsId, setFormUbsId] = useState('');
  const [formEspecialidadeId, setFormEspecialidadeId] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formTurno, setFormTurno] = useState<'MANHA' | 'TARDE'>('MANHA');
  const [formDuracao, setFormDuracao] = useState(30);
  const [horariosTexto, setHorariosTexto] = useState('08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00');
  const [loadingCriacao, setLoadingCriacao] = useState(false);
  const [feedbackCriacao, setFeedbackCriacao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // 1. Carregar Métricas e Dados Base
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resMetricas, resUbss, resEsp] = await Promise.all([
        api.get('/agendamentos/metricas-gestao'),
        api.get('/ubs'),
        api.get('/ubs/especialidades'),
      ]);

      setMetricas(resMetricas.data);
      setUbss(resUbss.data);
      setEspecialidades(resEsp.data);

      if (resUbss.data.length > 0 && !formUbsId) {
        setFormUbsId(resUbss.data[0].id);
      }
      if (resEsp.data.length > 0 && !formEspecialidadeId) {
        setFormEspecialidadeId(resEsp.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar métricas da gestão:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Preenchimento de horários rápidos
  const aplicarHorariosRapidos = (turno: 'MANHA' | 'TARDE') => {
    setFormTurno(turno);
    if (turno === 'MANHA') {
      setHorariosTexto('08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00');
    } else {
      setHorariosTexto('13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00');
    }
  };

  // Submeter Abertura de Bloco de Vagas
  const handleCriarBlocoVagas = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackCriacao(null);
    setLoadingCriacao(true);

    try {
      const listaHorarios = horariosTexto
        .split(',')
        .map((h) => h.trim())
        .filter((h) => /^\d{2}:\d{2}$/.test(h));

      if (listaHorarios.length === 0) {
        setFeedbackCriacao({
          tipo: 'erro',
          texto: 'Por favor, informe ao menos um horário válido no formato HH:MM (ex: 08:00, 08:30).',
        });
        setLoadingCriacao(false);
        return;
      }

      const res = await api.post('/vagas/abertura-bloco', {
        ubsId: formUbsId,
        especialidadeId: formEspecialidadeId,
        data: formData,
        turno: formTurno,
        duracaoMinutos: formDuracao,
        horarios: listaHorarios,
      });

      setFeedbackCriacao({
        tipo: 'sucesso',
        texto: res.data.mensagem || 'Bloco de vagas aberto com sucesso!',
      });

      // Recarrega as métricas
      await carregarDados();
    } catch (err: any) {
      setFeedbackCriacao({
        tipo: 'erro',
        texto: err.response?.data?.message || 'Falha ao criar bloco de vagas.',
      });
    } finally {
      setLoadingCriacao(false);
    }
  };

  const kpis = metricas?.kpis;

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Gestor */}
      <div className="bg-gradient-to-r from-slate-900 via-sus-dark to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secretaria Municipal de Saúde • SMS Natal-RN
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Painel Geral de Gestão & Regulação
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Monitoramento de absenteísmo, ocupação de vagas, abertura de agendas e trilha de auditoria LGPD.
          </p>
        </div>

        <button
          onClick={carregarDados}
          disabled={loading}
          className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Indicadores</span>
        </button>
      </div>

      {/* KPI CARDS (MÉTRICAS CENTRAIS DE SAÚDE PÚBLICA) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Agendamentos */}
        <div className="card-sus p-4 space-y-1 border-t-4 border-t-sus-primary">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Demanda Total</span>
            <Users className="w-4 h-4 text-sus-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {kpis?.totalAgendamentos ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sus-primary" />
            <span>Consultas marcadas na rede</span>
          </p>
        </div>

        {/* Taxa de Presença (Comparecimento) */}
        <div className="card-sus p-4 space-y-1 border-t-4 border-t-sus-green">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Presença Efetuada</span>
            <UserCheck className="w-4 h-4 text-sus-green" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {kpis?.taxaPresenca ?? 0}%
          </div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{(kpis?.checkIns ?? 0) + (kpis?.emAtendimento ?? 0) + (kpis?.finalizados ?? 0)} pacientes presentes</span>
          </p>
        </div>

        {/* Taxa de Absenteísmo (Faltas) */}
        <div className="card-sus p-4 space-y-1 border-t-4 border-t-red-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Absenteísmo (Faltas)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">
            {kpis?.taxaAbsenteismo ?? 0}%
          </div>
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{kpis?.faltas ?? 0} ausências registradas</span>
          </p>
        </div>

        {/* Capacidade e Vagas Ofertadas */}
        <div className="card-sus p-4 space-y-1 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Vagas em Aberto</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {kpis?.vagasDisponiveis ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">
            de um total de {kpis?.totalVagas ?? 0} vagas criadas
          </p>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex border-b border-slate-200 gap-2 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setAbaAtiva('indicadores')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            abaAtiva === 'indicadores'
              ? 'border-sus-primary text-sus-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Indicadores & Distritos</span>
        </button>

        <button
          onClick={() => setAbaAtiva('abertura-vagas')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            abaAtiva === 'abertura-vagas'
              ? 'border-sus-primary text-sus-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Abertura de Bloco de Vagas</span>
        </button>

        <button
          onClick={() => setAbaAtiva('auditoria')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            abaAtiva === 'auditoria'
              ? 'border-sus-primary text-sus-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Trilha de Auditoria LGPD</span>
        </button>
      </div>

      {/* ======================================================= */}
      {/* ABA 1: INDICADORES E DISTRIBUIÇÃO                       */}
      {/* ======================================================= */}
      {abaAtiva === 'indicadores' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Especialidade */}
          <div className="card-sus space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sus-primary" />
              <span>Ocupação por Especialidade de Saúde</span>
            </h3>

            <div className="space-y-3">
              {metricas?.distribuicaoEspecialidade.map((esp) => {
                const total = kpis?.totalVagas || 1;
                const perc = Math.round((esp._count.vagas / total) * 100);
                return (
                  <div key={esp.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{esp.nome}</span>
                      <span className="text-slate-500">{esp._count.vagas} vagas ({perc}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-sus-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(perc, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vagas Ofertadas por UBS */}
          <div className="card-sus space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sus-green" />
              <span>Oferta de Vagas por UBS de Natal</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              {metricas?.distribuicaoUbs.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <strong className="block text-slate-800 text-sm">{u.nome}</strong>
                    <span className="text-slate-500">
                      Distrito {u.distritoSanitario} • {u.bairro}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                    {u._count.vagas} vagas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* ABA 2: ABERTURA DE BLOCO DE VAGAS                       */}
      {/* ======================================================= */}
      {abaAtiva === 'abertura-vagas' && (
        <div className="max-w-2xl mx-auto card-sus p-5 sm:p-6 space-y-5 border-t-4 border-t-sus-primary">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sus-primary" />
              <span>Abertura de Bloco de Vagas na Agenda Municipal</span>
            </h2>
            <p className="text-xs text-slate-500">
              Disponibilize de uma só vez vários horários de atendimento para uma UBS e Especialidade.
            </p>
          </div>

          {feedbackCriacao && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm ${
                feedbackCriacao.tipo === 'sucesso'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {feedbackCriacao.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <span className="font-semibold">{feedbackCriacao.texto}</span>
            </div>
          )}

          <form onSubmit={handleCriarBlocoVagas} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unidade Básica */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Unidade Básica de Saúde (UBS):
                </label>
                <select
                  value={formUbsId}
                  onChange={(e) => setFormUbsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sus-primary text-xs"
                >
                  {ubss.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.distritoSanitario})
                    </option>
                  ))}
                </select>
              </div>

              {/* Especialidade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Especialidade / Tipo de Atendimento:
                </label>
                <select
                  value={formEspecialidadeId}
                  onChange={(e) => setFormEspecialidadeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sus-primary text-xs"
                >
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Data da Vaga */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Data de Atendimento:
                </label>
                <input
                  type="date"
                  required
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sus-primary text-xs"
                />
              </div>

              {/* Turno */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Turno:</label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => aplicarHorariosRapidos('MANHA')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                      formTurno === 'MANHA'
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Manhã
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarHorariosRapidos('TARDE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                      formTurno === 'TARDE'
                        ? 'bg-blue-100 border-blue-300 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>

              {/* Duração da Consulta */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Duração estimada:
                </label>
                <select
                  value={formDuracao}
                  onChange={(e) => setFormDuracao(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sus-primary text-xs"
                >
                  <option value={20}>20 minutos (Coletas/Exames)</option>
                  <option value={30}>30 minutos (Clínico Geral)</option>
                  <option value={45}>45 minutos (Odontologia)</option>
                  <option value={60}>60 minutos (Procedimentos)</option>
                </select>
              </div>
            </div>

            {/* Horários Separados por Vírgula */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Horários a criar (separados por vírgula):
                </label>
                <span className="text-[11px] text-slate-400">Ex: 08:00, 08:30, 09:00</span>
              </div>
              <textarea
                rows={3}
                required
                value={horariosTexto}
                onChange={(e) => setHorariosTexto(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-sus-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loadingCriacao}
              className="w-full btn-primary py-3 font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingCriacao ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Publicar Bloco de Vagas na Agenda Pública</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================= */}
      {/* ABA 3: TRILHA DE AUDITORIA LGPD                         */}
      {/* ======================================================= */}
      {abaAtiva === 'auditoria' && (
        <div className="card-sus space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Trilha de Auditoria e Conformidade LGPD (RNF01)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Registro imutável de todas as ações de agendamento, check-in, falta e abertura de vagas.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              Últimos {metricas?.ultimosLogs.length || 0} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Detalhes</th>
                  <th className="py-2.5 px-3">IP de Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metricas?.ultimosLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {log.usuario?.nome || 'Sistema / Público'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.usuario?.perfil || 'AUTOMÁTICO'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {log.detalhesJson || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
