// medstudy-frontend/src/pages/RedefinirSenha.tsx
import React, { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setErro('Link inválido.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await axios.post(`${API_URL}/api/auth/redefinir-senha`, { token, novaSenha });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível redefinir a senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <div className="auth-marca">MedStudy</div>

        {sucesso ? (
          <>
            <h1 className="auth-titulo">Senha redefinida ✅</h1>
            <p className="auth-subtitulo">Redirecionando para o login...</p>
          </>
        ) : (
          <>
            <h1 className="auth-titulo">Criar nova senha</h1>
            <p className="auth-subtitulo">Escolha uma senha nova para sua conta.</p>

            {erro && <div className="auth-erro">{erro}</div>}

            <form onSubmit={aoEnviar}>
              <div className="auth-campo">
                <label htmlFor="novaSenha">Nova senha</label>
                <input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn-primary auth-botao-full" disabled={carregando}>
                {carregando ? 'Salvando...' : 'Salvar nova senha'}
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
