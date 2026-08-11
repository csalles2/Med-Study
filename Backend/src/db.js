// Backend/src/db.js
// npm install better-sqlite3

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'medstudy.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    senha_salt TEXT NOT NULL,
    plano TEXT NOT NULL DEFAULT 'gratuito',
    plano_status TEXT NOT NULL DEFAULT 'ativo',
    plano_expira_em TEXT,
    pais TEXT NOT NULL DEFAULT 'BR',
    is_admin INTEGER NOT NULL DEFAULT 0,
    email_verificado INTEGER NOT NULL DEFAULT 0,
    gateway_pagamento TEXT,
    mp_assinatura_id TEXT,
    stripe_customer_id TEXT,
    stripe_assinatura_id TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expira_em TEXT NOT NULL
  );

  -- Controla o limite mensal do plano Gratuito (usuário logado).
  CREATE TABLE IF NOT EXISTS uso_mensal (
    user_id INTEGER NOT NULL REFERENCES users(id),
    mes_referencia TEXT NOT NULL,
    uploads INTEGER NOT NULL DEFAULT 0,
    flashcards INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, mes_referencia)
  );

  -- Tokens de verificação de email e recuperação de senha (curta duração).
  CREATE TABLE IF NOT EXISTS verificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL, -- 'verificacao_email' | 'recuperacao_senha'
    expira_em TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Controla o teste grátis de quem usa SEM CONTA (1 processamento, sem prazo).
  -- guest_id é gerado pelo frontend e guardado no localStorage do navegador.
  CREATE TABLE IF NOT EXISTS usos_convidado (
    guest_id TEXT PRIMARY KEY,
    usado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
