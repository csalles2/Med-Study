import { useState } from 'react';
import { StudyMaterial } from '../types';
import axios from 'axios';

export function useStudyMaterial() {
  // Estados principais
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [appState, setAppState] = useState<'upload' | 'loading' | 'result'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o Loader
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Lendo arquivo PDF...",
    "Analisando conteúdo médico...",
    "IA gerando flashcards...",
    "Finalizando seu material..."
  ];

  // Função para processar o arquivo
  const processFile = async (file: File) => {
    try {
      setError(null);
      setAppState('loading');
      setLoadingStep(0);

      // Timer para as frases do loader não ficarem paradas
      const loaderInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3000);

      const formData = new FormData();
      // O nome aqui deve ser 'file' para bater com o upload.single('file') do seu backend
      formData.append('file', file);

      // ATENÇÃO: Mudamos para /api/processar que é o que está no seu server.js
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/processar`,
            formData,
            { timeout: 120000 } // 2 minutos
          );

      clearInterval(loaderInterval);
      setMaterial(response.data); // O backend já retorna o objeto estruturado (titulo, resumo, flashcards...)
      setAppState('result');

    } catch (err: any) {
      console.error("Erro ao processar:", err);
      // Pega a mensagem de erro que vem do seu backend se houver
      const msgErro = err.response?.data?.message || "Erro ao conectar com o servidor. Verifique se o backend está rodando.";
      setError(msgErro);
      setAppState('upload');
    }
  };
  // Função para resetar e voltar ao início
  const reset = () => {
    setMaterial(null);
    setError(null);
    setAppState('upload');
    setLoadingStep(0);
  };

  return {
    appState,
    material,
    loadingStep,
    loadingSteps,
    error,
    processFile,
    reset
  };
}