// Backend/src/scripts/tornarAdmin.js
// Uso: node src/scripts/tornarAdmin.js seuemail@exemplo.com
// (rode dentro da pasta Backend, depois de já ter criado sua conta pelo /cadastro)

const db = require('../db');

const email = process.argv[2];

if (!email) {
  console.error('Uso: node src/scripts/tornarAdmin.js seuemail@exemplo.com');
  process.exit(1);
}

const resultado = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email.toLowerCase());

if (resultado.changes === 0) {
  console.error(`Nenhum usuário encontrado com o email ${email}. Cadastre-se pelo site primeiro.`);
  process.exit(1);
}

console.log(`✅ ${email} agora é administrador. Faça login de novo no site pra atualizar a sessão.`);
