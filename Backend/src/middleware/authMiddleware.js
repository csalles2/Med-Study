// Backend/src/middleware/authMiddleware.js
const db = require('../db');

// NÃO bloqueia a requisição — só anexa req.usuario se o token for válido.
// Quem não estiver logado segue como convidado (tratado na própria rota).
function identificarUsuario(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    const sessao = db
      .prepare(
        `SELECT users.* FROM tokens
         JOIN users ON users.id = tokens.user_id
         WHERE tokens.token = ? AND tokens.expira_em > datetime('now')`
      )
      .get(token);
    if (sessao) req.usuario = sessao;
  }
  next();
}

// Para rotas que exigem conta de verdade (ex: tela de planos).
function exigirLogin(req, res, next) {
  identificarUsuario(req, res, () => {
    if (!req.usuario) return res.status(401).json({ message: 'Não autenticado.' });
    next();
  });
}

// Para o painel de administração — só quem tem is_admin = 1.
function exigirAdmin(req, res, next) {
  identificarUsuario(req, res, () => {
    if (!req.usuario) return res.status(401).json({ message: 'Não autenticado.' });
    if (!req.usuario.is_admin) return res.status(403).json({ message: 'Acesso restrito ao administrador.' });
    next();
  });
}

module.exports = { identificarUsuario, exigirLogin, exigirAdmin };
