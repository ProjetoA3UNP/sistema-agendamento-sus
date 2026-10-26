import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { BAIRROS_NATAL, formatarCartaoSus, formatarCpf, formatarTelefone } from '../utils/masks.js';

export const Cadastro: React.FC = () => {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [bairro, setBairro] = useState('Ponta Negra');
  const [dataNascimento, setDataNascimento] = useState('');
  const [aceitouLgpd, setAceitouLgpd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!aceitouLgpd) {
      setErro('É obrigatório consentir com o Termo de Privacidade e Tratamento de Dados de Saúde (LGPD).');
      return;
    }

    setLoading(true);

    try {
      await cadastrar({
        nome,
        cpf,
        cartaoSus: cartaoSus || undefined,
        email,
        senha,
        telefone: telefone || undefined,
        bairro,
        dataNascimento: dataNascimento || undefined,
        aceitouTermosLgpd: aceitouLgpd,
      });

      navigate('/painel');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao realizar cadastro. Verifique os dados.';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-sus-green text-white flex items-center justify-center mx-auto shadow-md">
          <UserPlus className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Cadastro de Cidadão no SUS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Vincule seu Cartão SUS e tenha acesso ao agendamento de consultas em Natal-RN.
        </p>
      </div>

      {/* Formulário */}
      <div className="card-sus border-t-4 border-t-sus-green space-y-5">
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria José da Silva"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors"
              />
            </div>
          </div>

          {/* Linha dupla: CPF e Cartão SUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                CPF *
              </label>
              <input
                type="text"
                required
                value={cpf}
                maxLength={14}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Cartão SUS (CNS)
              </label>
              <input
                type="text"
                value={cartaoSus}
                maxLength={18}
                onChange={(e) => setCartaoSus(formatarCartaoSus(e.target.value))}
                placeholder="000 0000 0000 0000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors font-mono"
              />
            </div>
          </div>

          {/* Linha dupla: Data de Nasc e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  maxLength={15}
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(84) 99999-0000"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Bairro em Natal-RN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Bairro de Residência em Natal-RN *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors bg-white"
              >
                {BAIRROS_NATAL.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Usado para sugerir automaticamente a UBS de referência mais próxima à sua casa.
            </p>
          </div>

          {/* Linha dupla: E-mail e Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                E-mail para Login *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Senha (mín. 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sus-green focus:ring-1 focus:ring-sus-green transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Consentimento Formal LGPD (RNF01) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="aceiteLgpd"
                checked={aceitouLgpd}
                onChange={(e) => setAceitouLgpd(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sus-green focus:ring-sus-green cursor-pointer"
              />
              <label htmlFor="aceiteLgpd" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                <strong>Declaro e consinto:</strong> Autorizo o tratamento dos meus dados pessoais e dados sensíveis de saúde para fins exclusivos de regulação, marcação de consultas e emissão de comprovantes na rede municipal de saúde de Natal-RN, conforme preconizado pela <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
              </label>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-green py-2.5 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Cadastro e Acessar</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>Já tem cadastro? </span>
          <Link to="/login" className="font-semibold text-sus-green hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
