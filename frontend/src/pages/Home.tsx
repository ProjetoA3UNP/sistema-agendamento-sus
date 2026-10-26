import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Hospital,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';
import type { Ubs } from '../types/index.js';

export const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ubss, setUbss] = useState<Ubs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.perfil === 'CIDADAO') navigate('/painel');
      else if (user.perfil === 'ATENDENTE') navigate('/recepcao');
      else if (user.perfil === 'GESTOR') navigate('/gestor');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    async function carregarUbss() {
      try {
        const res = await api.get('/ubs');
        setUbss(res.data);
      } catch (e) {
        console.error('Erro ao carregar catálogo de UBSs:', e);
      } finally {
        setLoading(false);
      }
    }
    carregarUbss();
  }, []);

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sus-dark to-sus-primary text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sistema Municipal de Agendamento • Natal-RN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Consultas no SUS sem filas de madrugada.
          </h1>

          <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
            Agende suas consultas na Unidade Básica de Saúde (UBS) do seu bairro de forma rápida,
            segura e transparente pelo celular ou computador.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/cadastro" className="btn-green text-sm sm:text-base py-3 px-6 shadow-md flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Cadastre-se Gratuitamente</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-white/20 hover:bg-white/30 font-medium transition-colors text-sm sm:text-base"
            >
              Já tenho conta (Entrar)
            </Link>
          </div>
        </div>

        {/* Fundo decorativo sutil */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <HeartPulse className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Como funciona o agendamento digital?
          </h2>
          <p className="text-slate-500 text-sm">
            Tudo pelo celular em poucos minutos com total conformidade à LGPD.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-sus flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-sus-primary flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-semibold text-slate-800">Escolha a Especialidade e UBS</h3>
            <p className="text-xs text-slate-500">
              Selecione Clínico Geral, Odontologia ou Pré-natal na UBS de referência do seu bairro em Natal.
            </p>
          </div>

          <div className="card-sus flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-sus-green flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-semibold text-slate-800">Selecione o Dia e Horário</h3>
            <p className="text-xs text-slate-500">
              Escolha o melhor turno (manhã ou tarde). As vagas são bloqueadas no banco sem conflitos.
            </p>
          </div>

          <div className="card-sus flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-semibold text-slate-800">Receba o Comprovante com QR Code</h3>
            <p className="text-xs text-slate-500">
              Apresente o QR Code no dia da consulta na recepção da UBS para check-in instantâneo.
            </p>
          </div>
        </div>
      </section>

      {/* Catálogo de UBSs Disponíveis */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <Hospital className="w-5 h-5 text-sus-primary" />
              <span>Unidades Básicas de Saúde Integradas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rede de Natal-RN organizada por Distritos Sanitários.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Carregando unidades...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ubss.map((ubs) => (
              <div key={ubs.id} className="card-sus hover:border-sus-primary/50 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-800 leading-snug">{ubs.nome}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-sus-primary">
                    Distrito {ubs.distritoSanitario}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{ubs.logradouro}, {ubs.bairro}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-1">
                  {ubs.especialidades?.map((esp) => (
                    <span
                      key={esp.especialidade.id}
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {esp.especialidade.nome}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
