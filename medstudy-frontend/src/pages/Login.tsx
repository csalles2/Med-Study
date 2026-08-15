// medstudy-frontend/src/pages/Login.tsx
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function Login() {
  const { login, carregando, erro, codigoErro } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [reenviado, setReenviado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const sucesso = await login(email, senha);
    if (sucesso) navigate('/app');
  }

  async function reenviarVerificacao() {
    try {
      await axios.post(`${API_URL}/api/auth/reenviar-verificacao`, { email });
      setReenviado(true);
    } catch {
      setReenviado(true); // mesma resposta genérica por segurança
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <div className="auth-marca">MedStudy</div>
        <h1 className="auth-titulo">Entrar</h1>
        <p className="auth-subtitulo">Continue seus estudos de onde parou.</p>

        {erro && (
          <div className="auth-erro">
            {erro}
            {codigoErro === 'EMAIL_NAO_VERIFICADO' && (
              <div style={{ marginTop: 8 }}>
                {reenviado ? (
                  'Se ainda não tiver confirmado, o novo link já foi enviado.'
                ) : (
                  <button type="button" onClick={reenviarVerificacao} style={{ background: 'none', border: 'none', color: '#f0a9a8', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13.5 }}>
                    Reenviar email de confirmação
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={aoEnviar}>
          <div className="auth-campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-campo">
  <label htmlFor="senha">Senha</label>

  <div style={{ position: 'relative' }}>
    <input
      id="senha"
      type={mostrarSenha ? 'text' : 'password'}
      value={senha}
      onChange={(e) => setSenha(e.target.value)}
      placeholder="••••••••"
      required
      autoComplete="current-password"
      style={{ paddingRight: 70 }}
    />

      <button
        type="button"
        onClick={() => setMostrarSenha(!mostrarSenha)}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}
      >
        {mostrarSenha ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  </div>

          <div style={{ textAlign: 'right', marginBottom: 18 }}>
            <Link to="/esqueci-senha" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Esqueci minha senha
            </Link>
          </div>

          <button type="submit" className="btn-primary auth-botao-full" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-rodape">
          Ainda não tem conta? <Link to="/cadastro">Criar conta grátis</Link>
        </div>
      </div>
    </div>
  );
}
