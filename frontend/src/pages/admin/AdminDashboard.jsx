import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import {
  Users, UserCheck, DollarSign, LayoutDashboard,
  ChevronLeft, ChevronRight, Crown, Star, Zap,
  Plus, Gift, CreditCard, Clock, AlertTriangle,
  BarChart2, Settings, LogOut, X, Check
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

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  // Forms
  const [assignForm, setAssignForm] = useState({ userId: '', planId: '', durationDays: '30' })
  const [planForm, setPlanForm] = useState({ name: '', price: '', type: 'BASIC', tokenLimit: '', description: '' })
  const [tokenForm, setTokenForm] = useState({ userId: '', tokens: '' })
  const [paymentForm, setPaymentForm] = useState({ userId: '', amount: '', note: '' })

  const fetchAll = async () => {
    try {
      const [usersRes, plansRes, subsRes, paymentsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/subscriptions/plans'),
        api.get('/subscriptions'),
        api.get('/subscriptions/payments'),
      ])
      setUsers(usersRes.data)
      setPlans(plansRes.data)
      setSubscriptions(subsRes.data)
      setPayments(paymentsRes.data)
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleLogout = () => { logout(); navigate('/') }

  // Stats
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0)
  const activeClients = users.filter(u => u.role === 'CLIENT').length
  const coaches = users.filter(u => u.role === 'COACH').length
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length

  // Chart data — ingresos por mes
  const chartData = (() => {
    const months = {}
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      months[month] = (months[month] || 0) + p.amount
    })
    return Object.entries(months).map(([month, amount]) => ({ month, amount }))
  })()

  // Days remaining
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

  // Sorted subscriptions by days left
  const sortedSubs = [...subscriptions].sort((a, b) => daysLeft(a.endDate) - daysLeft(b.endDate))

  const navItems = [
    { id: 'dashboard',      label: 'Dashboard',       icon: <LayoutDashboard size={20} /> },
    { id: 'users',          label: 'Usuarios',         icon: <Users size={20} /> },
    { id: 'employees',      label: 'Empleados',        icon: <UserCheck size={20} /> },
    { id: 'subscriptions',  label: 'Suscripciones',    icon: <CreditCard size={20} /> },
    { id: 'plans',          label: 'Planes',           icon: <Crown size={20} /> },
    { id: 'revenue',        label: 'Ingresos',         icon: <DollarSign size={20} /> },
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '72px' }}>
          <div style={{ width: '22px', height: '22px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', flexShrink: 0 }} />
          {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ASTRAEUS</span>}
        </div>

        {/* Nav items */}
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

        {/* Collapse toggle + logout */}
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
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
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

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Top bar amarilla */}
        <div style={{ background: 'var(--yellow)', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: '#0f0f0f', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
              BIENVENIDO, {user?.name?.toUpperCase()}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
              Panel de administración — {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Monterrey' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>ADMIN</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 40px', flex: 1 }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>RESUMEN GENERAL</h2>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Clientes totales', value: activeClients, icon: <Users size={24} />, color: 'var(--yellow)' },
                  { label: 'Coaches',           value: coaches,       icon: <UserCheck size={24} />, color: '#00c864' },
                  { label: 'Suscripciones',     value: activeSubs,    icon: <CreditCard size={24} />, color: '#7c6fff' },
                  { label: 'Ingresos totales',  value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, color: 'var(--yellow)' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '28px', margin: 0, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                <h3 className="display-sm" style={{ marginBottom: '24px', fontSize: '16px' }}>INGRESOS POR MES</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
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

              {/* Subs expiring soon */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                <h3 className="display-sm" style={{ marginBottom: '16px', fontSize: '16px' }}>SUSCRIPCIONES POR VENCER</h3>
                {sortedSubs.slice(0, 5).map(s => {
                  const days = daysLeft(s.endDate)
                  return (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {planIcon(s.plan.type)}
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{s.user.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{s.plan.name}</p>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: daysColor(days), letterSpacing: '1px' }}>
                        {days === 0 ? 'VENCIDA' : `${days} días`}
                      </span>
                    </div>
                  )
                })}
                {sortedSubs.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin suscripciones activas</p>}
              </div>
            </div>
          )}

          {/* ── USUARIOS ── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">USUARIOS</h2>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAssignModal(true)}>
                  <Plus size={16} /> Asignar suscripción
                </button>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
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
            </div>
          )}

          {/* ── EMPLEADOS ── */}
          {activeTab === 'employees' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>EMPLEADOS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').map(u => (
                  <div key={u.id} className="gym-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)' }}>{u.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-yellow' : 'badge-gray'}`}>{u.role}</span>
                      <span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
                {users.filter(u => u.role === 'COACH' || u.role === 'ADMIN').length === 0 && (
                  <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin empleados registrados</p>
                )}
              </div>
            </div>
          )}

          {/* ── SUSCRIPCIONES ── */}
          {activeTab === 'subscriptions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">SUSCRIPCIONES</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-outline" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowTokenModal(true)}>
                    <Gift size={16} /> Otorgar tokens
                  </button>
                  <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAssignModal(true)}>
                    <Plus size={16} /> Asignar plan
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '24px' }}>
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

              {/* Legend */}
              <div style={{ display: 'flex', gap: '24px' }}>
                {[{ color: '#ff4444', label: '≤ 5 días — Crítico' }, { color: '#ff8c00', label: '6-15 días — Próximo' }, { color: '#00c864', label: '> 16 días — Activo' }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PLANES ── */}
          {activeTab === 'plans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">PLANES DE SUSCRIPCIÓN</h2>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: '', type: 'BASIC', tokenLimit: '', description: '' }); setShowPlanModal(true) }}>
                  <Plus size={16} /> Nuevo plan
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">INGRESOS</h2>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowPaymentModal(true)}>
                  <Plus size={16} /> Registrar pago
                </button>
              </div>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
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

              {/* Chart */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                <h3 className="display-sm" style={{ marginBottom: '24px', fontSize: '16px' }}>INGRESOS POR MES</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
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

              {/* Payments table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: ASIGNAR SUSCRIPCIÓN ── */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '480px', maxWidth: '90vw' }}>
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

      {/* ── MODAL: PLAN ── */}
      {showPlanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '480px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 className="display-sm">{editingPlan ? 'EDITAR PLAN' : 'NUEVO PLAN'}</h3>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="gym-label">Nombre del plan</label>
                <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} required className="gym-input" placeholder="Ej. Gold Mensual" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

      {/* ── MODAL: TOKENS ── */}
      {showTokenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '420px', maxWidth: '90vw' }}>
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

      {/* ── MODAL: PAGO MANUAL ── */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '420px', maxWidth: '90vw' }}>
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

    </div>
  )
}

export default AdminDashboard