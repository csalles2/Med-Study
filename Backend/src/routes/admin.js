// Backend/src/routes/admin.js
const express = require('express');
const db = require('../db');
const { exigirAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const PLANOS_VALIDOS = ['gratuito', 'premium_mensal', 'premium_anual'];

// GET /api/admin/usuarios — lista todo mundo, com uso do mês atual
router.get('/usuarios', exigirAdmin, (req, res) => {
  const mesAtual = new Date().toISOString().slice(0, 7);

  const usuarios = db
    .prepare(
      `SELECT
         u.id, u.nome, u.email, u.plano, u.plano_status, u.is_admin, u.criado_em,
         COALESCE(m.uploads, 0) AS uploads_mes
       FROM users u
       LEFT JOIN uso_mensal m ON m.user_id = u.id AND m.mes_referencia = ?
       ORDER BY u.criado_em DESC`
    )
    .all(mesAtual);

  const totalConvidados = db.prepare('SELECT COUNT(*) AS total FROM usos_convidado').get().total;

  res.json({
    usuarios: usuarios.map((u) => ({ ...u, is_admin: !!u.is_admin })),
    totais: {
      usuarios: usuarios.length,
      premium: usuarios.filter((u) => u.plano !== 'gratuito').length,
      testesGratisConvidados: totalConvidados,
    },
  });
});

// PATCH /api/admin/usuarios/:id/plano — dar/tirar Premium manualmente
router.patch('/usuarios/:id/plano', exigirAdmin, (req, res) => {
  const { plano } = req.body || {};
  if (!PLANOS_VALIDOS.includes(plano)) {
    return res.status(400).json({ message: 'Plano inválido.' });
  }

  const resultado = db.prepare('UPDATE users SET plano = ?, plano_status = ? WHERE id = ?').run(
    plano,
    'ativo',
    req.params.id
  );

  if (resultado.changes === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  res.json({ ok: true });
});

module.exports = router;
