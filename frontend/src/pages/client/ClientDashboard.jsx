import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import {
  User, CalendarDays, Dumbbell, TrendingUp, Settings,
  LogOut, ChevronLeft, ChevronRight, Crown, Star, Zap,
  Clock, CheckCircle, XCircle, Plus, X, Trash2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const ClientDashboard = () => {
  const { user, logout, login } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  const [subscription, setSubscription] = useState(null)
  const [classes, setClasses] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [routines, setRoutines] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressForm, setProgressForm] = useState({
    weight: '', height: '', fatIndex: '', muscleMass: '',
    targetWeight: '', targetMuscle: '', notes: ''
  })
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const fetchAll = async () => {
    try {
      const [classesRes, reservationsRes, routinesRes, progressRes] = await Promise.all([
        api.get('/classes'),
        api.get('/reservations/my'),
        api.get('/routines/my'),
        api.get('/progress'),
      ])
      setClasses(classesRes.data)
      setMyReservations(reservationsRes.data)
      setRoutines(routinesRes.data)
      setProgress(progressRes.data)

      try {
        const subRes = await api.get('/subscriptions/my')
        setSubscription(subRes.data || null)
      } catch { setSubscription(null) }

    } catch (err) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const daysLeft = (endDate) => {
    const now = new Date()
    const end = new Date(endDate)
    const nowMX = new Date(now.toLocaleString('en-US', { timeZone: 'America/Monterrey' }))
    const endMX = new Date(end.toLocaleString('en-US', { timeZone: 'America/Monterrey' }))
    endMX.setHours(23, 59, 59, 0)
    const diff = endMX - nowMX
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const daysColor = (days) => {
    if (days <= 5) return '#ff4444'
    if (days <= 15) return '#ff8c00'
    return '#00c864'
  }

  const planIcon = (type) => {
    if (type === 'GOLD') return <Crown size={16} color="#FFE000" />
    if (type === 'PREMIUM') return <Star size={16} color="#FFE000" />
    return <Zap size={16} color="rgba(255,255,255,0.4)" />
  }

  const canReserve = () => {
    if (!subscription || subscription.status !== 'ACTIVE') return false
    if (subscription.plan.type === 'GOLD') return true
    if (subscription.plan.type === 'PREMIUM') return subscription.tokens > 0
    return false
  }

  const isReserved = (classId) => myReservations.some(r => r.classId === classId && r.status === 'ACTIVE')
  const getReservationId = (classId) => myReservations.find(r => r.classId === classId && r.status === 'ACTIVE')?.id

  const handleReserve = async (classId) => {
    if (!canReserve()) {
      if (!subscription) return toast.error('No tienes una suscripción activa')
      if (subscription.plan.type === 'BASIC') return toast.error('Tu plan Basic no permite reservar clases')
      if (subscription.tokens <= 0) return toast.error('No tienes tokens disponibles')
    }
    try {
      await api.post('/reservations', { classId })
      toast.success('¡Clase reservada!')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar')
    }
  }

  const handleCancel = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/cancel`)
      toast.success('Reserva cancelada')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar')
    }
  }

  const handleAddProgress = async (e) => {
    e.preventDefault()
    try {
      await api.post('/progress', progressForm)
      toast.success('Registro agregado')
      setShowProgressModal(false)
      setProgressForm({ weight: '', height: '', fatIndex: '', muscleMass: '', targetWeight: '', targetMuscle: '', notes: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
  }

  const handleDeleteProgress = async (id) => {
    try {
      await api.delete(`/progress/${id}`)
      toast.success('Registro eliminado')
      fetchAll()
    } catch { toast.error('Error al eliminar') }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.put('/auth/profile', profileForm)
      const updatedUser = { ...user, name: res.data.name }
      login(localStorage.getItem('token'), updatedUser)
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setSavingProfile(false)
    }
  }

  const chartData = progress.map(p => ({
    date: new Date(p.createdAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', timeZone: 'America/Monterrey' }),
    Peso: p.weight,
    'Masa Muscular': p.muscleMass,
    '% Grasa': p.fatIndex,
  }))

  const navItems = [
    { id: 'account',  label: 'Mi Cuenta',  icon: <User size={20} /> },
    { id: 'classes',  label: 'Clases',      icon: <CalendarDays size={20} /> },
    { id: 'routines', label: 'Rutinas',     icon: <Dumbbell size={20} /> },
    { id: 'progress', label: 'Progreso',    icon: <TrendingUp size={20} /> },
    { id: 'profile',  label: 'Perfil',      icon: <Settings size={20} /> },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '4px', color: 'var(--text-muted)' }}>CARGANDO...</p>
    </div>
  )

  return (
    <>
      <style>{`
        /* ── Layout general ── */
        .cd-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
          font-family: var(--font-body);
        }

        /* ── Sidebar (desktop) ── */
        .cd-sidebar {
          width: var(--sidebar-w, 240px);
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          overflow: hidden;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .cd-sidebar.collapsed { width: 72px; }

        /* ── Bottom nav (móvil) ── */
        .cd-bottom-nav {
          display: none;
        }

        /* ── Main ── */
        .cd-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        /* ── Top bar ── */
        .cd-topbar {
          background: var(--yellow);
          padding: 14px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ── Content area ── */
        .cd-content {
          padding: 32px 40px;
          flex: 1;
        }

        /* ── Grids ── */
        .cd-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .cd-grid-classes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* ── Progress entries ── */
        .cd-progress-entry {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cd-progress-entry-data {
          display: flex;
          gap: 32px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* ── Modal ── */
        .cd-modal-box {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 40px;
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }
        .cd-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ════════════════════════════
           RESPONSIVE — MÓVIL (≤ 768px)
           ════════════════════════════ */
        @media (max-width: 768px) {

          /* Ocultar sidebar, mostrar bottom nav */
          .cd-sidebar { display: none; }

          .cd-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--bg-surface);
            border-top: 1px solid var(--border);
            z-index: 100;
            padding: 0;
          }
          .cd-bottom-nav button {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            color: var(--text-subtle);
            font-family: var(--font-body);
            font-size: 9px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            transition: color 0.2s;
            border-top: 2px solid transparent;
          }
          .cd-bottom-nav button.active {
            color: var(--yellow);
            border-top-color: var(--yellow);
          }

          /* Main ocupa todo, con espacio para bottom nav */
          .cd-main {
            padding-bottom: 64px;
          }

          /* Top bar compacto */
          .cd-topbar {
            padding: 12px 16px;
          }
          .cd-topbar-title {
            font-size: 15px !important;
          }
          .cd-topbar-date {
            display: none;
          }

          /* Content padding reducido */
          .cd-content {
            padding: 20px 16px;
          }

          /* Grids → 1 columna */
          .cd-grid-2 { grid-template-columns: 1fr; }
          .cd-grid-classes { grid-template-columns: 1fr; }

          /* Progress entries → apilar */
          .cd-progress-entry {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .cd-progress-entry-data {
            gap: 16px;
          }

          /* Modal → casi full screen */
          .cd-modal-box {
            width: 100%;
            max-width: 100vw;
            max-height: 85vh;
            padding: 24px 20px;
          }
          .cd-modal-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Tablet (768px – 1024px): sidebar colapsado por defecto */
        @media (min-width: 769px) and (max-width: 1024px) {
          .cd-sidebar { width: 72px; }
          .cd-topbar { padding: 14px 24px; }
          .cd-content { padding: 24px; }
          .cd-grid-classes { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cd-wrapper">

        {/* ── SIDEBAR (desktop/tablet) ── */}
        <aside className={`cd-sidebar${collapsed ? ' collapsed' : ''}`}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '72px' }}>
            <div style={{ width: '22px', height: '22px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', flexShrink: 0 }} />
            {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ASTRAEUS</span>}
          </div>

          <nav style={{ flex: 1, padding: '16px 0' }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 20px', border: 'none', cursor: 'pointer',
                background: activeTab === item.id ? 'var(--yellow-dim)' : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid var(--yellow)' : '3px solid transparent',
                color: activeTab === item.id ? 'var(--yellow)' : 'var(--text-muted)',
                transition: 'all 0.2s', textAlign: 'left',
              }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
            <button onClick={handleLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>Cerrar sesión</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-end',
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-subtle)', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--yellow)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </aside>

        {/* ── BOTTOM NAV (móvil) ── */}
        <nav className="cd-bottom-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={activeTab === item.id ? 'active' : ''}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={handleLogout} style={{ color: 'var(--text-subtle)' }}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </nav>

        {/* ── MAIN ── */}
        <main className="cd-main">

          {/* Top bar */}
          <div className="cd-topbar">
            <div>
              <p className="cd-topbar-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: '#0f0f0f', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                BIENVENIDO, {user?.name?.toUpperCase()}
              </p>
              <p className="cd-topbar-date" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Monterrey' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>CLIENT</span>
            </div>
          </div>

          <div className="cd-content">

            {/* ── MI CUENTA ── */}
            {activeTab === 'account' && (
              <div>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>MI CUENTA</h2>
                <div className="cd-grid-2">

                  {/* Info personal */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', color: 'var(--yellow)' }}>{user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', margin: 0, letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Rol', value: user?.role },
                        { label: 'Miembro desde', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Monterrey' }) },
                        { label: 'Reservas activas', value: myReservations.filter(r => r.status === 'ACTIVE').length },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suscripción */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px' }}>
                    <h3 className="display-sm" style={{ fontSize: '16px', marginBottom: '20px' }}>MI SUSCRIPCIÓN</h3>
                    {subscription ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          {planIcon(subscription.plan.type)}
                          <div>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', margin: 0, color: 'var(--yellow)' }}>{subscription.plan.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{subscription.plan.type}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { label: 'Estado', value: <span className={`badge ${subscription.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{subscription.status}</span> },
                            { label: 'Vence', value: new Date(subscription.endDate).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' }) },
                            { label: 'Días restantes', value: <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: daysColor(daysLeft(subscription.endDate)) }}>{daysLeft(subscription.endDate)}d</span> },
                            ...(subscription.tokens !== null ? [{ label: 'Tokens disponibles', value: <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)' }}>{subscription.tokens}</span> }] : []),
                          ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</span>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                          {subscription.plan.type === 'GOLD' && <p style={{ fontSize: '13px', color: '#00c864', margin: 0 }}>✓ Acceso ilimitado a todas las clases</p>}
                          {subscription.plan.type === 'PREMIUM' && <p style={{ fontSize: '13px', color: 'var(--yellow)', margin: 0 }}>⚡ {subscription.tokens} tokens disponibles para reservar clases</p>}
                          {subscription.plan.type === 'BASIC' && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>👁 Puedes ver las clases pero no reservarlas</p>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <XCircle size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Sin suscripción activa</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '8px' }}>Contacta al administrador para activar tu plan</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── CLASES ── */}
            {activeTab === 'classes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 className="display-sm">CLASES</h2>
                  {subscription && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {planIcon(subscription.plan.type)}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subscription.plan.name}</span>
                      {subscription.tokens !== null && (
                        <span className="badge badge-yellow">{subscription.tokens} tokens</span>
                      )}
                    </div>
                  )}
                </div>

                {!subscription && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,68,68,0.3)', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <XCircle size={18} color="#ff4444" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', color: '#ff4444', margin: 0 }}>No tienes suscripción activa. Contacta al administrador.</p>
                  </div>
                )}

                {subscription?.plan?.type === 'BASIC' && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,220,0,0.3)', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={18} color="var(--yellow)" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', color: 'var(--yellow)', margin: 0 }}>Tu plan Basic te permite ver las clases pero no reservarlas. Actualiza a Premium o Gold.</p>
                  </div>
                )}

                <div className="cd-grid-classes">
                  {classes.map(c => (
                    <div key={c.id} className="gym-card" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{c.name}</h3>
                        <span className={`badge ${c.occupied >= c.maxCapacity ? 'badge-red' : 'badge-green'}`}>
                          {c.occupied}/{c.maxCapacity}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>{c.description}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarDays size={14} color="var(--yellow)" />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="var(--yellow)" />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(c.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Monterrey' })} — {new Date(c.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Monterrey' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} color="var(--yellow)" />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Coach: {c.coach.name}</span>
                        </div>
                      </div>

                      {isReserved(c.id) ? (
                        <button onClick={() => handleCancel(getReservationId(c.id))} className="btn-danger" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <XCircle size={16} /> Cancelar reserva
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReserve(c.id)}
                          disabled={!canReserve() || c.occupied >= c.maxCapacity}
                          className="btn-primary"
                          style={{ width: '100%', padding: '10px', textAlign: 'center', fontSize: '14px', opacity: (!canReserve() || c.occupied >= c.maxCapacity) ? 0.4 : 1, cursor: (!canReserve() || c.occupied >= c.maxCapacity) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <CheckCircle size={16} />
                          {c.occupied >= c.maxCapacity ? 'CLASE LLENA' : subscription?.plan?.type === 'PREMIUM' ? 'RESERVAR (1 TOKEN)' : 'RESERVAR'}
                        </button>
                      )}
                    </div>
                  ))}
                  {classes.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>No hay clases disponibles</p>}
                </div>

                {/* Mis reservas */}
                {myReservations.length > 0 && (
                  <div style={{ marginTop: '40px' }}>
                    <h3 className="display-sm" style={{ fontSize: '16px', marginBottom: '16px' }}>MIS RESERVAS</h3>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      {myReservations.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.class.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                              {new Date(r.class.date).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })} · Coach: {r.class.coach.name}
                            </p>
                          </div>
                          <span className={`badge ${r.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`} style={{ flexShrink: 0 }}>{r.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── RUTINAS ── */}
            {activeTab === 'routines' && (
              <div>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>MIS RUTINAS</h2>
                {routines.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Dumbbell size={64} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sin rutinas asignadas</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>Tu coach te asignará rutinas personalizadas</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {routines.map(r => (
                      <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{r.title}</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Asignada por: {r.coach.name}</p>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', flexShrink: 0 }}>
                            {new Date(r.createdAt).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })}
                          </span>
                        </div>
                        {r.description && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>{r.description}</p>}
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '16px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--yellow)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Ejercicios</p>
                          <pre style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{r.exercises}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PROGRESO ── */}
            {activeTab === 'progress' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">MI PROGRESO</h2>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowProgressModal(true)}>
                    <Plus size={16} /> <span className="hide-xs">Nuevo registro</span>
                  </button>
                </div>

                <style>{`.hide-xs { } @media (max-width: 400px) { .hide-xs { display: none; } }`}</style>

                {progress.length > 1 ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                    <h3 className="display-sm" style={{ fontSize: '16px', marginBottom: '24px' }}>HISTORIAL DE PROGRESO</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'var(--font-body)' }} />
                        <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="Peso" stroke="#FFE000" strokeWidth={2} dot={{ fill: '#FFE000', r: 4 }} />
                        <Line type="monotone" dataKey="Masa Muscular" stroke="#00c864" strokeWidth={2} dot={{ fill: '#00c864', r: 4 }} />
                        <Line type="monotone" dataKey="% Grasa" stroke="#ff4444" strokeWidth={2} dot={{ fill: '#ff4444', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : progress.length === 1 ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Agrega al menos 2 registros para ver la gráfica de progreso</p>
                  </div>
                ) : null}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {progress.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                      <TrendingUp size={64} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 16px', display: 'block' }} />
                      <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sin registros de progreso</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>Empieza registrando tu peso y medidas de hoy</p>
                    </div>
                  )}
                  {[...progress].reverse().map(p => (
                    <div key={p.id} className="cd-progress-entry">
                      <div className="cd-progress-entry-data">
                        <div>
                          <p style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Fecha</p>
                          <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{new Date(p.createdAt).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })}</p>
                        </div>
                        {p.weight && <div><p style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Peso</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--yellow)' }}>{p.weight} kg</p></div>}
                        {p.muscleMass && <div><p style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Músculo</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#00c864' }}>{p.muscleMass} kg</p></div>}
                        {p.fatIndex && <div><p style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>% Grasa</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ff4444' }}>{p.fatIndex}%</p></div>}
                        {p.height && <div><p style={{ fontSize: '11px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Estatura</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{p.height} cm</p></div>}
                      </div>
                      <button onClick={() => handleDeleteProgress(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', transition: 'color 0.2s', flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PERFIL ── */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: '480px' }}>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>MI PERFIL</h2>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '32px' }}>
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label className="gym-label">Nombre</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        className="gym-input"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="gym-label">Correo electrónico</label>
                      <input type="email" value={user?.email} disabled className="gym-input" style={{ opacity: 0.4, cursor: 'not-allowed' }} />
                      <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '6px', letterSpacing: '1px' }}>El correo no puede modificarse</p>
                    </div>
                    <div>
                      <label className="gym-label">Rol</label>
                      <input type="text" value={user?.role} disabled className="gym-input" style={{ opacity: 0.4, cursor: 'not-allowed' }} />
                    </div>
                    <button type="submit" disabled={savingProfile} className="btn-primary" style={{ width: '100%', textAlign: 'center', opacity: savingProfile ? 0.6 : 1, cursor: savingProfile ? 'not-allowed' : 'pointer' }}>
                      {savingProfile ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ── MODAL: PROGRESO ── */}
        {showProgressModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="cd-modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">NUEVO REGISTRO</h3>
                <button onClick={() => setShowProgressModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddProgress} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="cd-modal-grid">
                  {[
                    { label: 'Peso (kg)', key: 'weight', placeholder: '70.5' },
                    { label: 'Estatura (cm)', key: 'height', placeholder: '175' },
                    { label: '% Grasa corporal', key: 'fatIndex', placeholder: '15.0' },
                    { label: 'Masa muscular (kg)', key: 'muscleMass', placeholder: '35.0' },
                    { label: 'Objetivo de peso (kg)', key: 'targetWeight', placeholder: '65.0' },
                    { label: 'Objetivo músculo (kg)', key: 'targetMuscle', placeholder: '38.0' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="gym-label">{field.label}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={progressForm[field.key]}
                        onChange={e => setProgressForm({ ...progressForm, [field.key]: e.target.value })}
                        className="gym-input"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="gym-label">Notas (opcional)</label>
                  <input type="text" value={progressForm.notes} onChange={e => setProgressForm({ ...progressForm, notes: e.target.value })} className="gym-input" placeholder="Ej. Me sentí con más energía hoy" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>GUARDAR REGISTRO</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default ClientDashboard