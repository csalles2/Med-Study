import { useState } from 'react';
import { StudyMaterial } from '../types';
import axios from 'axios';
import { getGuestId } from '../utils/guestId';

export function useStudyMaterial(token: string | null) {
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [appState, setAppState] = useState<'upload' | 'loading' | 'result'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [codigoErro, setCodigoErro] = useState<string | null>(null);
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
      setCodigoErro(null);
      setAppState('loading');
      setLoadingStep(0);

      const base64Data = await fileToBase64(file);

      // Logado -> manda o token da conta. Convidado -> manda o guest_id
      // (controla o teste grátis de 1 uso sem conta).
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers['X-Guest-Id'] = getGuestId();
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/processar`,
        {
          filename: file.name,
          mimetype: file.type,
          data: base64Data,
        },
        { timeout: 120000, headers }
      );

      setMaterial(response.data);
      setAppState('result');
    } catch (err: any) {
      console.error("Erro ao processar:", err);

      const msgErro =
        err.response?.data?.message ||
        "Erro ao conectar com o servidor. Verifique se o backend está rodando.";

      setError(msgErro);
      setCodigoErro(err.response?.data?.codigo || null);
      setAppState('upload');
    } finally {
      clearInterval(loaderInterval);
    }
  };

  const reset = () => {
    setMaterial(null);
    setError(null);
    setCodigoErro(null);
    setAppState('upload');
    setLoadingStep(0);
  };

  return {
    appState,
    material,
    loadingStep,
    loadingSteps,
    error,
    codigoErro,
    processFile,
    reset,
  };
}
