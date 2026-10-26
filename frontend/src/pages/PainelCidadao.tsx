import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  HeartPulse,
  Hospital,
  MapPin,
  QrCode,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';
import type { Agendamento, Ubs } from '../types/index.js';

export const PainelCidadao: React.FC = () => {
  const { user } = useAuth();
  const [proximaConsulta, setProximaConsulta] = useState<Agendamento | null>(null);
  const [ubsReferencia, setUbsReferencia] = useState<Ubs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        // 1. Carregar consultas ativas
        const resConsultas = await api.get('/agendamentos/minhas');
        if (resConsultas.data.proximas && resConsultas.data.proximas.length > 0) {
          setProximaConsulta(resConsultas.data.proximas[0]);
        }

        // 2. Carregar UBS do bairro do cidadão
        if (user?.bairro) {
          const resUbs = await api.get(`/ubs?bairro=${encodeURIComponent(user.bairro)}`);
          if (resUbs.data && resUbs.data.length > 0) {
            setUbsReferencia(resUbs.data[0]);
          } else {
            // Se não tiver UBS com nome exato do bairro, buscar qualquer uma do catálogo
            const todasUbss = await api.get('/ubs');
            if (todasUbss.data.length > 0) setUbsReferencia(todasUbss.data[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosDashboard();
  }, [user]);

  return (
    <div className="space-y-6 sm:space-y-8 py-2">
      {/* Banner de Boas-vindas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sus-primary">
            <HeartPulse className="w-4 h-4 text-sus-green" />
            <span>Cartão Nacional de Saúde: {user?.cartaoSus || 'Cadastrado'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Olá, {user?.nome.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Bairro cadastrado: <strong>{user?.bairro || 'Natal-RN'}</strong></span>
          </p>
        </div>

        {/* CTA Principal de Agendar */}
        <Link
          to="/agendar"
          className="btn-primary py-3 px-6 shadow-md flex items-center justify-center gap-2.5 text-sm sm:text-base font-semibold"
        >
          <Calendar className="w-5 h-5" />
          <span>Agendar Nova Consulta</span>
        </Link>
      </div>

      {/* Grid Principal: Próxima Consulta & UBS de Referência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Próxima Consulta Agendada (Ocupa 2 colunas) */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sus-primary" />
              <span>Próxima Consulta Agendada</span>
            </h2>
            <Link to="/minhas-consultas" className="text-xs font-semibold text-sus-primary hover:underline flex items-center gap-1">
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="card-sus p-8 text-center text-sm text-slate-400 animate-pulse">
              Carregando agendamentos...
            </div>
          ) : proximaConsulta ? (
            <div className="card-sus border-l-4 border-l-sus-green space-y-4 bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sus-green">
                    {proximaConsulta.vaga.especialidade.nome}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">
                    {proximaConsulta.vaga.ubs.nome}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proximaConsulta.vaga.ubs.logradouro}, {proximaConsulta.vaga.ubs.bairro}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {proximaConsulta.status === 'AGENDADO' ? 'Confirmada' : proximaConsulta.status}
                  </span>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Protocolo: <strong>{proximaConsulta.codigoProtocolo}</strong>
                  </p>
                </div>
              </div>

              {/* Data e Horário destacados */}
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-sus-green flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Data da Consulta</span>
                    <strong className="text-sm text-slate-800">
                      {new Date(proximaConsulta.vaga.data).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'long',
                      })}
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Horário / Turno</span>
                  <strong className="text-sm text-slate-800">
                    {proximaConsulta.vaga.horarioInicio} ({proximaConsulta.vaga.turno.toLowerCase()})
                  </strong>
                </div>
              </div>

              {/* Botão de Ver Comprovante / QR Code */}
              <div className="flex justify-end pt-1">
                <Link
                  to={`/comprovante/${proximaConsulta.codigoProtocolo}`}
                  className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Ver Comprovante & QR Code</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-sus p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Você não possui consultas agendadas no momento.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Precisa de atendimento com Clínico Geral, Dentista ou Enfermagem? Reserve seu horário online.
              </p>
              <Link to="/agendar" className="btn-primary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Marcar Minha Consulta</span>
              </Link>
            </div>
          )}
        </div>

        {/* Card 2: Minha UBS de Referência (Ocupa 1 coluna) */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Hospital className="w-5 h-5 text-sus-primary" />
            <span>UBS de Referência</span>
          </h2>

          {ubsReferencia ? (
            <div className="card-sus space-y-3.5">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-sus-primary">
                  Distrito {ubsReferencia.distritoSanitario}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1.5">
                  {ubsReferencia.nome}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <span>{ubsReferencia.logradouro}, {ubsReferencia.bairro}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Atendimento:</span>
                  <span className="font-semibold text-slate-700">
                    {ubsReferencia.horarioAbertura} às {ubsReferencia.horarioFechamento}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telefone:</span>
                  <span className="font-semibold text-slate-700">
                    {ubsReferencia.telefone || '(84) 3232-0000'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/agendar"
                  className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <span>Ver vagas desta unidade</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-sus p-6 text-center text-xs text-slate-400">
              Carregando UBS de referência...
            </div>
          )}
        </div>
      </div>

      {/* Avisos Importantes de Comparecimento */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-sus-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <strong className="block font-semibold text-slate-900 text-sm">
            Orientações para o dia da consulta:
          </strong>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
            <li>Chegue com pelo menos <strong>15 minutos de antecedência</strong> do horário agendado.</li>
            <li>Apresente seu <strong>documento oficial com foto (RG/CNH)</strong> e o <strong>Cartão SUS</strong>.</li>
            <li>Tenha em mãos o <strong>Comprovante Digital</strong> com o QR Code na tela do celular ou impresso para a triagem.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
