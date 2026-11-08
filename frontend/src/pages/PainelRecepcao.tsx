import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Hospital,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  QrCode,
  Calendar,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';
import type { Agendamento, StatusAgendamento, Ubs } from '../types/index.js';
import { formatarCpf } from '../utils/masks.js';

export const PainelRecepcao: React.FC = () => {
  // Lista de UBSs
  const [ubss, setUbss] = useState<Ubs[]>([]);
  const [ubsSelecionadaId, setUbsSelecionadaId] = useState<string>('');
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Agenda do dia
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');

  // Check-in Manual
  const [docBusca, setDocBusca] = useState('');
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Scanner de QR Code
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const [scannerIniciando, setScannerIniciando] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // 1. Carregar lista de UBSs
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

  // 2. Carregar agenda do dia quando UBS ou data mudam
  const carregarAgenda = async () => {
    if (!ubsSelecionadaId) return;
    setLoadingAgenda(true);
    try {
      const res = await api.get('/agendamentos/agenda-dia', {
        params: {
          ubsId: ubsSelecionadaId,
          data: dataSelecionada,
        },
      });
      setAgendamentos(res.data);
    } catch (err) {
      console.error('Erro ao carregar agenda do dia:', err);
    } finally {
      setLoadingAgenda(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, [ubsSelecionadaId, dataSelecionada]);

  // Limpeza do scanner ao desmontar componente
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // 3. Executar Check-in com Token, Protocolo ou CPF
  const executarCheckIn = async (identificador: string) => {
    setLoadingCheckIn(true);
    setMensagemSucesso(null);
    setMensagemErro(null);

    try {
      let payload: { qrCodeToken?: string; codigoProtocolo?: string; cpf?: string } = {};

      const idLimpo = identificador.trim();
      if (idLimpo.includes('/comprovante/')) {
        const partes = idLimpo.split('/comprovante/');
        payload.codigoProtocolo = partes[1].trim();
      } else if (idLimpo.startsWith('NAT-')) {
        payload.codigoProtocolo = idLimpo;
      } else if (idLimpo.replace(/\D/g, '').length === 11) {
        payload.cpf = idLimpo;
      } else {
        payload.qrCodeToken = idLimpo;
      }

      const res = await api.post('/agendamentos/check-in', payload);
      setMensagemSucesso(res.data.mensagem || 'Check-in confirmado com sucesso!');
      setDocBusca('');

      // Atualiza a tabela na hora
      await carregarAgenda();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao realizar check-in.';
      setMensagemErro(msg);
    } finally {
      setLoadingCheckIn(false);
    }
  };

  // 4. Controle do Scanner de Câmera
  const toggleScanner = async () => {
    if (scannerAtivo) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setScannerAtivo(false);
      return;
    }

    setScannerIniciando(true);
    setMensagemErro(null);

    try {
      const html5QrCode = new Html5Qrcode('reader-recepcao');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Quando lê um QR code
          await html5QrCode.stop();
          setScannerAtivo(false);
          executarCheckIn(decodedText);
        },
        () => {}, // ignore scan frame errors
      );

      setScannerAtivo(true);
    } catch (err: any) {
      console.error('Erro ao iniciar câmera:', err);
      setMensagemErro(
        'Não foi possível acessar a câmera do dispositivo. Verifique as permissões de vídeo do seu navegador ou use a busca manual por CPF/Protocolo abaixo.',
      );
      setScannerAtivo(false);
    } finally {
      setScannerIniciando(false);
    }
  };

  // 5. Registrar Falta
  const handleRegistrarFalta = async (agendamentoId: string, nomePaciente: string) => {
    if (!window.confirm(`Confirma o registro de FALTA (não comparecimento) para ${nomePaciente}?`)) {
      return;
    }

    try {
      await api.patch(`/agendamentos/${agendamentoId}/falta`);
      setMensagemSucesso(`Falta registrada para ${nomePaciente}.`);
      await carregarAgenda();
    } catch (err: any) {
      setMensagemErro(err.response?.data?.message || 'Erro ao registrar falta.');
    }
  };

  // Filtros de listagem
  const agendamentosFiltrados = agendamentos.filter((a) => {
    // Filtro de status
    if (filtroStatus !== 'TODOS' && a.status !== filtroStatus) return false;

    // Filtro de busca de texto
    if (buscaTexto.trim()) {
      const t = buscaTexto.toLowerCase();
      const nomeMatch = a.paciente?.nome.toLowerCase().includes(t);
      const cpfMatch = a.paciente?.cpf.includes(buscaTexto.replace(/\D/g, ''));
      const protoMatch = a.codigoProtocolo.toLowerCase().includes(t);
      return nomeMatch || cpfMatch || protoMatch;
    }

    return true;
  });

  // Contadores do dia
  const totalGeral = agendamentos.length;
  const totalCheckIn = agendamentos.filter((a) => a.status === 'CHECK_IN').length;
  const totalEmAtendimento = agendamentos.filter((a) => a.status === 'EM_ATENDIMENTO').length;
  const totalFinalizados = agendamentos.filter((a) => a.status === 'FINALIZADO').length;
  const totalAguardando = agendamentos.filter((a) => a.status === 'AGENDADO').length;
  const totalFaltas = agendamentos.filter((a) => a.status === 'FALTA').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel da Recepção */}
      <div className="bg-gradient-to-r from-emerald-800 to-sus-dark text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
              <Hospital className="w-3.5 h-3.5" />
              Recepção & Triagem Presencial
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Painel da Recepção da UBS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Validação de presença via QR Code ou CPF e controle da fila de acolhimento do SUS.
          </p>
        </div>

        {/* Seletores de Unidade e Data */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
            <Hospital className="w-4 h-4 text-emerald-300 ml-1" />
            <select
              value={ubsSelecionadaId}
              onChange={(e) => setUbsSelecionadaId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              {ubss.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-800">
                  {u.nome} ({u.bairro})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-300 ml-1" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            />
          </div>

          <button
            onClick={carregarAgenda}
            disabled={loadingAgenda}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Atualizar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAgenda ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* CARD PRINCIPAL: VALIDADOR DE CHEGADA (QR CODE & CPF) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Validação Rápida */}
        <div className="card-sus lg:col-span-1 space-y-4 border-t-4 border-t-emerald-600">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Realizar Check-in de Chegada</span>
            </h2>
            <p className="text-xs text-slate-500">
              Escaneie o QR Code do comprovante digital ou digite o CPF do paciente.
            </p>
          </div>

          {/* Botão de Scanner de Câmera */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={toggleScanner}
              disabled={scannerIniciando}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                scannerAtivo
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {scannerIniciando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : scannerAtivo ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Desativar Câmera</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Escanear QR Code com a Câmera</span>
                </>
              )}
            </button>

            {/* Área de renderização do leitor da câmera */}
            <div
              id="reader-recepcao"
              className={`rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-900 ${
                scannerAtivo ? 'block' : 'hidden'
              }`}
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-2 text-[11px] font-bold text-slate-400 uppercase">
              ou busca manual
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Formulário de Busca por CPF ou Protocolo */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (docBusca.trim()) executarCheckIn(docBusca);
            }}
            className="space-y-2.5"
          >
            <label className="block text-xs font-semibold text-slate-700">
              CPF ou Protocolo do Comprovante:
            </label>
            <div className="relative">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={docBusca}
                onChange={(e) => {
                  const val = e.target.value;
                  // Se parecer CPF, aplica máscara; senão mantém protocolo
                  if (/^\d+$/.test(val.replace(/\D/g, '')) && val.length <= 14) {
                    setDocBusca(formatarCpf(val));
                  } else {
                    setDocBusca(val.toUpperCase());
                  }
                }}
                placeholder="000.000.000-00 ou NAT-2026-XXXX"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loadingCheckIn || !docBusca.trim()}
              className="w-full btn-green py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 font-semibold"
            >
              {loadingCheckIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirmar Presença (Check-in)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lado Direito: Cards de Indicadores do Turno */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-sus p-3 sm:p-4 border-l-4 border-l-slate-400 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total do Dia</span>
              <div className="text-xl sm:text-2xl font-black text-slate-800">{totalGeral}</div>
              <span className="text-[10px] text-slate-400">Consultas marcadas</span>
            </div>

            <div className="card-sus p-3 sm:p-4 border-l-4 border-l-amber-500 space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase">Aguardando</span>
              <div className="text-xl sm:text-2xl font-black text-amber-700">{totalAguardando}</div>
              <span className="text-[10px] text-slate-400">Ainda não chegaram</span>
            </div>

            <div className="card-sus p-3 sm:p-4 border-l-4 border-l-emerald-600 space-y-1 bg-emerald-50/40">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Na Espera</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800">{totalCheckIn}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Check-in realizado</span>
            </div>

            <div className="card-sus p-3 sm:p-4 border-l-4 border-l-blue-600 space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase">Atendidos</span>
              <div className="text-xl sm:text-2xl font-black text-blue-800">
                {totalEmAtendimento + totalFinalizados}
              </div>
              <span className="text-[10px] text-slate-400">Em consulta / Concluído</span>
            </div>
          </div>

          {/* Filtros da Tabela */}
          <div className="card-sus p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Abas de Status */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroStatus('TODOS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroStatus === 'TODOS'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({totalGeral})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('CHECK_IN')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroStatus === 'CHECK_IN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Presentes ({totalCheckIn})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('AGENDADO')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroStatus === 'AGENDADO'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  🟡 Aguardando ({totalAguardando})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('FALTA')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroStatus === 'FALTA'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  🔴 Faltas ({totalFaltas})
                </button>
              </div>

              {/* Barra de Busca de Paciente */}
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  placeholder="Buscar paciente ou CPF..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Tabela da Agenda do Dia */}
            {loadingAgenda ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Carregando escala da UBS...</p>
              </div>
            ) : agendamentosFiltrados.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                <Filter className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Nenhum agendamento encontrado.</p>
                <p>Altere a data ou o filtro de status para ver outros atendimentos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Paciente</th>
                      <th className="py-2.5 px-3">Especialidade / Profissional</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ações da Recepção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agendamentosFiltrados.map((item) => {
                      const status = item.status as StatusAgendamento;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Horário */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {item.vaga.horarioInicio}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Turno da {item.vaga.turno.toLowerCase()}
                            </span>
                          </td>

                          {/* Paciente */}
                          <td className="py-3 px-3">
                            <strong className="block text-slate-800 text-xs sm:text-sm">
                              {item.paciente?.nome}
                            </strong>
                            <div className="text-[11px] text-slate-500 font-mono">
                              CPF: {item.paciente?.cpf} • Cartão SUS: {item.paciente?.cartaoSus || 'Cadastrado'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Prot: {item.codigoProtocolo}
                            </span>
                          </td>

                          {/* Especialidade */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-sus-primary block">
                              {item.vaga.especialidade.nome}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.vaga.medico?.nome || 'Equipe de Plantão'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {status === 'AGENDADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Aguardando Chegada
                              </span>
                            )}
                            {status === 'CHECK_IN' && (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Presente na UBS
                                </span>
                                {item.checkInEm && (
                                  <span className="block text-[10px] text-slate-400">
                                    Check-in: {new Date(item.checkInEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )}
                            {status === 'EM_ATENDIMENTO' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Em Atendimento
                              </span>
                            )}
                            {status === 'FINALIZADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                Concluído
                              </span>
                            )}
                            {status === 'FALTA' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                                Falta Registrada
                              </span>
                            )}
                            {status === 'CANCELADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                                Cancelado
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {status === 'AGENDADO' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => executarCheckIn(item.codigoProtocolo)}
                                  className="btn-green py-1 px-2.5 text-xs flex items-center gap-1 font-semibold"
                                  title="Confirmar presença presencial"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Check-in</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRegistrarFalta(item.id, item.paciente?.nome || 'Paciente')}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Marcar Falta / Não Comparecimento"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            {status === 'CHECK_IN' && (
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                                <span>Aguardando Chamada</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
