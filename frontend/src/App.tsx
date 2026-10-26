import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { AccessibilityProvider } from './contexts/AccessibilityContext.js';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Home } from './pages/Home.js';
import { Login } from './pages/Login.js';
import { Cadastro } from './pages/Cadastro.js';
import { PainelCidadao } from './pages/PainelCidadao.js';
import { AgendamentoWizard } from './pages/AgendamentoWizard.js';
import { Comprovante } from './pages/Comprovante.js';
import { MinhasConsultas } from './pages/MinhasConsultas.js';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Rotas Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/comprovante/:identificador" element={<Comprovante />} />

              {/* Rotas Protegidas do Cidadão (Telas 3 a 8 do Figma) */}
              <Route element={<ProtectedRoute allowedRoles={['CIDADAO', 'GESTOR', 'ATENDENTE']} />}>
                <Route path="/painel" element={<PainelCidadao />} />
                <Route path="/agendar" element={<AgendamentoWizard />} />
                <Route path="/minhas-consultas" element={<MinhasConsultas />} />
              </Route>

              {/* Rotas Protegidas de Funcionários da UBS (Fase 7) */}
              <Route element={<ProtectedRoute allowedRoles={['ATENDENTE', 'GESTOR']} />}>
                <Route path="/recepcao" element={<div className="p-8 text-center text-slate-600">Painel de Recepção & Triagem com Câmera QR (Fase 7)</div>} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['GESTOR']} />}>
                <Route path="/gestor" element={<div className="p-8 text-center text-slate-600">Painel Gestor da SMS (Fase 7)</div>} />
              </Route>

              {/* Redirecionamento Padrão */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
};

export default App;
