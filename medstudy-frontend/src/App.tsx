// Dentro de src/App.tsx
import React from 'react';

import './styles/global.css';
import { Brain } from 'lucide-react';
import { useStudyMaterial } from './hooks/useStudyMaterial';
import UploadView from './components/UploadView';
import LoaderView from './components/LoaderView';
import ResultView from './components/ResultView';

export default function App() {
  // Adicionamos 'as any' aqui para o TS aceitar as props nos componentes abaixo
  const { 
    appState, 
    material, 
    loadingStep, 
    loadingSteps, 
    error, 
    processFile, 
    reset 
  } = useStudyMaterial() as any;

  return (
    
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <Brain size={18} color="white" />
          </div>
          MedStudy
        </div>
        <span className="nav-badge">IA Médica</span>
      </nav>

      <main className="main">
        {/* Usamos a técnica 'as any' nos componentes para forçar o funcionamento */}
        {appState === 'upload' && (
          <UploadView onFile={processFile} error={error} />
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
