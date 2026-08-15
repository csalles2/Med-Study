// medstudy-frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import Boasvindas from './pages/Boasvindas';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import VerificarEmail from './pages/VerificarEmail';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Estudos from './pages/Estudos';
import AdminPainel from './pages/AdminPainel';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Boasvindas />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          {/* /app funciona logado OU como convidado (1 teste grátis) */}
          <Route path="/app" element={<Estudos />} />
          <Route path="/admin" element={<AdminPainel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
