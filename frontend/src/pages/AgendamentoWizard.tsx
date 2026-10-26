import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hospital,
  MapPin,
  Stethoscope,
  AlertCircle,
  AlertTriangle,
  FlaskConical,
  Info,
  Sparkles,
  Baby,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';
import type { Especialidade, Ubs, Vaga } from '../types/index.js';

export const AgendamentoWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado do Wizard (Etapa 1, 2 ou 3)
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // Dados carregados da API
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [ubss, setUbss] = useState<Ubs[]>([]);
  const [vagasDisponiveis, setVagasDisponiveis] = useState<Vaga[]>([]);

  // Seleções do Cidadão
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState<Especialidade | null>(null);
  const [ubsSelecionada, setUbsSelecionada] = useState<Ubs | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);

  // Filtros de UBS
  const [filtroDistrito, setFiltroDistrito] = useState<string>('TODOS');

  // Estados de Carregamento & Erro
  const [loading, setLoading] = useState(false);
  const [loadingUbss, setLoadingUbss] = useState(false);
  const [loadingVagas, setLoadingVagas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tempoResposta, setTempoResposta] = useState<number | null>(null);

  // 1. Carregar Especialidades iniciais
  useEffect(() => {
    async function carregarEspecialidades() {
      setLoading(true);
      try {
        const resEsp = await api.get('/ubs/especialidades');
        setEspecialidades(resEsp.data);

        // Pré-selecionar Clínico Geral como padrão
        if (resEsp.data.length > 0) {
          setEspecialidadeSelecionada(resEsp.data[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar especialidades:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarEspecialidades();
  }, []);

  // 2. Quando a especialidade mudar, carregar UBSs com contagem real de vagas disponíveis
  useEffect(() => {
    if (!especialidadeSelecionada) return;

    let ativo = true;
    async function carregarUbssComVagas() {
      setLoadingUbss(true);
      try {
        const resUbs = await api.get('/ubs', {
          params: { especialidadeId: especialidadeSelecionada?.id },
        });

        if (ativo) {
          const listaUbss: Ubs[] = resUbs.data;
          setUbss(listaUbss);

          // Se a UBS atualmente selecionada não tem vagas para esta especialidade,
          // sugerir automaticamente uma UBS com vagas disponíveis (preferindo a do bairro)
          const ubsAtual = listaUbss.find((u) => u.id === ubsSelecionada?.id);
          const ubsAtualTemVagas = (ubsAtual?.totalVagasDisponiveis ?? 0) > 0;

          if (!ubsAtual || !ubsAtualTemVagas) {
            // Tenta achar UBS do bairro que tenha vagas
            const ubsBairroComVagas = listaUbss.find(
              (u) =>
                user?.bairro &&
                u.bairro.toLowerCase() === user.bairro.toLowerCase() &&
                (u.totalVagasDisponiveis ?? 0) > 0,
            );

            // Ou a primeira UBS que tenha vagas
            const primeiraComVagas = listaUbss.find(
              (u) => (u.totalVagasDisponiveis ?? 0) > 0,
            );

            if (ubsBairroComVagas) {
              setUbsSelecionada(ubsBairroComVagas);
            } else if (primeiraComVagas) {
              setUbsSelecionada(primeiraComVagas);
            } else if (listaUbss.length > 0) {
              setUbsSelecionada(listaUbss[0]);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar disponibilidade de UBSs:', err);
      } finally {
        if (ativo) setLoadingUbss(false);
      }
    }

    carregarUbssComVagas();
    return () => {
      ativo = false;
    };
  }, [especialidadeSelecionada, user?.bairro]);

  // 3. Quando avançar para a Etapa 2, carregar vagas disponíveis para a UBS e Especialidade
  useEffect(() => {
    if (etapa === 2 && ubsSelecionada && especialidadeSelecionada) {
      async function carregarVagas() {
        setLoadingVagas(true);
        setErro(null);
        try {
          const res = await api.get(
            `/vagas/disponiveis?ubsId=${ubsSelecionada?.id}&especialidadeId=${especialidadeSelecionada?.id}`,
          );
          setVagasDisponiveis(res.data.vagas);
          setTempoResposta(res.data.tempoRespostaMs);

          // Selecionar a primeira data disponível
          if (res.data.vagas.length > 0) {
            const primeiraData = res.data.vagas[0].data.split('T')[0];
            setDataSelecionada(primeiraData);
          } else {
            setDataSelecionada('');
            setVagaSelecionada(null);
          }
        } catch (err) {
          console.error('Erro ao carregar vagas:', err);
          setErro('Falha ao carregar horários disponíveis.');
        } finally {
          setLoadingVagas(false);
        }
      }

      carregarVagas();
    }
  }, [etapa, ubsSelecionada, especialidadeSelecionada]);

  // Agrupamento de datas únicas disponíveis
  const datasUnicasDisponiveis = Array.from(
    new Set(vagasDisponiveis.map((v) => v.data.split('T')[0])),
  ).sort();

  // Vagas da data selecionada
  const vagasDaData = vagasDisponiveis.filter(
    (v) => v.data.split('T')[0] === dataSelecionada,
  );
  const vagasManha = vagasDaData.filter((v) => v.turno === 'MANHA');
  const vagasTarde = vagasDaData.filter((v) => v.turno === 'TARDE');

  // UBSs filtradas por distrito e ordenadas por disponibilidade (unidades com vagas primeiro)
  const ubssFiltradas = ubss
    .filter((u) => {
      if (filtroDistrito === 'TODOS') return true;
      return u.distritoSanitario === filtroDistrito;
    })
    .sort((a, b) => {
      // 1. Unidades com vagas abertas sempre vêm no topo
      const vagasA = a.totalVagasDisponiveis ?? 0;
      const vagasB = b.totalVagasDisponiveis ?? 0;
      if (vagasA > 0 && vagasB === 0) return -1;
      if (vagasA === 0 && vagasB > 0) return 1;

      // 2. Se ambas têm vagas, priorizar a UBS de referência do paciente
      const ehBairroA = user?.bairro && a.bairro.toLowerCase() === user.bairro.toLowerCase();
      const ehBairroB = user?.bairro && b.bairro.toLowerCase() === user.bairro.toLowerCase();
      if (ehBairroA && !ehBairroB) return -1;
      if (!ehBairroA && ehBairroB) return 1;

      // 3. Maior quantidade de vagas
      if (vagasA !== vagasB) return vagasB - vagasA;

      return a.nome.localeCompare(b.nome);
    });

  const totalVagasMunicipio = ubss.reduce((acc, u) => acc + (u.totalVagasDisponiveis ?? 0), 0);
  const ubssComVagas = ubss.filter((u) => (u.totalVagasDisponiveis ?? 0) > 0).length;

  // Confirmação final da consulta (Lock Pessimista no Backend)
  const handleConfirmarAgendamento = async () => {
    if (!vagaSelecionada) return;

    setLoading(true);
    setErro(null);

    try {
      const res = await api.post('/agendamentos', {
        vagaId: vagaSelecionada.id,
      });

      const protocolo = res.data.agendamento.codigoProtocolo;
      navigate(`/comprovante/${protocolo}`);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Erro ao confirmar agendamento.';

      if (status === 409) {
        setErro('Atenção: Esta vaga acabou de ser reservada por outro paciente no mesmo instante. Por favor, volte e selecione outro horário.');
      } else {
        setErro(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper para renderizar ícone da especialidade
  const renderIconeEspecialidade = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes('exame') || n.includes('coleta') || n.includes('laborat')) {
      return <FlaskConical className="w-5 h-5" />;
    }
    if (n.includes('odonto')) {
      return <Smile className="w-5 h-5" />;
    }
    if (n.includes('natal') || n.includes('gesta') || n.includes('obste')) {
      return <Baby className="w-5 h-5" />;
    }
    if (n.includes('enferm')) {
      return <ShieldCheck className="w-5 h-5" />;
    }
    return <Stethoscope className="w-5 h-5" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Barra de Progresso das 3 Etapas */}
      <div className="card-sus p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <div className={`flex items-center gap-2 ${etapa >= 1 ? 'text-sus-primary' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa >= 1 ? 'bg-sus-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
              1
            </span>
            <span className="hidden sm:inline">Especialidade & UBS</span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200">
            <div className={`h-full bg-sus-primary transition-all duration-300 ${etapa === 1 ? 'w-0' : etapa === 2 ? 'w-1/2' : 'w-full'}`} />
          </div>

          <div className={`flex items-center gap-2 ${etapa >= 2 ? 'text-sus-primary' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa >= 2 ? 'bg-sus-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
              2
            </span>
            <span className="hidden sm:inline">Data & Horário</span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200">
            <div className={`h-full bg-sus-primary transition-all duration-300 ${etapa === 3 ? 'w-full' : 'w-0'}`} />
          </div>

          <div className={`flex items-center gap-2 ${etapa === 3 ? 'text-sus-green' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 3 ? 'bg-sus-green text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </span>
            <span className="hidden sm:inline">Confirmação</span>
          </div>
        </div>
      </div>

      {/* Alerta de Erro */}
      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-semibold">Não foi possível prosseguir:</strong>
            <p>{erro}</p>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ETAPA 1: ESCOLHA DE ESPECIALIDADE E UBS COM VAGAS AO VIVO   */}
      {/* ========================================================== */}
      {etapa === 1 && (
        <div className="space-y-6">
          {/* 1.1 Escolha da Especialidade */}
          <div className="card-sus space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sus-primary" />
                <span>1. Escolha o Tipo de Atendimento ou Exame</span>
              </h2>
              <p className="text-xs text-slate-500">
                Selecione a especialidade de consulta ou coleta de exames que deseja realizar na rede municipal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {especialidades.map((esp) => {
                const selecionado = especialidadeSelecionada?.id === esp.id;
                const ehExame = esp.nome.toLowerCase().includes('exame');

                return (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => setEspecialidadeSelecionada(esp)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                      selecionado
                        ? ehExame
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                          : 'border-sus-primary bg-blue-50/60 ring-2 ring-sus-primary/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {ehExame && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Coleta UBS
                      </span>
                    )}

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selecionado
                          ? ehExame
                            ? 'bg-emerald-600 text-white'
                            : 'bg-sus-primary text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {renderIconeEspecialidade(esp.nome)}
                    </div>
                    <div className="space-y-0.5 pr-14">
                      <strong className="block text-sm text-slate-800">{esp.nome}</strong>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {esp.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Aviso Educativo sobre Exames no SUS */}
            {especialidadeSelecionada?.nome.toLowerCase().includes('exame') && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold block">
                    Exames disponíveis para agendamento direto na UBS:
                  </strong>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    Coletas laboratoriais de sangue em jejum, fezes, urina, preventivo do colo do útero (Papanicolau), testes rápidos (HIV, Sífilis, Hepatites B e C) e curva glicêmica.
                  </p>
                  <p className="text-[10px] text-emerald-700 italic">
                    *Exames especializados de imagem de alta complexidade (Ressonância, Tomografia, Ultrassom com doppler) continuam exigindo consulta médica prévia e encaminhamento via SISREG.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 1.2 Escolha da Unidade Básica de Saúde (UBS) com Indicador de Vagas */}
          <div className="card-sus space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Hospital className="w-5 h-5 text-sus-primary" />
                  <span>2. Escolha a Unidade Básica de Saúde (UBS)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Veja abaixo quais unidades possuem horários livres em tempo real para não perder tempo.
                </p>
              </div>

              {/* Filtro por Distrito */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Distrito:</span>
                <select
                  value={filtroDistrito}
                  onChange={(e) => setFiltroDistrito(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-sus-primary"
                >
                  <option value="TODOS">Todos os Distritos</option>
                  <option value="SUL">Distrito Sul</option>
                  <option value="LESTE">Distrito Leste</option>
                  <option value="NORTE">Distrito Norte</option>
                  <option value="OESTE">Distrito Oeste</option>
                </select>
              </div>
            </div>

            {/* Banner de Disponibilidade Geral */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Disponibilidade para <strong>{especialidadeSelecionada?.nome}</strong> em Natal:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {totalVagasMunicipio} vagas abertas
                </span>
                <span className="text-[11px] text-slate-500">em {ubssComVagas} unidades</span>
              </div>
            </div>

            {/* Lista de UBSs */}
            {loadingUbss ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-sus-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Consultando disponibilidade nas unidades de saúde...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {ubssFiltradas.map((ubs) => {
                  const selecionado = ubsSelecionada?.id === ubs.id;
                  const eUbsDoBairro = user?.bairro && ubs.bairro.toLowerCase() === user.bairro.toLowerCase();
                  const totalVagas = ubs.totalVagasDisponiveis ?? 0;
                  const temVagas = totalVagas > 0;

                  return (
                    <button
                      key={ubs.id}
                      type="button"
                      onClick={() => setUbsSelecionada(ubs)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative flex flex-col justify-between ${
                        selecionado
                          ? 'border-sus-primary bg-blue-50/70 ring-2 ring-sus-primary/30 shadow-sm'
                          : temVagas
                            ? 'border-slate-200 hover:border-sus-primary/50 bg-white'
                            : 'border-slate-200 bg-slate-50/80 opacity-75'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Distrito {ubs.distritoSanitario}
                          </span>

                          {eUbsDoBairro && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Sua UBS de Referência
                            </span>
                          )}
                        </div>

                        <strong className="block text-sm text-slate-800">{ubs.nome}</strong>

                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ubs.logradouro}, {ubs.bairro}</span>
                        </p>
                      </div>

                      {/* Indicador Visual Imediato de Vagas */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {temVagas ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {totalVagas} {totalVagas === 1 ? 'vaga aberta' : 'vagas abertas'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Sem vagas no momento
                          </span>
                        )}

                        {selecionado && (
                          <span className="text-[11px] font-bold text-sus-primary">
                            Selecionada ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão de Avançar com Feedback Claro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              {ubsSelecionada && (ubsSelecionada.totalVagasDisponiveis ?? 0) === 0 ? (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>A unidade selecionada está sem vagas. Escolha outra UBS com vagas abertas para avançar.</span>
                </p>
              ) : ubsSelecionada ? (
                <p className="text-xs text-slate-500">
                  Unidade selecionada: <strong className="text-slate-700">{ubsSelecionada.nome}</strong> ({ubsSelecionada.totalVagasDisponiveis} vagas)
                </p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={
                !especialidadeSelecionada ||
                !ubsSelecionada ||
                (ubsSelecionada.totalVagasDisponiveis ?? 0) === 0
              }
              onClick={() => setEtapa(2)}
              className="btn-primary py-3 px-6 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Avançar para Escolha de Data e Horário</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ETAPA 2: ESCOLHA DE DATA E HORÁRIO                         */}
      {/* ========================================================== */}
      {etapa === 2 && (
        <div className="space-y-6">
          {/* Card Resumo do Local e Especialidade */}
          <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 block text-xs">Unidade & Especialidade selecionadas:</span>
              <strong className="text-slate-800 font-bold">
                {ubsSelecionada?.nome} • {especialidadeSelecionada?.nome}
              </strong>
            </div>

            <button
              onClick={() => setEtapa(1)}
              className="text-xs text-sus-primary font-semibold hover:underline"
            >
              Alterar UBS/Especialidade
            </button>
          </div>

          <div className="card-sus space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sus-primary" />
                  <span>Escolha a Data e o Horário do Atendimento</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Os horários vagos são garantidos em tempo real pelo sistema municipal.
                </p>
              </div>

              {tempoResposta !== null && (
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Busca em: {tempoResposta}ms (RNF04 &lt; 500ms)
                </span>
              )}
            </div>

            {loadingVagas ? (
              <div className="p-12 text-center text-sm text-slate-400 space-y-2">
                <div className="w-7 h-7 border-3 border-sus-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Verificando disponibilidade de horários em tempo real...</p>
              </div>
            ) : vagasDisponiveis.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma vaga disponível para {especialidadeSelecionada?.nome} nesta unidade no momento.
                </p>
                <p className="text-xs text-slate-400">
                  Você pode voltar e selecionar outra Unidade Básica de Saúde que possui horários abertos.
                </p>
                <button onClick={() => setEtapa(1)} className="btn-secondary text-xs py-2 px-4">
                  Voltar e Escolher Outra UBS
                </button>
              </div>
            ) : (
              <>
                {/* Seleção de Datas Disponíveis */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Selecione o Dia:
                  </label>
                  <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {datasUnicasDisponiveis.map((dt) => {
                      const [ano, mes, dia] = dt.split('-').map(Number);
                      const dataObj = new Date(ano, mes - 1, dia);
                      const selecionado = dataSelecionada === dt;
                      const qtdVagasDia = vagasDisponiveis.filter((v) => v.data.split('T')[0] === dt).length;

                      return (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => {
                            setDataSelecionada(dt);
                            setVagaSelecionada(null);
                          }}
                          className={`px-4 py-2.5 rounded-xl border text-center shrink-0 transition-all cursor-pointer ${
                            selecionado
                              ? 'border-sus-primary bg-sus-primary text-white font-bold shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="block text-[11px] uppercase tracking-wider opacity-80">
                            {dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </span>
                          <span className="block text-base font-bold">
                            {String(dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                          </span>
                          <span className={`block text-[10px] mt-0.5 ${selecionado ? 'text-blue-100 font-semibold' : 'text-emerald-600 font-bold'}`}>
                            {qtdVagasDia} {qtdVagasDia === 1 ? 'vaga' : 'vagas'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seleção de Horários por Turno */}
                <div className="space-y-4 pt-2">
                  {/* Turno da Manhã */}
                  {vagasManha.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Turno da Manhã ({vagasManha.length} horários vagos)</span>
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {vagasManha.map((v) => {
                          const selecionado = vagaSelecionada?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setVagaSelecionada(v)}
                              className={`py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                                selecionado
                                  ? 'bg-sus-green border-sus-green text-white shadow-sm ring-2 ring-sus-green/30'
                                  : 'bg-white border-slate-200 hover:border-sus-green hover:bg-emerald-50/40 text-slate-800'
                              }`}
                            >
                              {v.horarioInicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Turno da Tarde */}
                  {vagasTarde.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Turno da Tarde ({vagasTarde.length} horários vagos)</span>
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {vagasTarde.map((v) => {
                          const selecionado = vagaSelecionada?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setVagaSelecionada(v)}
                              className={`py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                                selecionado
                                  ? 'bg-sus-green border-sus-green text-white shadow-sm ring-2 ring-sus-green/30'
                                  : 'bg-white border-slate-200 hover:border-sus-green hover:bg-emerald-50/40 text-slate-800'
                              }`}
                            >
                              {v.horarioInicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="btn-secondary py-2.5 px-4 flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <button
              type="button"
              disabled={!vagaSelecionada}
              onClick={() => setEtapa(3)}
              className="btn-primary py-2.5 px-6 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Avançar para Revisão</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ETAPA 3: RESUMO E CONFIRMAÇÃO (RESERVA ATÔMICA COM LOCK)   */}
      {/* ========================================================== */}
      {etapa === 3 && vagaSelecionada && (
        <div className="space-y-6">
          <div className="card-sus border-t-4 border-t-sus-green space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-sus-green" />
                <span>Confira os Dados do seu Agendamento</span>
              </h2>
              <p className="text-xs text-slate-500">
                Por favor, revise atentamente antes de efetivar a reserva no SUS.
              </p>
            </div>

            {/* Ficha Resumo */}
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block text-xs">Paciente / Cidadão:</span>
                  <strong className="text-slate-800">{user?.nome}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">CPF / Cartão SUS:</span>
                  <strong className="text-slate-800 font-mono">
                    {user?.cpf} • {user?.cartaoSus || 'Cadastrado'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block text-xs">Atendimento / Especialidade:</span>
                  <strong className="text-sus-primary font-bold text-base">
                    {vagaSelecionada.especialidade.nome}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Unidade Básica de Saúde:</span>
                  <strong className="text-slate-800">{vagaSelecionada.ubs.nome}</strong>
                  <p className="text-[11px] text-slate-500">
                    {vagaSelecionada.ubs.logradouro}, {vagaSelecionada.ubs.bairro}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-xs">Data do Atendimento:</span>
                  <strong className="text-slate-800 text-sm">
                    {new Date(vagaSelecionada.data).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Horário / Turno:</span>
                  <strong className="text-slate-800 text-sm">
                    {vagaSelecionada.horarioInicio} às {vagaSelecionada.horarioFim} (Turno da {vagaSelecionada.turno.toLowerCase()})
                  </strong>
                </div>
              </div>
            </div>

            {/* Aviso de Preparo e Pontualidade */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Chegue à unidade com <strong>15 minutos de antecedência</strong> portando documento oficial com foto e Cartão SUS. Se for coleta de sangue em jejum, siga as orientações médicas prévias. Para cancelamento, utilize o aplicativo com no mínimo 24h de antecedência.
              </span>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setEtapa(2)}
                disabled={loading}
                className="btn-secondary py-2.5 px-4 flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmarAgendamento}
                className="btn-green py-3 px-6 flex items-center gap-2 text-sm sm:text-base font-bold shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Agendamento</span>
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
