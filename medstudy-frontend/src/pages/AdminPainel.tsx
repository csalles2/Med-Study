// medstudy-frontend/src/pages/AdminPainel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

const API_URL = process.env.REACT_APP_API_URL;

interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  plano: string;
  plano_status: string;
  is_admin: boolean;
  criado_em: string;
  uploads_mes: number;
}

const NOMES_PLANO: Record<string, string> = {
  gratuito: 'Gratuito',
  premium_mensal: 'Premium Mensal',
  premium_anual: 'Premium Anual',
};

export default function AdminPainel() {
  const { usuario, token } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [totais, setTotais] = useState({ usuarios: 0, premium: 0, testesGratisConvidados: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(data.usuarios);
      setTotais(data.totais);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    if (usuario?.isAdmin) carregar();
  }, [usuario, carregar]);

  async function alterarPlano(id: number, novoPlano: string) {
    try {
      await axios.patch(
        `${API_URL}/api/admin/usuarios/${id}/plano`,
        { plano: novoPlano },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, plano: novoPlano } : u)));
    } catch {
      alert('Não foi possível alterar o plano.');
    }
  }

  if (!usuario) {
    return <div className="admin-pagina">Faça login para acessar o painel.</div>;
  }

  if (!usuario.isAdmin) {
    return <div className="admin-pagina">Essa área é restrita ao administrador.</div>;
  }

  return (
    <div className="admin-pagina">
      <div className="admin-cabecalho">
        <h1>Painel de administração</h1>
      </div>

      <div className="admin-cards">
        <div className="admin-card">
          <div className="numero">{totais.usuarios}</div>
          <div className="rotulo">Contas cadastradas</div>
        </div>
        <div className="admin-card">
          <div className="numero">{totais.premium}</div>
          <div className="rotulo">Assinantes Premium</div>
        </div>
        <div className="admin-card">
          <div className="numero">{totais.testesGratisConvidados}</div>
          <div className="rotulo">Testes grátis (sem conta)</div>
        </div>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: '#F09595' }}>{erro}</p>}

      {!carregando && !erro && (
        <table className="admin-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Uploads (mês)</th>
              <th>Cadastro</th>
              <th>Alterar plano</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`admin-selo ${u.plano === 'gratuito' ? 'gratuito' : 'premium'}`}>
                    {NOMES_PLANO[u.plano] || u.plano}
                  </span>
                </td>
                <td>{u.uploads_mes}</td>
                <td>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                <td>
                  <select value={u.plano} onChange={(e) => alterarPlano(u.id, e.target.value)}>
                    <option value="gratuito">Gratuito</option>
                    <option value="premium_mensal">Premium Mensal</option>
                    <option value="premium_anual">Premium Anual</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
