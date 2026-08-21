const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, 'src', 'medstudy.db'));

const email = 'camiagui743@gmail.com'; // coloca o email certo

const resultado = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);

console.log('Linhas afetadas:', resultado.changes);

const user = db.prepare('SELECT id, email, is_admin FROM users WHERE email = ?').get(email);
console.log(user);

db.close();