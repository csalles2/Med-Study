// medstudy-frontend/src/pages/VerificarEmail.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function VerificarEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('erro');
      setMensagem('Link inválido.');
      return;
    }
    axios
      .post(`${API_URL}/api/auth/verificar-email`, { token })
      .then((res) => {
        setStatus('sucesso');
        setMensagem(res.data.message);
      })
      .catch((err) => {
        setStatus('erro');
        setMensagem(err.response?.data?.message || 'Não foi possível confirmar o email.');
      });
  }, [token]);

  return (
    <div className="auth-pagina">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-marca">MedStudy</div>
        {status === 'carregando' && <p className="auth-subtitulo">Confirmando seu email...</p>}
        {status === 'sucesso' && (
          <>
            <h1 className="auth-titulo">Email confirmado ✅</h1>
            <p className="auth-subtitulo">{mensagem}</p>
            <Link to="/login" className="btn-primary auth-botao-full" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Ir para o login
            </Link>
          </>
        )}
        {status === 'erro' && (
          <>
            <h1 className="auth-titulo">Não foi dessa vez</h1>
            <p className="auth-subtitulo">{mensagem}</p>
            <Link to="/login">Voltar para o login</Link>
          </>
        )}
      </div>
    </div>
  );
}
