const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Verifica tu cuenta - Gym System',
    html: `
      <h2>Hola ${name} 👋</h2>
      <p>Gracias por registrarte en Gym System.</p>
      <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verifyUrl}" style="
        background-color: #4F46E5;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 16px 0;
      ">Verificar cuenta</a>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `
  })
}

module.exports = { sendVerificationEmail }