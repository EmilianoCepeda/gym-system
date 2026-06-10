import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { User, Mail, Lock, ArrowRight, Dumbbell, CheckCircle } from 'lucide-react'

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toast.success('Cuenta creada. Revisa tu correo para verificarla.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    'Acceso a todas las clases disponibles',
    'Reserva y cancela cuando quieras',
    'Historial completo de entrenamientos',
    'Comunicación directa con coaches',
  ]

  return (
    <>
      <style>{`
        .register-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          display: flex;
          align-items: stretch;
        }

        /* ── Panel izquierdo ── */
        .register-left {
          flex: 1;
          background: var(--bg-surface);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .register-left-glow {
          position: absolute;
          top: 20%;
          left: 10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,220,0,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .register-left-content {
          position: relative;
          z-index: 1;
        }

        /* ── Panel derecho ── */
        .register-right {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          background: var(--bg-base);
        }

        /* ── RESPONSIVE ── */

        /* Tablet: el panel izquierdo se achica un poco */
        @media (max-width: 1024px) {
          .register-left {
            padding: 36px;
          }
          .register-right {
            width: 420px;
            padding: 48px 40px;
          }
        }

        /* Tablet pequeño / landscape móvil: ocultamos el panel izquierdo */
        @media (max-width: 768px) {
          .register-left {
            display: none;
          }
          .register-right {
            width: 100%;
            padding: 40px 24px;
            justify-content: flex-start;
            padding-top: 48px;
          }
        }

        /* Móvil pequeño */
        @media (max-width: 480px) {
          .register-right {
            padding: 32px 20px;
          }
        }
      `}</style>

      <div className="register-wrapper">

        {/* ── LADO IZQUIERDO — decorativo ── */}
        <div className="register-left grid-bg">
          <div className="register-left-glow" />

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              ASTRAEUS GYM
            </span>
          </Link>

          {/* Contenido central */}
          <div className="register-left-content">
            <p className="label-tag" style={{ marginBottom: '16px' }}>Únete a la familia</p>
            <h2 className="display-lg" style={{ marginBottom: '24px' }}>
              START YOUR<br />
              <span className="text-yellow">JOURNEY</span>
            </h2>
            <p className="body-text" style={{ maxWidth: '360px', marginBottom: '40px' }}>
              Crea tu cuenta gratis y comienza a entrenar con los mejores coaches desde el primer día.
            </p>

            {/* Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {perks.map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={18} color="var(--yellow)" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>{perk}</span>
                </div>
              ))}
            </div>

            {/* Icono decorativo */}
            <div style={{ marginTop: '48px' }}>
              <Dumbbell size={80} color="rgba(255,220,0,0.08)" />
            </div>
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
            © 2026 ASTRAEUS GYM
          </p>
        </div>

        {/* ── LADO DERECHO — formulario ── */}
        <div className="register-right">

          {/* Logo visible solo en móvil (cuando el panel izquierdo está oculto) */}
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'none',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '36px',
            }}
            className="register-mobile-logo"
          >
            <style>{`
              @media (max-width: 768px) {
                .register-mobile-logo { display: flex !important; }
              }
            `}</style>
            <div style={{ width: '20px', height: '20px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              ASTRAEUS GYM
            </span>
          </Link>

          <p className="label-tag" style={{ marginBottom: '12px' }}>Crea tu cuenta</p>
          <h1 className="display-md" style={{ marginBottom: '8px' }}>REGÍSTRATE<br />GRATIS</h1>
          <div className="yellow-line" style={{ marginBottom: '40px' }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Nombre */}
            <div>
              <label className="gym-label">Nombre completo</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre completo"
                  className="gym-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="gym-label">Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@correo.com"
                  className="gym-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="gym-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="gym-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                textAlign: 'center',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading ? 'CREANDO CUENTA...' : <><span>CREAR CUENTA</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: 'var(--yellow)', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión →
              </Link>
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px' }}>
              <Link to="/" style={{ color: 'var(--text-subtle)', textDecoration: 'none', fontSize: '13px' }}>
                ← Volver al inicio
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  )
}

export default Register