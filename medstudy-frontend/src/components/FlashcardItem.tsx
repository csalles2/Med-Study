import React, { useState } from 'react';
import { Flashcard } from '../types';

type Lang = 'PT' | 'ES';

interface Props {
  card: Flashcard;
}

export default function FlashcardItem({ card }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [lang, setLang] = useState<Lang>('PT');

  // 🔥 FUNÇÃO DE LIMPEZA DE TEXTO
  const formatText = (text: string, isQuestion = false) => {
  if (!text) return '';

  let formatted = text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s([?.!,])/g, '$1');

  // Primeira letra maiúscula
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  // Correções básicas PT (fallback)
  formatted = formatted
    .replace(/\bQual e\b/g, 'Qual é')
    .replace(/\bacaro\b/g, 'ácaro')
    .replace(/\bbiologico\b/g, 'biológico')
    .replace(/\betiologico\b/g, 'etiológico');

  // Garante ?
  if (isQuestion && !/[?]$/.test(formatted)) {
    formatted += '?';
  }

  // Garante ponto final
  if (!isQuestion && !/[.]$/.test(formatted)) {
    formatted += '.';
  }

  return formatted;
};

  const perguntaRaw = lang === 'PT' ? card.perguntaPT : card.perguntaES;
  const respostaRaw = lang === 'PT' ? card.respostaPT : card.respostaES;

  const pergunta = formatText(perguntaRaw, true);
  const resposta = formatText(respostaRaw, false);

  function handleLangToggle(e: React.MouseEvent, next: Lang) {
    e.stopPropagation();
    setLang(next);
    setFlipped(false);
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Seletor de idioma */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        {(['PT', 'ES'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={(e) => handleLangToggle(e, l)}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: lang === l ? 700 : 400,
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: lang === l ? '#1D9E75' : 'transparent',
              color: lang === l ? '#fff' : 'inherit',
              cursor: 'pointer',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className={`flashcard-wrap ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flashcard-inner">

          {/* FRENTE */}
          <div
            className="flashcard-front"
            style={{ display: 'flex', flexDirection: 'column', padding: '15px' }}
          >
            <span className="card-lang">Pergunta · {lang}</span>

            <p
              className="card-question"
              style={{
                textAlign: 'center',
                fontSize: '14px',
                margin: 'auto 0',
                lineHeight: 1.5,
                wordBreak: 'break-word'
              }}
            >
              {pergunta}
            </p>

            <div className="card-hint" style={{ fontSize: '10px', marginTop: '10px', opacity: 0.6 }}>
              Clique para virar
            </div>
          </div>

          {/* VERSO */}
          <div
            className="flashcard-back"
            style={{ display: 'flex', flexDirection: 'column', padding: '15px' }}
          >
            <span className="card-lang">Resposta · {lang}</span>

            <p
              className="card-answer"
              style={{
                textAlign: 'center',
                fontSize: '14px',
                margin: 'auto 0',
                lineHeight: 1.5,
                wordBreak: 'break-word'
              }}
            >
              {resposta}
            </p>

            <div className="card-hint" style={{ fontSize: '10px', marginTop: '10px', opacity: 0.6 }}>
              Clique para voltar
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
