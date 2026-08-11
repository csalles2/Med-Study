// Backend/src/routes/auth.js
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { hashSenha, senhaConfere, gerarToken } = require('../helpers/authHelpers');
const { enviarEmailVerificacao, enviarEmailRecuperacao } = require('../helpers/emailHelper');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarTokenVerificacao(userId, tipo, horasValidade) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + horasValidade * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO verificacoes (user_id, token, tipo, expira_em) VALUES (?, ?, ?, ?)').run(
    userId,
    token,
    tipo,
    expiraEm
  );
  return token;
}

// ─────────────────────────────────────────────
// CADASTRO — cria a conta, mas NÃO loga ainda.
// Só libera login depois de confirmar o email.
// ─────────────────────────────────────────────
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Email inválido.' });
    }
    if (senha.length < 8) {
      return res.status(400).json({ message: 'A senha precisa ter ao menos 8 caracteres.' });
    }

    const emailNormalizado = email.toLowerCase();
    const existente = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNormalizado);
    if (existente) {
      return res.status(409).json({ message: 'Já existe uma conta com esse email.' });
    }

    const { hash, salt } = hashSenha(senha);

    const resultado = db
      .prepare(
        `INSERT INTO users (nome, email, senha_hash, senha_salt, plano, plano_status, email_verificado)
         VALUES (?, ?, ?, ?, 'gratuito', 'ativo', 0)`
      )
      .run(nome, emailNormalizado, hash, salt);

    const userId = resultado.lastInsertRowid;
    const tokenVerificacao = gerarTokenVerificacao(userId, 'verificacao_email', 24);

    try {
      await enviarEmailVerificacao(emailNormalizado, nome, tokenVerificacao);
    } catch (erroEmail) {
      console.error('Falha ao enviar email de verificação:', erroEmail);
      // Não derruba o cadastro por causa disso — a pessoa pode pedir reenvio depois.
    }

    return res.status(201).json({
      message: 'Conta criada! Confira seu email para ativar o acesso.',
      email: emailNormalizado,
    });
  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    return res.status(500).json({ message: 'Erro interno ao criar conta.' });
  }
});

// ─────────────────────────────────────────────
// VERIFICAR EMAIL
// ─────────────────────────────────────────────
router.post('/verificar-email', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ message: 'Token ausente.' });

  const registro = db
    .prepare(
      `SELECT * FROM verificacoes
       WHERE token = ? AND tipo = 'verificacao_email' AND expira_em > datetime('now')`
    )
    .get(token);

  if (!registro) {
    return res.status(400).json({ message: 'Link inválido ou expirado. Peça um novo.' });
  }

  db.prepare('UPDATE users SET email_verificado = 1 WHERE id = ?').run(registro.user_id);
  db.prepare('DELETE FROM verificacoes WHERE user_id = ? AND tipo = ?').run(registro.user_id, 'verificacao_email');

  return res.json({ message: 'Email confirmado! Você já pode entrar.' });
});

// ─────────────────────────────────────────────
// REENVIAR EMAIL DE VERIFICAÇÃO
// ─────────────────────────────────────────────
router.post('/reenviar-verificacao', async (req, res) => {
  const { email } = req.body || {};
  const mensagemPadrao = { message: 'Se o email existir e ainda não tiver sido confirmado, reenviamos o link.' };

  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });

  const usuario = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!usuario || usuario.email_verificado) {
    return res.json(mensagemPadrao); // não revela se o email existe ou já está confirmado
  }

  db.prepare("DELETE FROM verificacoes WHERE user_id = ? AND tipo = 'verificacao_email'").run(usuario.id);
  const tokenVerificacao = gerarTokenVerificacao(usuario.id, 'verificacao_email', 24);

  try {
    await enviarEmailVerificacao(usuario.email, usuario.nome, tokenVerificacao);
  } catch (erroEmail) {
    console.error('Falha ao reenviar email de verificação:', erroEmail);
  }

  return res.json(mensagemPadrao);
});

// ─────────────────────────────────────────────
// LOGIN — bloqueia quem não confirmou o email
// ─────────────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const usuario = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!usuario || !senhaConfere(senha, usuario.senha_salt, usuario.senha_hash)) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    if (!usuario.email_verificado) {
      return res.status(403).json({
        message: 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.',
        codigo: 'EMAIL_NAO_VERIFICADO',
      });
    }

    const { token, expiraEm } = gerarToken();
    db.prepare('INSERT INTO tokens (user_id, token, expira_em) VALUES (?, ?, ?)').run(usuario.id, token, expiraEm);

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        plano: usuario.plano,
        isAdmin: !!usuario.is_admin,
      },
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ message: 'Erro interno ao entrar.' });
  }
});

router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) db.prepare('DELETE FROM tokens WHERE token = ?').run(token);
  return res.status(204).send();
});

// ─────────────────────────────────────────────
// ESQUECI MINHA SENHA — sempre responde igual,
// pra não revelar se o email existe ou não.
// ─────────────────────────────────────────────
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body || {};
  const mensagemPadrao = { message: 'Se esse email tiver uma conta, enviamos as instruções pra redefinir a senha.' };

  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });

  const usuario = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!usuario) return res.json(mensagemPadrao);

  db.prepare("DELETE FROM verificacoes WHERE user_id = ? AND tipo = 'recuperacao_senha'").run(usuario.id);
  const tokenRecuperacao = gerarTokenVerificacao(usuario.id, 'recuperacao_senha', 1);

  try {
    await enviarEmailRecuperacao(usuario.email, usuario.nome, tokenRecuperacao);
  } catch (erroEmail) {
    console.error('Falha ao enviar email de recuperação:', erroEmail);
  }

  return res.json(mensagemPadrao);
});

// ─────────────────────────────────────────────
// REDEFINIR SENHA
// ─────────────────────────────────────────────
router.post('/redefinir-senha', (req, res) => {
  const { token, novaSenha } = req.body || {};

  if (!token || !novaSenha) {
    return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
  }
  if (novaSenha.length < 8) {
    return res.status(400).json({ message: 'A senha precisa ter ao menos 8 caracteres.' });
  }

  const registro = db
    .prepare(
      `SELECT * FROM verificacoes
       WHERE token = ? AND tipo = 'recuperacao_senha' AND expira_em > datetime('now')`
    )
    .get(token);

  if (!registro) {
    return res.status(400).json({ message: 'Link inválido ou expirado. Peça a recuperação de novo.' });
  }

  const { hash, salt } = hashSenha(novaSenha);
  db.prepare('UPDATE users SET senha_hash = ?, senha_salt = ? WHERE id = ?').run(hash, salt, registro.user_id);

  // Derruba todas as sessões ativas dessa conta — boa prática depois de trocar senha.
  db.prepare('DELETE FROM tokens WHERE user_id = ?').run(registro.user_id);
  db.prepare("DELETE FROM verificacoes WHERE user_id = ? AND tipo = 'recuperacao_senha'").run(registro.user_id);

  return res.json({ message: 'Senha redefinida! Você já pode entrar com a nova senha.' });
});

module.exports = router;
