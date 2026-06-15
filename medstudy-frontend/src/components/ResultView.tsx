import React, { useState } from 'react';
import { Download, RefreshCw, Star, BookOpen, CreditCard, HelpCircle } from 'lucide-react';
import { StudyMaterial, ActiveTab } from '../types';
import FlashcardItem from './FlashcardItem';
import QuestaoItem from './QuestaoItem';
import axios from 'axios';

interface Props {
  material: StudyMaterial;
  onReset: () => void;
}

export default function ResultView({ material, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resumo');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [language, setLanguage] = useState<'PT' | 'ES'>('PT');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleAnswer = (correct: boolean) => {
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  // Download autenticado — envia o token no header
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      const response = await axios.get('http://localhost:3001/api/download-pdf', {
        headers: {
          Authorization: process.env.REACT_APP_TOKEN || '',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'material-estudo.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      alert('Erro ao baixar o PDF. Tente novamente.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // NORMALIZAÇÃO DOS DADOS
  const pontos: string[] = Array.isArray(material.pontoschave)
    ? material.pontoschave
    : typeof material.pontoschave === 'string'
      ? material.pontoschave.split(/[\n,•-]/).map(p => p.trim()).filter(Boolean)
      : [];
  const flashcards: any[] = Array.isArray(material.flashcards) ? material.flashcards : [];
  const questoes: any[] = Array.isArray(material.questoes) ? material.questoes : [];

  return (
    <div className="result-container">
      <div className="result-header">
        <div>
          <div className="result-title">{material.titulo}</div>
          <div className="result-meta">Material gerado com IA – MedStudy</div>
        </div>
        <div className="result-actions">
          <button className="new-upload-btn" onClick={onReset}>
            <RefreshCw size={14} />
            Novo arquivo
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-num">{material.slidesProcessados}</div>
          <div className="stat-label">Slides processados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{flashcards.length}</div>
          <div className="stat-label">Flashcards</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{questoes.length}</div>
          <div className="stat-label">Questões</div>
        </div>
      </div>

      <div className="language-selector">
        <button
          className={`lang-btn ${language === 'PT' ? 'active' : ''}`}
          onClick={() => setLanguage('PT')}
        >
          🇧🇷 PT
        </button>
        <button
          className={`lang-btn ${language === 'ES' ? 'active' : ''}`}
          onClick={() => setLanguage('ES')}
        >
          🇪🇸 ES
        </button>
      </div>

      <div className="perola-card">
        <div className="perola-label">
          <Star size={13} />
          Pérola de prova – high yield
        </div>
        <div className="perola-text">{material.perola}</div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'resumo' ? 'active' : ''}`} onClick={() => setActiveTab('resumo')}>
          <BookOpen size={14} /> Resumo
        </button>
        <button className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveTab('flashcards')}>
          <CreditCard size={14} /> Flashcards
        </button>
        <button className={`tab ${activeTab === 'questoes' ? 'active' : ''}`} onClick={() => setActiveTab('questoes')}>
          <HelpCircle size={14} /> Questões
        </button>
      </div>

      {activeTab === 'resumo' && (
        <div>
          <div className="resumo-section">
            <div className="resumo-section-title">Resumo</div>
            <div className="resumo-text">{material.resumo}</div>
          </div>

          <div className="resumo-section">
            <div className="resumo-section-title">Pontos-chave</div>
            {pontos.length > 0 ? (
              pontos.map((p: string, i: number) => (
                <div key={i} className="ponto-item">
                  <div className="ponto-dot" />
                  <div>{p}</div>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.6 }}>Nenhum ponto-chave disponível</div>
            )}
          </div>

          <div>
            <button
              className="btn-secondary"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={14} />
              {downloadingPdf ? 'Baixando...' : 'Baixar PDF'}
            </button>

            <button className="btn-secondary">
              <Download size={14} /> Exportar Anki
            </button>
          </div>
        </div>
      )}

      {activeTab === 'flashcards' && (
        <div>
          <div className="flashcard-grid">
            {flashcards.map((card, index) => (
              <FlashcardItem
                key={`${card.id}-${index}-${material.titulo}`}
                card={card}
              />
            ))}
          </div>
          <div className="flashcard-hint-text">Clique nos cards para virar</div>
        </div>
      )}

      {activeTab === 'questoes' && (
        <div>
          {score.total > 0 && (
            <div className="score-bar">
              <span className="score-text">Pontuação atual</span>
              <span className="score-num">{score.correct}/{score.total}</span>
            </div>
          )}
          {questoes.map((q, i) => (
            <QuestaoItem key={q.id} questao={q} index={i} onAnswer={handleAnswer} />
          ))}
        </div>
      )}
    </div>
  );
}