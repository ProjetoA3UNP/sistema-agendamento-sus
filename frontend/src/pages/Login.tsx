import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, KeyRound, Lock, LogIn, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const usuario = await login(identificador, senha);
      if (usuario.perfil === 'ATENDENTE') {
        navigate('/recepcao');
      } else if (usuario.perfil === 'GESTOR') {
        navigate('/gestor');
      } else {
        navigate('/painel');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao autenticar. Verifique seus dados.';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  const preencherContaTeste = (id: string, pass: string) => {
    setIdentificador(id);
    setSenha(pass);
    setErro(null);
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-sus-primary text-white flex items-center justify-center mx-auto shadow-md">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Acesso ao Sistema SUS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Informe seu CPF ou E-mail cadastrado para acessar a rede municipal.
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="card-sus border-t-4 border-t-sus-primary space-y-5">
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              CPF ou E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Ex: 123.456.789-00 ou seu@email.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-primary focus:ring-1 focus:ring-sus-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Senha de Acesso
              </label>
              <span className="text-[11px] text-sus-primary hover:underline cursor-pointer">
                Esqueceu a senha?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-primary focus:ring-1 focus:ring-sus-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>Ainda não tem cadastro no SUS? </span>
          <Link to="/cadastro" className="font-semibold text-sus-primary hover:underline">
            Cadastrar-se agora
          </Link>
        </div>
      </div>

      {/* Contas de Demonstração / Testes (Acesso Rápido) */}
      <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
          <span>Contas de Demonstração (Clique para preencher):</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => preencherContaTeste('joao.silva@email.com', 'Senha@123')}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-sus-primary text-left transition-colors flex flex-col cursor-pointer"
          >
            <span className="font-semibold text-slate-800">👤 Cidadão</span>
            <span className="text-[10px] text-slate-500">joao.silva@email.com</span>
          </button>

          <button
            type="button"
            onClick={() => preencherContaTeste('atendente.pontanegra@susnatal.rn.gov.br', 'Senha@123')}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-sus-green text-left transition-colors flex flex-col cursor-pointer"
          >
            <span className="font-semibold text-slate-800">🏥 Recepção UBS</span>
            <span className="text-[10px] text-slate-500">atendente.pontanegra...</span>
          </button>

          <button
            type="button"
            onClick={() => preencherContaTeste('dra.marina@susnatal.rn.gov.br', 'Senha@123')}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-500 text-left transition-colors flex flex-col cursor-pointer"
          >
            <span className="font-semibold text-slate-800">🩺 Médica</span>
            <span className="text-[10px] text-slate-500">dra.marina@susnatal...</span>
          </button>

          <button
            type="button"
            onClick={() => preencherContaTeste('gestor@susnatal.rn.gov.br', 'Senha@123')}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-amber-500 text-left transition-colors flex flex-col cursor-pointer"
          >
            <span className="font-semibold text-slate-800">🏛️ Gestor SMS</span>
            <span className="text-[10px] text-slate-500">gestor@susnatal...</span>
          </button>
        </div>
      </div>
    </div>
  );
};
