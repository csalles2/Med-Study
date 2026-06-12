export interface Flashcard {
  id: number;
  perguntaPT: string;
  perguntaES: string;
  respostaPT: string;
  respostaES: string;
}

export interface Questao {
  id: number;

  pergunta: string;

  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  correta: string;

  explicacao: string;

  badge?: string;
}

export interface StudyMaterial {
  titulo: string;
  slidesProcessados: number;
  perola: string;
  resumo: string;
  pontoschave: string[] | string;
  flashcards: Flashcard[];
  questoes: Questao[];
}

export type AppState = 'upload' | 'loading' | 'result';

export type ActiveTab =
  | 'resumo'
  | 'flashcards'
  | 'questoes';