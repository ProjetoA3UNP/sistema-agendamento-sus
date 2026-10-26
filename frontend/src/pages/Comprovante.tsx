import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Calendar,
  Hospital,
  Printer,
  ArrowLeft,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { Agendamento } from '../types/index.js';

export const Comprovante: React.FC = () => {
  const { identificador } = useParams<{ identificador: string }>();
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarComprovante() {
      if (!identificador) return;
      try {
        const res = await api.get(`/agendamentos/comprovante/${identificador}`);
        setAgendamento(res.data);
      } catch (err: any) {
        setErro('Comprovante de agendamento não localizado.');
      } finally {
        setLoading(false);
      }
    }
    carregarComprovante();
  }, [identificador]);

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 space-y-2">
        <div className="w-8 h-8 border-3 border-sus-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Carregando comprovante digital oficial...</p>
      </div>
    );
  }

  if (erro || !agendamento) {
    return (
      <div className="max-w-md mx-auto card-sus p-8 text-center space-y-4 my-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Comprovante Não Encontrado</h2>
        <p className="text-xs text-slate-500">
          Não localizamos nenhuma consulta com o protocolo informado.
        </p>
        <Link to="/painel" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/painel"
          className="text-xs font-semibold text-slate-600 hover:text-sus-primary flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImprimir}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* CÉDULA OFICIAL DO COMPROVANTE (Estilizada para tela e impressão) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial do SUS */}
        <div className="text-center pb-4 border-b border-slate-200 space-y-1">
          <div className="flex items-center justify-center gap-2 text-sus-primary">
            <HeartPulse className="w-6 h-6 text-sus-green" />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight">
              SUS • Secretaria Municipal de Saúde de Natal
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Comprovante Oficial de Agendamento da Atenção Básica
          </p>
        </div>

        {/* Status de Confirmação & Protocolo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Consulta Confirmada na Rede Municipal</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Código de Protocolo
            </span>
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-sus-primary tracking-wider">
              {agendamento.codigoProtocolo}
            </strong>
          </div>
        </div>

        {/* QR Code de Triagem Presencial (US05.2 / RF06) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2.5">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <QRCodeSVG
              value={agendamento.qrCodeToken}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center max-w-xs">
            Apresente este <strong>QR Code</strong> ou informe seu <strong>CPF</strong> na recepção da UBS para registrar sua chegada.
          </p>
        </div>

        {/* Ficha Completa da Consulta */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
            <span className="text-slate-400 text-[11px] block">Dados do Paciente</span>
            <strong className="text-slate-800 block text-sm font-semibold">{agendamento.paciente?.nome}</strong>
            <div className="flex flex-wrap gap-x-4 text-slate-600 font-mono text-xs">
              <span>CPF: {agendamento.paciente?.cpf}</span>
              {agendamento.paciente?.cartaoSus && <span>Cartão SUS: {agendamento.paciente.cartaoSus}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sus-primary" />
                <span>Data & Turno</span>
              </span>
              <strong className="text-slate-800 block">
                {new Date(agendamento.vaga.data).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
              <span className="text-xs text-slate-600">
                Horário: <strong>{agendamento.vaga.horarioInicio}</strong> (Turno da {agendamento.vaga.turno.toLowerCase()})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Hospital className="w-3.5 h-3.5 text-sus-green" />
                <span>Unidade de Atendimento</span>
              </span>
              <strong className="text-slate-800 block">{agendamento.vaga.ubs.nome}</strong>
              <p className="text-[11px] text-slate-500">
                {agendamento.vaga.ubs.logradouro}, {agendamento.vaga.ubs.bairro}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Especialidade Clínica:</span>
            <strong className="text-sus-primary font-bold">{agendamento.vaga.especialidade.nome}</strong>
          </div>
        </div>

        {/* Orientações Finais */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-lg text-slate-600 text-[11px] leading-relaxed space-y-1">
          <strong className="block text-slate-800 text-xs">Instruções Importantes:</strong>
          <p>• Chegue com <strong>15 minutos de antecedência</strong> portando documento com foto.</p>
          <p>• Caso necessite cancelar, acesse o sistema com pelo menos <strong>24 horas de antecedência</strong> para disponibilizar a vaga a outro cidadão.</p>
        </div>

        {/* Rodapé do Comprovante */}
        <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100 font-mono">
          Gerado eletronicamente em: {new Date(agendamento.criadoEm).toLocaleString('pt-BR')} • Sistema Gestão SUS Natal-RN
        </div>
      </div>
    </div>
  );
};
