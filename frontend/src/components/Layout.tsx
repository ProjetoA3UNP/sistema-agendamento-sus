import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { ShieldCheck } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sus-green" />
            <span>Sistema em conformidade com a <strong>LGPD</strong> e padrões de acessibilidade <strong>e-MAG / WCAG</strong>.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Rede Municipal de Atenção Básica</span>
            <span>•</span>
            <span className="font-semibold text-slate-600">Natal-RN</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
