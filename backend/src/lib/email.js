const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: `"Astraeus Gym" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta — Astraeus Gym',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #ffffff; padding: 40px;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 0;">
            ASTRAEUS <span style="color: #FFE000;">GYM</span>
          </h1>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 16px;">Hola, ${name} 👋</h2>
        <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 32px;">
          Gracias por registrarte en Astraeus Gym. Haz clic en el botón de abajo para verificar tu cuenta y comenzar a entrenar.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #FFE000; color: #0f0f0f; padding: 16px 40px; font-weight: 800; font-size: 16px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px;">
          Verificar cuenta
        </a>
        <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 32px 0 0; line-height: 1.6;">
          Si no creaste esta cuenta, ignora este correo. El enlace expira en 24 horas.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 32px; padding-top: 24px;">
          <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">© 2026 Astraeus Gym — Todos los derechos reservados</p>
        </div>
      </div>
    `
  })
}

module.exports = { sendVerificationEmail }