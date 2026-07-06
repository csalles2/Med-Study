import { useState } from 'react';
import { StudyMaterial } from '../types';
import axios from 'axios';

export function useStudyMaterial() {
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [appState, setAppState] = useState<'upload' | 'loading' | 'result'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Lendo arquivo PDF...",
    "Analisando conteúdo médico...",
    "IA gerando flashcards...",
    "Finalizando seu material..."
  ];

  // Converte File -> base64 (sem o prefixo "data:...;base64,")
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // remove o prefixo "data:application/pdf;base64," etc
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const loaderInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < loadingSteps.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    try {
      setError(null);
      setAppState('loading');
      setLoadingStep(0);

      const base64Data = await fileToBase64(file);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/processar`,
        {
          nomeArquivo: file.name,
          tipoArquivo: file.type,
          conteudo: base64Data,
        },
        {
          timeout: 120000,
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMaterial(response.data);
      setAppState('result');
    } catch (err: any) {
      console.error("Erro ao processar:", err);

      const msgErro =
        err.response?.data?.message ||
        "Erro ao conectar com o servidor. Verifique se o backend está rodando.";

      setError(msgErro);
      setAppState('upload');
    } finally {
      clearInterval(loaderInterval);
    }
  };

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
    reset,
  };
}