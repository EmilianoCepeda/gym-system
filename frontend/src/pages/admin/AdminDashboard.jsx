import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import {
  Users, UserCheck, DollarSign, LayoutDashboard,
  ChevronLeft, ChevronRight, Crown, Star, Zap,
  Plus, Gift, CreditCard, Clock, AlertTriangle,
  BarChart2, Settings, LogOut, X, Check,
  Calendar, Palette
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const [schedules, setSchedules] = useState([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    coachId: '', dayOfWeek: '1', startTime: '', endTime: '', color: '#FFE000'
  })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const [assignForm, setAssignForm] = useState({ userId: '', planId: '', durationDays: '30' })
  const [planForm, setPlanForm] = useState({ name: '', price: '', type: 'BASIC', tokenLimit: '', description: '' })
  const [tokenForm, setTokenForm] = useState({ userId: '', tokens: '' })
  const [paymentForm, setPaymentForm] = useState({ userId: '', amount: '', note: '' })

  const fetchAll = async () => {
    try {
      const [usersRes, plansRes, subsRes, paymentsRes, schedulesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/subscriptions/plans'),
        api.get('/subscriptions'),
        api.get('/subscriptions/payments'),
        api.get('/schedules'),
      ])
      setUsers(usersRes.data)
      setPlans(plansRes.data)
      setSubscriptions(subsRes.data)
      setPayments(paymentsRes.data)
      setSchedules(schedulesRes.data)
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0)
  const activeClients = users.filter(u => u.role === 'CLIENT').length
  const coaches = users.filter(u => u.role === 'COACH').length
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length

  const chartData = (() => {
    const months = {}
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      months[month] = (months[month] || 0) + p.amount
    })
    return Object.entries(months).map(([month, amount]) => ({ month, amount }))
  })()

  const daysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date()
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

  const sortedSubs = [...subscriptions].sort((a, b) => daysLeft(a.endDate) - daysLeft(b.endDate))

  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',    icon: <LayoutDashboard size={20} /> },
    { id: 'users',         label: 'Clientes',     icon: <Users size={20} /> },
    { id: 'employees',     label: 'Empleados',    icon: <UserCheck size={20} /> },
    { id: 'subscriptions', label: 'Suscripciones',icon: <CreditCard size={20} /> },
    { id: 'plans',         label: 'Planes',       icon: <Crown size={20} /> },
    { id: 'revenue',       label: 'Ingresos',     icon: <DollarSign size={20} /> },
    { id: 'schedules',     label: 'Horarios',     icon: <Calendar size={20} /> },
  ]

  const handleAssign = async (e) => {
    e.preventDefault()
    try {
      await api.post('/subscriptions/assign', assignForm)
      toast.success('Suscripción asignada')
      setShowAssignModal(false)
      setAssignForm({ userId: '', planId: '', durationDays: '30' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await api.put(`/subscriptions/plans/${editingPlan.id}`, planForm)
        toast.success('Plan actualizado')
      } else {
        await api.post('/subscriptions/plans', planForm)
        toast.success('Plan creado')
      }
      setShowPlanModal(false)
      setPlanForm({ name: '', price: '', type: 'BASIC', tokenLimit: '', description: '' })
      setEditingPlan(null)
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleDeletePlan = async (id) => {
    try {
      await api.delete(`/subscriptions/plans/${id}`)
      toast.success('Plan eliminado')
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleGrantTokens = async (e) => {
    e.preventDefault()
    try {
      await api.post('/subscriptions/grant-tokens', tokenForm)
      toast.success('Tokens otorgados')
      setShowTokenModal(false)
      setTokenForm({ userId: '', tokens: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleManualPayment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/subscriptions/payments/manual', paymentForm)
      toast.success('Pago registrado')
      setShowPaymentModal(false)
      setPaymentForm({ userId: '', amount: '', note: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleChangeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}`, { role })
      toast.success('Rol actualizado')
      fetchAll()
    } catch { toast.error('Error al cambiar rol') }
  }

  const handleToggleVerified = async (id, verified) => {
    try {
      await api.put(`/admin/users/${id}`, { verified: !verified })
      toast.success('Usuario actualizado')
      fetchAll()
    } catch { toast.error('Error') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '4px', color: 'var(--text-muted)' }}>CARGANDO...</p>
    </div>
  )

  /* ── Estilos compartidos para celdas de tabla-card en móvil ── */
  const cardRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>
    </div>
  )

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .ad-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
          font-family: var(--font-body);
        }

        /* ── Sidebar ── */
        .ad-sidebar {
          width: 240px;
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
        .ad-sidebar.collapsed { width: 72px; }

        /* ── Bottom nav (móvil) ── */
        .ad-bottom-nav { display: none; }

        /* ── Main ── */
        .ad-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        /* ── Top bar ── */
        .ad-topbar {
          background: var(--yellow);
          padding: 14px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ── Content ── */
        .ad-content { padding: 32px 40px; flex: 1; }

        /* ── Stat cards grid ── */
        .ad-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        /* ── Plans grid ── */
        .ad-plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* ── Revenue summary grid ── */
        .ad-revenue-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        /* ── Tables: visible en desktop, ocultas en móvil ── */
        .ad-table-wrap { display: block; }
        /* ── Cards móvil: ocultas en desktop ── */
        .ad-mobile-cards { display: none; }

        /* ── Suscripciones legend ── */
        .ad-legend {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        /* ── Horario grid (7 días) ── */
        .ad-schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .ad-schedule-scroll { /* sin scroll en desktop */ }

        /* ── Modal box ── */
        .ad-modal-box {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 40px;
          width: 480px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }
        .ad-modal-box-sm {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 40px;
          width: 420px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }
        .ad-modal-box-md {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 40px;
          width: 460px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }
        .ad-plan-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .ad-schedule-time-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ════════════════════════
           TABLET (769 – 1024px)
           ════════════════════════ */
        @media (min-width: 769px) and (max-width: 1024px) {
          .ad-sidebar { width: 72px; }
          .ad-topbar { padding: 14px 24px; }
          .ad-content { padding: 24px; }
          .ad-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ad-plans-grid { grid-template-columns: repeat(2, 1fr); }
          .ad-revenue-grid { grid-template-columns: repeat(2, 1fr); }
          .ad-schedule-scroll { overflow-x: auto; }
          .ad-schedule-grid { min-width: 560px; }
        }

        /* ════════════════════════
           MÓVIL (≤ 768px)
           ════════════════════════ */
        @media (max-width: 768px) {

          /* Sidebar → ocultar; bottom nav → mostrar */
          .ad-sidebar { display: none; }

          .ad-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--bg-surface);
            border-top: 1px solid var(--border);
            z-index: 100;
            overflow-x: auto;
          }
          .ad-bottom-nav::-webkit-scrollbar { display: none; }
          .ad-bottom-nav button {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 8px 12px;
            border: none;
            background: transparent;
            cursor: pointer;
            color: var(--text-subtle);
            font-family: var(--font-body);
            font-size: 9px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-top: 2px solid transparent;
            white-space: nowrap;
          }
          .ad-bottom-nav button.active {
            color: var(--yellow);
            border-top-color: var(--yellow);
          }

          .ad-main { padding-bottom: 64px; }

          /* Top bar compacto */
          .ad-topbar { padding: 12px 16px; }
          .ad-topbar-title { font-size: 15px !important; }
          .ad-topbar-sub { display: none; }

          /* Content */
          .ad-content { padding: 20px 16px; }

          /* Grids → 1 columna */
          .ad-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .ad-plans-grid { grid-template-columns: 1fr; }
          .ad-revenue-grid { grid-template-columns: 1fr; }

          /* Tablas → cards */
          .ad-table-wrap { display: none; }
          .ad-mobile-cards { display: flex; flex-direction: column; gap: 12px; }

          /* Legend */
          .ad-legend { flex-direction: column; gap: 8px; }

          /* Horario → scroll horizontal */
          .ad-schedule-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .ad-schedule-grid { min-width: 560px; gap: 6px; }

          /* Modal → casi full screen */
          .ad-modal-box,
          .ad-modal-box-sm,
          .ad-modal-box-md {
            width: 100%;
            max-width: 100vw;
            max-height: 88vh;
            padding: 24px 20px;
          }
          .ad-plan-grid-2 { grid-template-columns: 1fr; }
          .ad-schedule-time-grid { grid-template-columns: 1fr; }

          /* Sub header con botones: wrap */
          .ad-section-header {
            flex-wrap: wrap;
            gap: 12px;
          }
          .ad-section-header-btns {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}</style>

      <div className="ad-wrapper">

        {/* ── SIDEBAR ── */}
        <aside className={`ad-sidebar${collapsed ? ' collapsed' : ''}`}>
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
                {!collapsed && <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>Cerrar sesión</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', padding: '12px 20px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-subtle)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--yellow)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </aside>

        {/* ── BOTTOM NAV (móvil) ── */}
        <nav className="ad-bottom-nav">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? 'active' : ''}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={handleLogout}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </nav>

        {/* ── MAIN ── */}
        <main className="ad-main">

          {/* Top bar */}
          <div className="ad-topbar">
            <div>
              <p className="ad-topbar-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: '#0f0f0f', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                BIENVENIDO, {user?.name?.toUpperCase()}
              </p>
              <p className="ad-topbar-sub" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
                Panel de administración — {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Monterrey' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>ADMIN</span>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="ad-content">

            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>RESUMEN GENERAL</h2>

                <div className="ad-stats-grid">
                  {[
                    { label: 'Clientes totales', value: activeClients, icon: <Users size={24} />, color: 'var(--yellow)' },
                    { label: 'Coaches',           value: coaches,       icon: <UserCheck size={24} />, color: '#00c864' },
                    { label: 'Suscripciones',     value: activeSubs,    icon: <CreditCard size={24} />, color: '#7c6fff' },
                    { label: 'Ingresos totales',  value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, color: 'var(--yellow)' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ color: s.color, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '26px', margin: 0, lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '24px', fontSize: '16px' }}>INGRESOS POR MES</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'var(--font-body)' }} cursor={{ fill: 'rgba(255,220,0,0.05)' }} />
                        <Bar dataKey="amount" fill="var(--yellow)" radius={0} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin datos de ingresos aún</p>
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '16px', fontSize: '16px' }}>SUSCRIPCIONES POR VENCER</h3>
                  {sortedSubs.slice(0, 5).map(s => {
                    const days = daysLeft(s.endDate)
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {planIcon(s.plan.type)}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.user.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{s.plan.name}</p>
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: daysColor(days), letterSpacing: '1px', flexShrink: 0 }}>
                          {days === 0 ? 'VENCIDA' : `${days} días`}
                        </span>
                      </div>
                    )
                  })}
                  {sortedSubs.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin suscripciones activas</p>}
                </div>
              </div>
            )}

            {/* ── CLIENTES ── */}
            {activeTab === 'users' && (
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">CLIENTES</h2>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAssignModal(true)}>
                    <Plus size={16} /> Asignar suscripción
                  </button>
                </div>

                {/* Tabla desktop */}
                <div className="ad-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {['Nombre', 'Correo', 'Rol', 'Verificado', 'Suscripción', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'CLIENT').map(u => {
                        const sub = subscriptions.find(s => s.userId === u.id)
                        return (
                          <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{u.name}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
                                <option value="CLIENT">CLIENT</option>
                                <option value="COACH">COACH</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Verificado' : 'Pendiente'}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {sub ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {planIcon(sub.plan.type)}
                                  <span style={{ fontSize: '13px', color: 'var(--yellow)' }}>{sub.plan.name}</span>
                                </div>
                              ) : <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>Sin plan</span>}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button onClick={() => handleToggleVerified(u.id, u.verified)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                {u.verified ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards móvil */}
                <div className="ad-mobile-cards">
                  {users.filter(u => u.role === 'CLIENT').map(u => {
                    const sub = subscriptions.find(s => s.userId === u.id)
                    return (
                      <div key={u.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', margin: 0 }}>{u.name}</p>
                          <span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Verificado' : 'Pendiente'}</span>
                        </div>
                        {cardRow('Correo', u.email)}
                        {cardRow('Suscripción', sub
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{planIcon(sub.plan.type)}<span style={{ color: 'var(--yellow)' }}>{sub.plan.name}</span></span>
                          : <span style={{ color: 'var(--text-subtle)' }}>Sin plan</span>
                        )}
                        {cardRow('Rol',
                          <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}>
                            <option value="CLIENT">CLIENT</option>
                            <option value="COACH">COACH</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                        <div style={{ marginTop: '12px' }}>
                          <button onClick={() => handleToggleVerified(u.id, u.verified)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '1px', textTransform: 'uppercase', padding: 0 }}>
                            {u.verified ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── EMPLEADOS ── */}
            {activeTab === 'employees' && (
              <div>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>EMPLEADOS</h2>

                {/* Tabla desktop */}
                <div className="ad-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {['Empleado', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').map(u => {
                        const isCurrentUser = u.id === user?.id
                        return (
                          <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--yellow)' }}>{u.name[0].toUpperCase()}</span>
                                </div>
                                <div>
                                  <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{u.name}</p>
                                  {isCurrentUser && <p style={{ fontSize: '11px', color: 'var(--yellow)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu cuenta</p>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} disabled={isCurrentUser} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: isCurrentUser ? 'var(--text-subtle)' : 'var(--text-primary)', padding: '6px 10px', fontSize: '12px', fontFamily: 'var(--font-body)', outline: 'none', cursor: isCurrentUser ? 'not-allowed' : 'pointer', opacity: isCurrentUser ? 0.7 : 1 }}>
                                <option value="CLIENT">CLIENT</option>
                                <option value="COACH">COACH</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Activo' : 'Inactivo'}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button onClick={() => handleToggleVerified(u.id, u.verified)} disabled={isCurrentUser} style={{ background: u.verified ? 'rgba(255,68,68,0.08)' : 'var(--yellow-dim)', border: `1px solid ${u.verified ? 'rgba(255,68,68,0.35)' : 'rgba(255,220,0,0.3)'}`, color: u.verified ? '#ff4444' : 'var(--yellow)', padding: '7px 12px', fontSize: '11px', cursor: isCurrentUser ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: isCurrentUser ? 0.5 : 1 }}>
                                {u.verified ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                      <UserCheck size={48} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-subtle)', fontSize: '14px', margin: 0 }}>Sin empleados registrados</p>
                    </div>
                  )}
                </div>

                {/* Cards móvil */}
                <div className="ad-mobile-cards">
                  {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').map(u => {
                    const isCurrentUser = u.id === user?.id
                    return (
                      <div key={u.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{u.name[0].toUpperCase()}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                              {isCurrentUser && <p style={{ fontSize: '10px', color: 'var(--yellow)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Tu cuenta</p>}
                            </div>
                          </div>
                          <span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Activo' : 'Inactivo'}</span>
                        </div>
                        {cardRow('Correo', u.email)}
                        {cardRow('Rol',
                          <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} disabled={isCurrentUser} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: isCurrentUser ? 'var(--text-subtle)' : 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', fontFamily: 'var(--font-body)', outline: 'none', cursor: isCurrentUser ? 'not-allowed' : 'pointer', opacity: isCurrentUser ? 0.7 : 1 }}>
                            <option value="CLIENT">CLIENT</option>
                            <option value="COACH">COACH</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                        <div style={{ marginTop: '12px' }}>
                          <button onClick={() => handleToggleVerified(u.id, u.verified)} disabled={isCurrentUser} style={{ background: u.verified ? 'rgba(255,68,68,0.08)' : 'var(--yellow-dim)', border: `1px solid ${u.verified ? 'rgba(255,68,68,0.35)' : 'rgba(255,220,0,0.3)'}`, color: u.verified ? '#ff4444' : 'var(--yellow)', padding: '6px 12px', fontSize: '11px', cursor: isCurrentUser ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: isCurrentUser ? 0.5 : 1 }}>
                            {u.verified ? 'Desactivar cuenta' : 'Activar cuenta'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <UserCheck size={48} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin empleados registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SUSCRIPCIONES ── */}
            {activeTab === 'subscriptions' && (
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">SUSCRIPCIONES</h2>
                  <div className="ad-section-header-btns" style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-outline" style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowTokenModal(true)}>
                      <Gift size={16} /> Tokens
                    </button>
                    <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAssignModal(true)}>
                      <Plus size={16} /> Asignar
                    </button>
                  </div>
                </div>

                {/* Tabla desktop */}
                <div className="ad-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {['Usuario', 'Plan', 'Inicio', 'Vencimiento', 'Días restantes', 'Tokens', 'Estado'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubs.map(s => {
                        const days = daysLeft(s.endDate)
                        return (
                          <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{s.user.name}</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{s.user.email}</p>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {planIcon(s.plan.type)}
                                <span style={{ fontSize: '13px' }}>{s.plan.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(s.startDate).toLocaleDateString('es-MX')}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(s.endDate).toLocaleDateString('es-MX')}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: daysColor(days) }}>
                                {days === 0 ? 'VENCIDA' : `${days}d`}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '14px', color: s.tokens !== null ? 'var(--yellow)' : 'var(--text-subtle)' }}>
                              {s.tokens !== null ? `${s.tokens} tkn` : '—'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{s.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {sortedSubs.length === 0 && <p style={{ padding: '24px', color: 'var(--text-subtle)', fontSize: '14px' }}>Sin suscripciones registradas</p>}
                </div>

                {/* Cards móvil */}
                <div className="ad-mobile-cards" style={{ marginBottom: '24px' }}>
                  {sortedSubs.map(s => {
                    const days = daysLeft(s.endDate)
                    return (
                      <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.user.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{s.user.email}</p>
                          </div>
                          <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0, marginLeft: '8px' }}>{s.status}</span>
                        </div>
                        {cardRow('Plan', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{planIcon(s.plan.type)}{s.plan.name}</span>)}
                        {cardRow('Vencimiento', new Date(s.endDate).toLocaleDateString('es-MX'))}
                        {cardRow('Días restantes', <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: daysColor(days) }}>{days === 0 ? 'VENCIDA' : `${days}d`}</span>)}
                        {s.tokens !== null && cardRow('Tokens', <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{s.tokens} tkn</span>)}
                      </div>
                    )
                  })}
                  {sortedSubs.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin suscripciones registradas</p>}
                </div>

                <div className="ad-legend">
                  {[{ color: '#ff4444', label: '≤ 5 días — Crítico' }, { color: '#ff8c00', label: '6-15 días — Próximo' }, { color: '#00c864', label: '> 16 días — Activo' }].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PLANES ── */}
            {activeTab === 'plans' && (
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">PLANES DE SUSCRIPCIÓN</h2>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: '', type: 'BASIC', tokenLimit: '', description: '' }); setShowPlanModal(true) }}>
                    <Plus size={16} /> Nuevo plan
                  </button>
                </div>
                <div className="ad-plans-grid">
                  {plans.map(p => (
                    <div key={p.id} className="gym-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {planIcon(p.type)}
                          <h3 className="display-sm" style={{ fontSize: '18px' }}>{p.name}</h3>
                        </div>
                        <span className="badge badge-yellow">{p.type}</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', color: 'var(--yellow)', margin: '0 0 8px', lineHeight: 1 }}>${p.price}<span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></p>
                      {p.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>{p.description}</p>}
                      {p.tokenLimit && <p style={{ fontSize: '13px', color: 'var(--yellow)', marginBottom: '16px' }}><Zap size={14} style={{ display: 'inline', marginRight: '4px' }} />{p.tokenLimit} tokens/mes</p>}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button onClick={() => { setEditingPlan(p); setPlanForm({ name: p.name, price: p.price, type: p.type, tokenLimit: p.tokenLimit || '', description: p.description || '' }); setShowPlanModal(true) }} style={{ flex: 1, background: 'var(--yellow-dim)', border: '1px solid rgba(255,220,0,0.3)', color: 'var(--yellow)', padding: '8px', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => handleDeletePlan(p.id)} className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {plans.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin planes creados. Crea el primero.</p>}
                </div>
              </div>
            )}

            {/* ── INGRESOS ── */}
            {activeTab === 'revenue' && (
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">INGRESOS</h2>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowPaymentModal(true)}>
                    <Plus size={16} /> Registrar pago
                  </button>
                </div>

                <div className="ad-revenue-grid">
                  {[
                    { label: 'Total acumulado', value: `$${totalRevenue.toLocaleString()}` },
                    { label: 'Pagos registrados', value: payments.length },
                    { label: 'Promedio por pago', value: payments.length > 0 ? `$${(totalRevenue / payments.length).toFixed(2)}` : '$0' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '32px', color: 'var(--yellow)', margin: 0, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '24px', fontSize: '16px' }}>INGRESOS POR MES</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'var(--font-body)' }} cursor={{ fill: 'rgba(255,220,0,0.05)' }} />
                        <Bar dataKey="amount" fill="var(--yellow)" radius={0} name="Ingresos $" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin datos de ingresos aún. Registra el primer pago.</p>
                    </div>
                  )}
                </div>

                {/* Tabla desktop */}
                <div className="ad-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {['Usuario', 'Monto', 'Nota', 'Fecha'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{p.user.name}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--yellow)' }}>${p.amount.toLocaleString()}</span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.note || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('es-MX')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length === 0 && <p style={{ padding: '24px', color: 'var(--text-subtle)', fontSize: '14px' }}>Sin pagos registrados</p>}
                </div>

                {/* Cards móvil */}
                <div className="ad-mobile-cards">
                  {payments.map(p => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{p.user.name}</p>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)' }}>${p.amount.toLocaleString()}</span>
                      </div>
                      {cardRow('Fecha', new Date(p.createdAt).toLocaleDateString('es-MX'))}
                      {cardRow('Nota', p.note || '—')}
                    </div>
                  ))}
                  {payments.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin pagos registrados</p>}
                </div>
              </div>
            )}

            {/* ── HORARIOS ── */}
            {activeTab === 'schedules' && (
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="display-sm">HORARIOS DE COACHES</h2>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowScheduleModal(true)}>
                    <Plus size={16} /> Asignar turno
                  </button>
                </div>

                {users.filter(u => u.role === 'COACH').map(coach => {
                  const coachSchedules = schedules.filter(s => s.coachId === coach.id)
                  const coachColor = coachSchedules[0]?.color || '#FFE000'
                  return (
                    <div key={coach.id} style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: coachColor, flexShrink: 0 }} />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{coach.name}</h3>
                        <span className="badge badge-yellow">{coachSchedules.length} turnos</span>
                      </div>
                      <div className="ad-schedule-scroll">
                        <div className="ad-schedule-grid">
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => {
                            const daySchedules = coachSchedules.filter(s => s.dayOfWeek === i)
                            return (
                              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px', minHeight: '100px' }}>
                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', textAlign: 'center' }}>{day}</p>
                                {daySchedules.map(s => (
                                  <div key={s.id} style={{ background: s.color, padding: '6px 8px', marginBottom: '6px', position: 'relative' }}>
                                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '11px', color: '#0f0f0f', margin: 0 }}>{s.startTime}</p>
                                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', color: 'rgba(0,0,0,0.6)', margin: 0 }}>{s.endTime}</p>
                                    <button onClick={async () => { await api.delete(`/schedules/${s.id}`); fetchAll() }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', fontSize: '10px', lineHeight: 1, padding: '2px' }}>✕</button>
                                  </div>
                                ))}
                                {daySchedules.length === 0 && <p style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'center', marginTop: '8px' }}>—</p>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {users.filter(u => u.role === 'COACH').length === 0 && (
                  <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin coaches registrados</p>
                )}
              </div>
            )}

          </div>
        </main>

        {/* ── MODALES ── */}

        {/* Asignar suscripción */}
        {showAssignModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="ad-modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">ASIGNAR SUSCRIPCIÓN</h3>
                <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="gym-label">Usuario</label>
                  <select value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    <option value="">Selecciona un usuario</option>
                    {users.filter(u => u.role === 'CLIENT').map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gym-label">Plan</label>
                  <select value={assignForm.planId} onChange={e => setAssignForm({ ...assignForm, planId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    <option value="">Selecciona un plan</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes</option>)}
                  </select>
                </div>
                <div>
                  <label className="gym-label">Duración (días)</label>
                  <input type="number" value={assignForm.durationDays} onChange={e => setAssignForm({ ...assignForm, durationDays: e.target.value })} required min="1" className="gym-input" placeholder="30" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>ASIGNAR</button>
              </form>
            </div>
          </div>
        )}

        {/* Plan */}
        {showPlanModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="ad-modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">{editingPlan ? 'EDITAR PLAN' : 'NUEVO PLAN'}</h3>
                <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="gym-label">Nombre del plan</label>
                  <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} required className="gym-input" placeholder="Ej. Gold Mensual" />
                </div>
                <div className="ad-plan-grid-2">
                  <div>
                    <label className="gym-label">Precio ($)</label>
                    <input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} required min="0" step="0.01" className="gym-input" placeholder="499.00" />
                  </div>
                  <div>
                    <label className="gym-label">Tipo</label>
                    <select value={planForm.type} onChange={e => setPlanForm({ ...planForm, type: e.target.value })} className="gym-input" style={{ cursor: 'pointer' }}>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="GOLD">GOLD</option>
                    </select>
                  </div>
                </div>
                {planForm.type === 'PREMIUM' && (
                  <div>
                    <label className="gym-label">Tokens por mes</label>
                    <input type="number" value={planForm.tokenLimit} onChange={e => setPlanForm({ ...planForm, tokenLimit: e.target.value })} min="1" className="gym-input" placeholder="10" />
                  </div>
                )}
                <div>
                  <label className="gym-label">Descripción</label>
                  <input type="text" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="gym-input" placeholder="Breve descripción del plan" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>{editingPlan ? 'GUARDAR CAMBIOS' : 'CREAR PLAN'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Tokens */}
        {showTokenModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="ad-modal-box-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">OTORGAR TOKENS</h3>
                <button onClick={() => setShowTokenModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleGrantTokens} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="gym-label">Usuario</label>
                  <select value={tokenForm.userId} onChange={e => setTokenForm({ ...tokenForm, userId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    <option value="">Selecciona un usuario</option>
                    {subscriptions.filter(s => s.tokens !== null).map(s => <option key={s.userId} value={s.userId}>{s.user.name} — {s.tokens} tokens actuales</option>)}
                  </select>
                </div>
                <div>
                  <label className="gym-label">Tokens a otorgar</label>
                  <input type="number" value={tokenForm.tokens} onChange={e => setTokenForm({ ...tokenForm, tokens: e.target.value })} required min="1" className="gym-input" placeholder="1" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>OTORGAR TOKENS</button>
              </form>
            </div>
          </div>
        )}

        {/* Pago manual */}
        {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="ad-modal-box-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">REGISTRAR PAGO</h3>
                <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleManualPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="gym-label">Usuario</label>
                  <select value={paymentForm.userId} onChange={e => setPaymentForm({ ...paymentForm, userId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    <option value="">Selecciona un usuario</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gym-label">Monto ($)</label>
                  <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required min="0" step="0.01" className="gym-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="gym-label">Nota (opcional)</label>
                  <input type="text" value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} className="gym-input" placeholder="Ej. Pago en efectivo" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>REGISTRAR PAGO</button>
              </form>
            </div>
          </div>
        )}

        {/* Horario */}
        {showScheduleModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div className="ad-modal-box-md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 className="display-sm">ASIGNAR TURNO</h3>
                <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault()
                try {
                  await api.post('/schedules', scheduleForm)
                  toast.success('Turno asignado')
                  setShowScheduleModal(false)
                  setScheduleForm({ coachId: '', dayOfWeek: '1', startTime: '', endTime: '', color: '#FFE000' })
                  fetchAll()
                } catch (err) { toast.error(err.response?.data?.message || 'Error') }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="gym-label">Coach</label>
                  <select value={scheduleForm.coachId} onChange={e => setScheduleForm({ ...scheduleForm, coachId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    <option value="">Selecciona un coach</option>
                    {users.filter(u => u.role === 'COACH').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gym-label">Día de la semana</label>
                  <select value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="ad-schedule-time-grid">
                  <div>
                    <label className="gym-label">Hora inicio</label>
                    <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required className="gym-input" />
                  </div>
                  <div>
                    <label className="gym-label">Hora fin</label>
                    <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required className="gym-input" />
                  </div>
                </div>
                <div>
                  <label className="gym-label">Color del coach</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="color" value={scheduleForm.color} onChange={e => setScheduleForm({ ...scheduleForm, color: e.target.value })} style={{ width: '48px', height: '40px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', padding: '2px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Color único para identificar al coach en el horario</span>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>ASIGNAR TURNO</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default AdminDashboard