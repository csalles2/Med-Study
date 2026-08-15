// medstudy-frontend/src/pages/EsqueciSenha.tsx
import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await axios.post(`${API_URL}/api/auth/esqueci-senha`, { email });
    } finally {
      setCarregando(false);
      setEnviado(true); // sempre mostra a mesma tela, não revela se o email existe
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <div className="auth-marca">MedStudy</div>

        {enviado ? (
          <>
            <h1 className="auth-titulo">Confira seu email</h1>
            <p className="auth-subtitulo">
              Se <strong>{email}</strong> tiver uma conta, mandamos o link pra redefinir a senha.
            </p>
            <Link to="/login">Voltar para o login</Link>
          </>
        ) : (
          <>
            <h1 className="auth-titulo">Esqueci minha senha</h1>
            <p className="auth-subtitulo">Digite seu email e mandamos um link pra redefinir.</p>

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

              <button type="submit" className="btn-primary auth-botao-full" disabled={carregando}>
                {carregando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <div className="auth-rodape">
              <Link to="/login">Voltar para o login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
