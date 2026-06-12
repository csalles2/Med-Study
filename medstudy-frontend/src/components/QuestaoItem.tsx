import React, { useState } from 'react';
import { Questao } from '../types';

interface Props {
  questao: Questao;
  index: number;
  onAnswer: (correct: boolean) => void;
}

export default function QuestaoItem({
  questao,
  index,
  onAnswer
}: Props) {

  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (letra: string) => {
    if (selected) return;

    setSelected(letra);

    onAnswer(letra === questao.correta);
  };

  const getClass = (letra: string) => {
    if (!selected) return 'alternativa';

    if (letra === questao.correta) {
      return 'alternativa correta answered';
    }

    if (letra === selected && letra !== questao.correta) {
      return 'alternativa errada answered';
    }

    return 'alternativa answered';
  };

  return (
    <div className="questao-card">

      <div className="questao-header">
        <span className="questao-num">
          Questão {index + 1}
        </span>

        <span className="questao-badge">
          {questao.badge || 'MED'}
        </span>
      </div>

      <div className="questao-text">
        {questao.pergunta}
      </div>

      {Object.entries(questao.alternativas).map(([letra, texto]) => (
        <div
          key={letra}
          className={getClass(letra)}
          onClick={() => handleSelect(letra)}
          style={{
            pointerEvents: selected ? 'none' : 'auto'
          }}
        >
          <div className="alt-letra">
            {letra}
          </div>

          <div>
            {texto as string}
          </div>
        </div>
      ))}

      {selected && (
        <div className="explicacao">
          {questao.explicacao}
        </div>
      )}

    </div>
  );
}