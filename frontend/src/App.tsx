import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { AccessibilityProvider } from './contexts/AccessibilityContext.js';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Home } from './pages/Home.js';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Rotas Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<div className="p-8 text-center text-slate-600">Tela de Login (Fase 6)</div>} />
              <Route path="/cadastro" element={<div className="p-8 text-center text-slate-600">Tela de Cadastro (Fase 6)</div>} />
              <Route path="/comprovante/:identificador" element={<div className="p-8 text-center text-slate-600">Comprovante Digital (Fase 6)</div>} />

              {/* Rotas Protegidas do Cidadão */}
              <Route element={<ProtectedRoute allowedRoles={['CIDADAO', 'GESTOR', 'ATENDENTE']} />}>
                <Route path="/painel" element={<div className="p-8 text-center text-slate-600">Dashboard do Cidadão (Fase 6)</div>} />
                <Route path="/agendar" element={<div className="p-8 text-center text-slate-600">Fluxo de Agendamento em Etapas (Fase 6)</div>} />
                <Route path="/minhas-consultas" element={<div className="p-8 text-center text-slate-600">Minhas Consultas & Histórico (Fase 6)</div>} />
              </Route>

              {/* Rotas Protegidas do Atendente / Recepção da UBS */}
              <Route element={<ProtectedRoute allowedRoles={['ATENDENTE', 'GESTOR']} />}>
                <Route path="/recepcao" element={<div className="p-8 text-center text-slate-600">Painel de Recepção & Triagem com Câmera QR (Fase 7)</div>} />
              </Route>

              {/* Rotas Protegidas do Gestor da SMS */}
              <Route element={<ProtectedRoute allowedRoles={['GESTOR']} />}>
                <Route path="/gestor" element={<div className="p-8 text-center text-slate-600">Painel Gestor da SMS (Fase 7)</div>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
};

export default App;
