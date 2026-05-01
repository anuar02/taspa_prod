import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export async function sendResetCode(to: string, code: string) {
  return transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject: "Taspa — Верификация коды",
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #e11d48; margin: 0 0 24px;">TASPA</p>
        <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 8px;">Верификация коды</h2>
        <p style="font-size: 14px; color: #78716c; margin: 0 0 32px;">
          Taspa аккаунтыңыздың құпиясөзін қалпына келтіру үшін төмендегі кодты пайдаланыңыз.
        </p>
        <div style="display: inline-block; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 20px 40px; margin-bottom: 32px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #e11d48;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #a8a29e; margin: 0;">
          Код 15 минут ішінде жарамды. Егер сіз бұл сұранысты жібермеген болсаңыз, хатты елемеңіз.
        </p>
      </div>
    `
  });
}
