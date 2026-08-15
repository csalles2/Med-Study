// medstudy-frontend/src/pages/Boasvindas.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import '../styles/auth.css';

export default function Boasvindas() {
  const navigate = useNavigate();

  return (
    <div className="boasvindas-pagina">
      <div className="boasvindas-conteudo">
        <div className="nav-logo-icon" style={{ margin: '0 auto 20px', width: 40, height: 40 }}>
          <Brain size={20} color="white" />
        </div>
        <h1>
          Transforme aulas em <span>material de estudo</span>
        </h1>
        <p>
          Resumos, flashcards bilíngues e questões estilo residência médica, gerados por IA a
          partir do seu PDF, PPTX ou imagem.
        </p>

        <div className="boasvindas-botoes">
          <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigate('/cadastro')}>
            Criar conta grátis
          </button>
        </div>

        <div className="boasvindas-convidado">
          Só quer testar? <button onClick={() => navigate('/app')}>Continuar sem conta</button>
          <div style={{ marginTop: 4 }}>(1 processamento grátis, sem precisar cadastrar)</div>
        </div>
      </div>
    </div>
  );
}
