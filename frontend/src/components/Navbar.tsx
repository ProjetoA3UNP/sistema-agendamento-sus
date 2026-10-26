import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  HeartPulse,
  LogOut,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Hospital,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { useAccessibility } from '../contexts/AccessibilityContext.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { highContrast, toggleHighContrast, increaseFontSize, decreaseFontSize } = useAccessibility();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Barra de Acessibilidade Governamental (e-MAG / WCAG) */}
      <div className="bg-sus-dark text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-medium hidden sm:inline">
            SUS Natal • Secretaria Municipal de Saúde
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={decreaseFontSize}
              className="hover:text-white flex items-center gap-1 cursor-pointer focus:ring-1 focus:ring-white p-0.5 rounded"
              title="Diminuir tamanho da letra (A-)"
              aria-label="Diminuir fonte"
            >
              <ZoomOut className="w-3.5 h-3.5" /> A-
            </button>
            <button
              onClick={increaseFontSize}
              className="hover:text-white flex items-center gap-1 cursor-pointer focus:ring-1 focus:ring-white p-0.5 rounded"
              title="Aumentar tamanho da letra (A+)"
              aria-label="Aumentar fonte"
            >
              <ZoomIn className="w-3.5 h-3.5" /> A+
            </button>
            <span className="text-slate-500">|</span>
            <button
              onClick={toggleHighContrast}
              className="hover:text-white flex items-center gap-1 cursor-pointer focus:ring-1 focus:ring-white p-0.5 rounded"
              title="Alternar modo de alto contraste"
              aria-label="Alto Contraste"
            >
              {highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{highContrast ? 'Contraste Normal' : 'Alto Contraste'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegação */}
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logotipo SUS / Marca */}
        <Link to="/" className="flex items-center gap-2.5 text-sus-primary hover:opacity-90">
          <div className="w-9 h-9 rounded-lg bg-sus-primary flex items-center justify-center text-white shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-sus-primary">
              Gestão<span className="text-sus-green">SUS</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase text-slate-500 ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded">
              Natal-RN
            </span>
          </div>
        </Link>

        {/* Links de navegação baseados no perfil */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user && (
            <>
              {/* Links do Cidadão */}
              {user.perfil === 'CIDADAO' && (
                <>
                  <Link
                    to="/painel"
                    className="text-sm font-medium text-slate-600 hover:text-sus-primary px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                  >
                    Início
                  </Link>
                  <Link
                    to="/agendar"
                    className="text-sm font-medium text-slate-600 hover:text-sus-primary px-2.5 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4 text-sus-primary" />
                    <span>Agendar</span>
                  </Link>
                  <Link
                    to="/minhas-consultas"
                    className="text-sm font-medium text-slate-600 hover:text-sus-primary px-2.5 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Minhas Consultas</span>
                  </Link>
                </>
              )}

              {/* Links de Atendente (Recepção) */}
              {(user.perfil === 'ATENDENTE' || user.perfil === 'GESTOR') && (
                <Link
                  to="/recepcao"
                  className="text-sm font-medium text-slate-700 hover:text-sus-primary px-2.5 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Hospital className="w-4 h-4 text-sus-green" />
                  <span>Recepção / Triagem</span>
                </Link>
              )}

              {/* Links do Gestor */}
              {user.perfil === 'GESTOR' && (
                <Link
                  to="/gestor"
                  className="text-sm font-medium text-slate-700 hover:text-sus-primary px-2.5 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Painel SMS</span>
                </Link>
              )}

              {/* Usuário logado & Botão Sair */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.nome.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-medium text-sus-primary uppercase">
                    {user.perfil}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-sus-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sair do sistema"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs sm:text-sm py-1.5 px-3">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary text-xs sm:text-sm py-1.5 px-3">
                Cadastrar-se
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
