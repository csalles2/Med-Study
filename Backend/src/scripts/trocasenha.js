// Backend/src/scripts/trocarSenha.js
// Uso: node src/scripts/trocarSenha.js seuemail@exemplo.com novaSenha123

const db = require('../db');
const { hashSenha } = require('../helpers/authHelpers');

const email = process.argv[2];
const novaSenha = process.argv[3];

if (!email || !novaSenha) {
  console.error('Uso: node src/scripts/trocarSenha.js seuemail@exemplo.com novaSenha123');
  process.exit(1);
}

if (novaSenha.length < 8) {
  console.error('A senha precisa ter ao menos 8 caracteres.');
  process.exit(1);
}

const usuario = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());

if (!usuario) {
  console.error(`Nenhum usuário encontrado com o email ${email}.`);
  process.exit(1);
}

const { hash, salt } = hashSenha(novaSenha);
db.prepare('UPDATE users SET senha_hash = ?, senha_salt = ? WHERE id = ?').run(hash, salt, usuario.id);

db.prepare('DELETE FROM tokens WHERE user_id = ?').run(usuario.id);

console.log(` Senha de ${email} atualizada. Já pode fazer login com a nova senha.`);