import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import type { Usuario } from '../types/index.js';

interface AuthContextData {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identificador: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: any) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarSessao() {
      const storagedToken = localStorage.getItem('@sus_natal:token');
      const storagedUser = localStorage.getItem('@sus_natal:usuario');

      if (storagedToken && storagedUser) {
        try {
          setToken(storagedToken);
          setUser(JSON.parse(storagedUser));
          // Revalidar token com o backend
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('@sus_natal:usuario', JSON.stringify(res.data));
        } catch (error) {
          console.warn('Sessão expirada ou inválida. Limpando dados locais.');
          logout();
        }
      }
      setIsLoading(false);
    }

    carregarSessao();
  }, []);

  const login = async (identificador: string, senha: string): Promise<Usuario> => {
    const res = await api.post('/auth/login', { identificador, senha });
    const { token: jwtToken, usuario } = res.data;

    localStorage.setItem('@sus_natal:token', jwtToken);
    localStorage.setItem('@sus_natal:usuario', JSON.stringify(usuario));

    setToken(jwtToken);
    setUser(usuario);

    return usuario;
  };

  const cadastrar = async (dados: any): Promise<Usuario> => {
    const res = await api.post('/auth/cadastro', dados);
    const { token: jwtToken, usuario } = res.data;

    localStorage.setItem('@sus_natal:token', jwtToken);
    localStorage.setItem('@sus_natal:usuario', JSON.stringify(usuario));

    setToken(jwtToken);
    setUser(usuario);

    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('@sus_natal:token');
    localStorage.removeItem('@sus_natal:usuario');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        cadastrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
