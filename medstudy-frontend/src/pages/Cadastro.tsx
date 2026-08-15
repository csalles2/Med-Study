// medstudy-frontend/src/pages/Cadastro.tsx
import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Cadastro() {
  const { cadastrar, carregando, erro } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const sucesso = await cadastrar(nome, email, senha);
    if (sucesso) setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="auth-pagina">
        <div className="auth-card">
          <div className="auth-marca">MedStudy</div>
          <h1 className="auth-titulo">Confira seu email</h1>
          <p className="auth-subtitulo">
            Mandamos um link de confirmação pra <strong>{email}</strong>. Clica nele pra ativar
            sua conta e poder entrar.
          </p>
          <div className="auth-rodape">
            Não recebeu? Confira o spam, ou <Link to="/login">volte pra tela de login</Link> pra
            reenviar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <div className="auth-marca">MedStudy</div>
        <h1 className="auth-titulo">Criar conta</h1>
        <p className="auth-subtitulo">Grátis pra começar. Sem cartão de crédito.</p>

        {erro && <div className="auth-erro">{erro}</div>}

        <form onSubmit={aoEnviar}>
          <div className="auth-campo">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              autoComplete="name"
            />
          </div>

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
      placeholder="Mínimo 8 caracteres"
      minLength={8}
      required
      autoComplete="new-password"
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
            
          

          <button type="submit" className="btn-primary auth-botao-full" disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <div className="auth-rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
