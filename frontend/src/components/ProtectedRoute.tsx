import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import type { Role } from '../types/index.js';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-sus-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Verificando credenciais...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.perfil)) {
    // Redirecionar para o painel apropriado do perfil caso tente acessar rota não autorizada
    if (user.perfil === 'ATENDENTE') return <Navigate to="/recepcao" replace />;
    if (user.perfil === 'GESTOR') return <Navigate to="/gestor" replace />;
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
};
