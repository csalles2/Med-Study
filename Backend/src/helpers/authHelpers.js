// Backend/src/helpers/authHelpers.js
const crypto = require('crypto');

const PBKDF2_ITERACOES = 120_000;
const PBKDF2_TAMANHO_CHAVE = 64;
const PBKDF2_DIGEST = 'sha512';
const TOKEN_VALIDADE_DIAS = 30;

function gerarSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashSenha(senhaPura, salt = gerarSalt()) {
  const hash = crypto
    .pbkdf2Sync(senhaPura, salt, PBKDF2_ITERACOES, PBKDF2_TAMANHO_CHAVE, PBKDF2_DIGEST)
    .toString('hex');
  return { hash, salt };
}

function senhaConfere(senhaPura, salt, hashArmazenado) {
  const { hash } = hashSenha(senhaPura, salt);
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(hashArmazenado, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function gerarToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + TOKEN_VALIDADE_DIAS * 24 * 60 * 60 * 1000).toISOString();
  return { token, expiraEm };
}

module.exports = { hashSenha, senhaConfere, gerarToken, gerarSalt };
