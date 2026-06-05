import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      toast.success(`Bienvenido, ${res.data.user.name}!`)
      if (res.data.user.role === 'ADMIN') navigate('/admin')
      else if (res.data.user.role === 'COACH') navigate('/coach')
      else navigate('/client')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'stretch',
    }}>

      {/* ── LADO IZQUIERDO — decorativo ── */}
      <div className="grid-bg" style={{
        flex: 1, background: 'var(--bg-surface)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            ASTRAEUS GYM
          </span>
        </Link>

        {/* Texto central */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="label-tag" style={{ marginBottom: '16px' }}>Tu portal de entrenamiento</p>
          <h2 className="display-lg" style={{ marginBottom: '24px' }}>
            PUSH YOUR<br />
            <span className="text-yellow">LIMITS</span>
          </h2>
          <p className="body-text" style={{ maxWidth: '360px' }}>
            Accede a tu cuenta para reservar clases, ver tu historial y conectar con tus coaches.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '40px', marginTop: '48px' }}>
            {[{ n: '500+', l: 'Miembros' }, { n: '30+', l: 'Clases' }, { n: '10+', l: 'Coaches' }].map((s, i) => (
              <div key={i} style={{ borderLeft: '3px solid var(--yellow)', paddingLeft: '16px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '28px', margin: 0, lineHeight: 1 }}>{s.n}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', margin: '4px 0 0' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
          © 2026 ASTRAEUS GYM
        </p>
      </div>

      {/* ── LADO DERECHO — formulario ── */}
      <div style={{
        width: '480px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px 56px',
        background: 'var(--bg-base)',
      }}>
        <p className="label-tag" style={{ marginBottom: '12px' }}>Bienvenido de nuevo</p>
        <h1 className="display-md" style={{ marginBottom: '8px' }}>INICIAR<br />SESIÓN</h1>
        <div className="yellow-line" style={{ marginBottom: '40px' }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="gym-label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="tu@correo.com"
              className="gym-input"
            />
          </div>

          <div>
            <label className="gym-label">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="gym-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', textAlign: 'center', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'ENTRANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--yellow)', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate gratis →
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
  )
}

export default Login