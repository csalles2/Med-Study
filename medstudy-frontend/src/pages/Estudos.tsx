// medstudy-frontend/src/pages/Estudos.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useStudyMaterial } from '../hooks/useStudyMaterial';
import { useAuth } from '../context/AuthContext';
import UploadView from '../components/UploadView';
import LoaderView from '../components/LoaderView';
import ResultView from '../components/ResultView';

export default function Estudos() {
  const { usuario, token, logout } = useAuth();
  const {
    appState,
    material,
    loadingStep,
    loadingSteps,
    error,
    codigoErro,
    processFile,
    reset,
  } = useStudyMaterial(token) as any;

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <Brain size={18} color="white" />
          </div>
          MedStudy
        </div>

        {usuario ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {usuario.isAdmin && (
              <Link to="/admin" className="nav-badge" style={{ textDecoration: 'none' }}>
                Painel admin
              </Link>
            )}
            <span className="nav-badge">{usuario.nome}</span>
            <button className="btn-secondary" onClick={logout}>
              Sair
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="nav-badge">Teste grátis</span>
            <Link to="/cadastro" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Criar conta
            </Link>
          </div>
        )}
      </nav>

      <main className="main">
        {appState === 'upload' && (
          <UploadView onFile={processFile} error={error} codigoErro={codigoErro} />
        )}

        {appState === 'loading' && (
          <LoaderView steps={loadingSteps} currentStep={loadingStep} />
        )}

        {appState === 'result' && material && (
          <ResultView material={material} onReset={reset} />
        )}
      </main>

      <footer className="footer">
        © 2026 Camille Sales Aguirre — Criando experiências digitais • Todos os direitos reservados.
      </footer>
    </div>
  );
}
