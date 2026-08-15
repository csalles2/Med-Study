// Backend/src/helpers/emailHelper.js
// npm install nodemailer
//
// Usa Gmail SMTP com "Senha de app" (não a senha normal da conta).
// Como gerar: myaccount.google.com/apppasswords (precisa 2FA ativado no Gmail).

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function layoutEmail(titulo, corpoHtml) {
  return `
    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1c2733;">
      <h2 style="color: #0e7c86; margin-bottom: 18px;">${titulo}</h2>
      ${corpoHtml}
      <p style="margin-top: 32px; font-size: 12.5px; color: #64748b;">
        MedStudy — se você não pediu isso, pode ignorar este email.
      </p>
    </div>
  `;
}

async function enviarEmailVerificacao(destino, nome, token) {
  const link = `${FRONTEND_URL}/verificar-email?token=${token}`;
  await transporter.sendMail({
    from: `MedStudy <${process.env.GMAIL_USER}>`,
    to: destino,
    subject: 'Confirme seu email — MedStudy',
    html: layoutEmail(
      'Confirme seu email',
      `<p>Oi, ${nome}! Falta só confirmar seu email pra ativar sua conta no MedStudy.</p>
       <p><a href="${link}" style="display:inline-block; background:#0e7c86; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Confirmar email</a></p>
       <p style="font-size:12.5px; color:#64748b;">Ou copie e cole este link: ${link}</p>`
    ),
  });
}

async function enviarEmailRecuperacao(destino, nome, token) {
  const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;
  await transporter.sendMail({
    from: `MedStudy <${process.env.GMAIL_USER}>`,
    to: destino,
    subject: 'Redefinir senha — MedStudy',
    html: layoutEmail(
      'Redefinir sua senha',
      `<p>Oi, ${nome}! Recebemos um pedido pra redefinir sua senha.</p>
       <p><a href="${link}" style="display:inline-block; background:#0e7c86; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Criar nova senha</a></p>
       <p style="font-size:12.5px; color:#64748b;">Esse link expira em 1 hora. Se não foi você, ignore este email.</p>`
    ),
  });
}


module.exports = { enviarEmailVerificacao, enviarEmailRecuperacao };
