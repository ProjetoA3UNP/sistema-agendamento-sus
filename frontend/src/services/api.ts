import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@sus_natal:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar expiração de sessão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se receber 401 e não estiver na rota de login/cadastro, limpar sessão
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/cadastro')) {
        localStorage.removeItem('@sus_natal:token');
        localStorage.removeItem('@sus_natal:usuario');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
