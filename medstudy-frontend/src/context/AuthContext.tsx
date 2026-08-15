// medstudy-frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  plano: 'gratuito' | 'premium_mensal' | 'premium_anual';
  isAdmin?: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  erro: string | null;
  codigoErro: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = process.env.REACT_APP_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem('medstudy_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medstudy_token'));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [codigoErro, setCodigoErro] = useState<string | null>(null);

  const salvarSessao = (novoToken: string, novoUsuario: Usuario) => {
    localStorage.setItem('medstudy_token', novoToken);
    localStorage.setItem('medstudy_usuario', JSON.stringify(novoUsuario));
    setToken(novoToken);
    setUsuario(novoUsuario);
  };

  const login = useCallback(async (email: string, senha: string) => {
    setCarregando(true);
    setErro(null);
    setCodigoErro(null);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, senha });
      salvarSessao(data.token, data.usuario);
      return true;
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível entrar.');
      setCodigoErro(err.response?.data?.codigo || null);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  // Não loga automaticamente — a conta só fica ativa depois de confirmar o email.
  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    setCarregando(true);
    setErro(null);
    setCodigoErro(null);
    try {
      await axios.post(`${API_URL}/api/auth/cadastro`, { nome, email, senha });
      return true;
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível criar a conta.');
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medstudy_token');
    localStorage.removeItem('medstudy_usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, token, carregando, erro, codigoErro, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
