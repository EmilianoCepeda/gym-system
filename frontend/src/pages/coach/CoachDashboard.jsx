import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, CalendarDays, Dumbbell, Users,
  ClipboardList, BarChart2, LogOut, ChevronLeft,
  ChevronRight, Plus, X, Clock, CheckCircle,
  XCircle, User, TrendingUp
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const CoachDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [classes, setClasses] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [clients, setClients] = useState([])
  const [routines, setRoutines] = useState([])
  const [schedule, setSchedule] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Attendance
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Modals
  const [showClassModal, setShowClassModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)

  // Forms
  const [classForm, setClassForm] = useState({
    name: '', description: '', date: '', startTime: '', endTime: '', maxCapacity: ''
  })
  const [routineForm, setRoutineForm] = useState({
    clientId: '', title: '', description: '', exercises: ''
  })

  const fetchAll = async () => {
    try {
      const [classesRes, clientsRes, routinesRes, scheduleRes, statsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/admin/clients'),
        api.get('/routines/coach'),
        api.get('/schedules'),
        api.get('/attendance/stats'),
      ])
      const allClasses = classesRes.data
      setClasses(allClasses)
      setMyClasses(allClasses.filter(c => c.coachId === user.id))
      setClients(clientsRes.data.filter(u => u.role === 'CLIENT'))
      setRoutines(routinesRes.data)
      setSchedule(scheduleRes.data.filter(s => s.coachId === user.id))
      setStats(statsRes.data)
    } catch (err) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const handleSaveClass = async (e) => {
    e.preventDefault()
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, {
          ...classForm,
          date: new Date(classForm.date).toISOString(),
          startTime: new Date(`${classForm.date}T${classForm.startTime}`).toISOString(),
          endTime: new Date(`${classForm.date}T${classForm.endTime}`).toISOString(),
          maxCapacity: parseInt(classForm.maxCapacity)
        })
        toast.success('Clase actualizada')
      } else {
        await api.post('/classes', {
          ...classForm,
          date: new Date(classForm.date).toISOString(),
          startTime: new Date(`${classForm.date}T${classForm.startTime}`).toISOString(),
          endTime: new Date(`${classForm.date}T${classForm.endTime}`).toISOString(),
          maxCapacity: parseInt(classForm.maxCapacity)
        })
        toast.success('Clase creada')
      }
      setShowClassModal(false)
      setEditingClass(null)
      setClassForm({ name: '', description: '', date: '', startTime: '', endTime: '', maxCapacity: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar clase')
    }
  }

  const handleCancelClass = async (id) => {
    try {
      await api.delete(`/classes/${id}`)
      toast.success('Clase cancelada')
      fetchAll()
    } catch { toast.error('Error al cancelar clase') }
  }

  const handleSaveRoutine = async (e) => {
    e.preventDefault()
    try {
      await api.post('/routines', routineForm)
      toast.success('Rutina asignada')
      setShowRoutineModal(false)
      setRoutineForm({ clientId: '', title: '', description: '', exercises: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al asignar rutina')
    }
  }

  const handleDeleteRoutine = async (id) => {
    try {
      await api.delete(`/routines/${id}`)
      toast.success('Rutina eliminada')
      fetchAll()
    } catch { toast.error('Error al eliminar rutina') }
  }

  const handleSelectClass = async (gymClass) => {
    setSelectedClass(gymClass)
    setLoadingAttendance(true)
    try {
      const res = await api.get(`/attendance/class/${gymClass.id}`)
      setAttendance(res.data)
    } catch { toast.error('Error al cargar asistencia') }
    finally { setLoadingAttendance(false) }
  }

  const handleMarkAttendance = async (userId, attended) => {
    try {
      await api.post('/attendance/mark', {
        classId: selectedClass.id,
        userId,
        attended
      })
      setAttendance(prev => prev.map(a =>
        a.userId === userId ? { ...a, attended } : a
      ))
      toast.success(attended ? 'Asistencia marcada' : 'Asistencia desmarcada')
    } catch { toast.error('Error al marcar asistencia') }
  }

  // Chart data
  const chartData = myClasses.map(c => ({
    name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
    Inscritos: c.occupied,
    Capacidad: c.maxCapacity
  }))

  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',      icon: <LayoutDashboard size={20} /> },
    { id: 'classes',     label: 'Mis Clases',      icon: <CalendarDays size={20} /> },
    { id: 'attendance',  label: 'Asistencia',      icon: <ClipboardList size={20} /> },
    { id: 'routines',    label: 'Rutinas',          icon: <Dumbbell size={20} /> },
    { id: 'students',    label: 'Alumnos',          icon: <Users size={20} /> },
    { id: 'schedule',    label: 'Mi Horario',       icon: <Clock size={20} /> },
    { id: 'stats',       label: 'Estadísticas',     icon: <BarChart2 size={20} /> },
  ]

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

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--yellow)', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: '#0f0f0f', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
              BIENVENIDO, COACH {user?.name?.toUpperCase()}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Monterrey' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>COACH</span>
          </div>
        </div>

        <div style={{ padding: '32px 40px', flex: 1 }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>RESUMEN</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Clases activas',    value: stats?.activeClasses || 0,      icon: <CalendarDays size={24} /> },
                  { label: 'Total alumnos',      value: stats?.totalStudents || 0,      icon: <Users size={24} /> },
                  { label: 'Clases este mes',    value: stats?.classesThisMonth || 0,   icon: <Clock size={24} /> },
                  { label: 'Asistencia promedio',value: `${stats?.avgAttendance || 0}%`, icon: <TrendingUp size={24} /> },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--yellow)' }}>{s.icon}</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '28px', margin: 0, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clase más popular */}
              {stats?.mostPopularClass && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: 'var(--yellow)' }}><BarChart2 size={32} /></span>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px' }}>Clase más popular</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{stats.mostPopularClass.name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--yellow)', margin: '4px 0 0' }}>{stats.mostPopularClass.students} alumnos inscritos</p>
                  </div>
                </div>
              )}

              {/* Chart */}
              {chartData.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                  <h3 className="display-sm" style={{ fontSize: '16px', marginBottom: '24px' }}>INSCRITOS POR CLASE</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'var(--font-body)' }} cursor={{ fill: 'rgba(255,220,0,0.05)' }} />
                      <Bar dataKey="Inscritos" fill="var(--yellow)" radius={0} />
                      <Bar dataKey="Capacidad" fill="rgba(255,220,0,0.2)" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── MIS CLASES ── */}
          {activeTab === 'classes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">MIS CLASES</h2>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => { setEditingClass(null); setClassForm({ name: '', description: '', date: '', startTime: '', endTime: '', maxCapacity: '' }); setShowClassModal(true) }}>
                  <Plus size={16} /> Nueva clase
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {myClasses.map(c => (
                  <div key={c.id} className="gym-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{c.name}</h3>
                      <span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{c.status}</span>
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
                        <Users size={14} color="var(--yellow)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.occupied}/{c.maxCapacity} inscritos</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingClass(c); setClassForm({ name: c.name, description: c.description, date: new Date(c.date).toISOString().split('T')[0], startTime: new Date(c.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Monterrey' }), endTime: new Date(c.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Monterrey' }), maxCapacity: c.maxCapacity }); setShowClassModal(true) }}
                        style={{ flex: 1, background: 'var(--yellow-dim)', border: '1px solid rgba(255,220,0,0.3)', color: 'var(--yellow)', padding: '8px', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleCancelClass(c.id)} className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Cancelar</button>
                    </div>
                  </div>
                ))}
                {myClasses.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>No tienes clases creadas aún.</p>}
              </div>
            </div>
          )}

          {/* ── ASISTENCIA ── */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedClass ? '1fr 1fr' : '1fr', gap: '24px' }}>
              <div>
                <h2 className="display-sm" style={{ marginBottom: '24px' }}>ASISTENCIA</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myClasses.map(c => (
                    <div key={c.id} onClick={() => handleSelectClass(c)} style={{
                      background: selectedClass?.id === c.id ? 'var(--yellow-dim)' : 'var(--bg-card)',
                      border: `1px solid ${selectedClass?.id === c.id ? 'var(--yellow)' : 'var(--border)'}`,
                      padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase', color: selectedClass?.id === c.id ? 'var(--yellow)' : 'var(--text-primary)' }}>{c.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{new Date(c.date).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })} · {c.occupied} inscritos</p>
                      </div>
                      <span className="badge badge-yellow">{c.occupied}</span>
                    </div>
                  ))}
                  {myClasses.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin clases para registrar asistencia</p>}
                </div>
              </div>

              {selectedClass && (
                <div>
                  <h3 className="display-sm" style={{ fontSize: '18px', marginBottom: '8px', textTransform: 'uppercase' }}>{selectedClass.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>{new Date(selectedClass.date).toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })}</p>
                  {loadingAttendance ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando...</p>
                  ) : attendance.length === 0 ? (
                    <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin alumnos inscritos en esta clase</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attendance.map(a => (
                        <div key={a.userId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--yellow)' }}>{a.user.name[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{a.user.name}</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{a.user.email}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleMarkAttendance(a.userId, true)} style={{ background: a.attended ? '#00c864' : 'transparent', border: `1px solid ${a.attended ? '#00c864' : 'rgba(0,200,100,0.3)'}`, color: a.attended ? '#0f0f0f' : '#00c864', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                              <CheckCircle size={14} /> SÍ
                            </button>
                            <button onClick={() => handleMarkAttendance(a.userId, false)} style={{ background: !a.attended ? '#ff4444' : 'transparent', border: `1px solid ${!a.attended ? '#ff4444' : 'rgba(255,68,68,0.3)'}`, color: !a.attended ? '#fff' : '#ff4444', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                              <XCircle size={14} /> NO
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── RUTINAS ── */}
          {activeTab === 'routines' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="display-sm">RUTINAS</h2>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowRoutineModal(true)}>
                  <Plus size={16} /> Asignar rutina
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {routines.map(r => (
                  <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{r.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <User size={14} color="var(--yellow)" />
                          <span style={{ fontSize: '13px', color: 'var(--yellow)' }}>{r.client.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>— {r.client.email}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteRoutine(r.id)} className="btn-danger" style={{ padding: '6px 16px', fontSize: '12px' }}>Eliminar</button>
                    </div>
                    {r.description && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>{r.description}</p>}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '16px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--yellow)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Ejercicios</p>
                      <pre style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{r.exercises}</pre>
                    </div>
                  </div>
                ))}
                {routines.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Dumbbell size={64} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Sin rutinas asignadas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ALUMNOS ── */}
          {activeTab === 'students' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>MIS ALUMNOS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {clients.filter(client =>
                  myClasses.some(c => c.occupied > 0)
                ).map(client => (
                  <div key={client.id} className="gym-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--yellow-dim)', border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)' }}>{client.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{client.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{client.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className={`badge ${client.verified ? 'badge-green' : 'badge-red'}`}>{client.verified ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
                {clients.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Sin alumnos registrados</p>}
              </div>
            </div>
          )}

          {/* ── HORARIO ── */}
          {activeTab === 'schedule' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>MI HORARIO</h2>
              {schedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <Clock size={64} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sin turnos asignados</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>El administrador asignará tus turnos de trabajo</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {DAYS.map((day, i) => {
                    const daySchedules = schedule.filter(s => s.dayOfWeek === i)
                    return (
                      <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', minHeight: '160px' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px', textAlign: 'center' }}>{day.substring(0, 3)}</p>
                        {daySchedules.map(s => (
                          <div key={s.id} style={{ background: s.color, padding: '8px', marginBottom: '8px', borderRadius: '2px' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '11px', color: '#0f0f0f', margin: 0, letterSpacing: '1px' }}>{s.startTime} — {s.endTime}</p>
                          </div>
                        ))}
                        {daySchedules.length === 0 && (
                          <p style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'center', marginTop: '16px' }}>—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {activeTab === 'stats' && (
            <div>
              <h2 className="display-sm" style={{ marginBottom: '24px' }}>ESTADÍSTICAS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Total clases',        value: stats?.totalClasses || 0 },
                  { label: 'Clases este mes',      value: stats?.classesThisMonth || 0 },
                  { label: 'Total alumnos',        value: stats?.totalStudents || 0 },
                  { label: 'Asistencia promedio',  value: `${stats?.avgAttendance || 0}%` },
                  { label: 'Clase más popular',    value: stats?.mostPopularClass?.name || '—' },
                  { label: 'Alumnos en top clase', value: stats?.mostPopularClass?.students || 0 },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '32px', color: 'var(--yellow)', margin: 0, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {chartData.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px' }}>
                  <h3 className="display-sm" style={{ fontSize: '16px', marginBottom: '24px' }}>INSCRITOS VS CAPACIDAD</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'var(--font-body)' }} cursor={{ fill: 'rgba(255,220,0,0.05)' }} />
                      <Bar dataKey="Inscritos" fill="var(--yellow)" radius={0} />
                      <Bar dataKey="Capacidad" fill="rgba(255,220,0,0.15)" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL: CLASE ── */}
      {showClassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '500px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 className="display-sm">{editingClass ? 'EDITAR CLASE' : 'NUEVA CLASE'}</h3>
              <button onClick={() => setShowClassModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="gym-label">Nombre</label>
                <input type="text" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required className="gym-input" placeholder="Ej. Yoga Matutino" />
              </div>
              <div>
                <label className="gym-label">Descripción</label>
                <input type="text" value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} required className="gym-input" placeholder="Breve descripción de la clase" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="gym-label">Fecha</label>
                  <input type="date" value={classForm.date} onChange={e => setClassForm({ ...classForm, date: e.target.value })} required className="gym-input" />
                </div>
                <div>
                  <label className="gym-label">Cupo máximo</label>
                  <input type="number" value={classForm.maxCapacity} onChange={e => setClassForm({ ...classForm, maxCapacity: e.target.value })} required min="1" className="gym-input" placeholder="10" />
                </div>
                <div>
                  <label className="gym-label">Hora inicio</label>
                  <input type="time" value={classForm.startTime} onChange={e => setClassForm({ ...classForm, startTime: e.target.value })} required className="gym-input" />
                </div>
                <div>
                  <label className="gym-label">Hora fin</label>
                  <input type="time" value={classForm.endTime} onChange={e => setClassForm({ ...classForm, endTime: e.target.value })} required className="gym-input" />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>{editingClass ? 'GUARDAR CAMBIOS' : 'CREAR CLASE'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RUTINA ── */}
      {showRoutineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '40px', width: '520px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 className="display-sm">ASIGNAR RUTINA</h3>
              <button onClick={() => setShowRoutineModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="gym-label">Cliente</label>
                <select value={routineForm.clientId} onChange={e => setRoutineForm({ ...routineForm, clientId: e.target.value })} required className="gym-input" style={{ cursor: 'pointer' }}>
                  <option value="">Selecciona un cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                </select>
              </div>
              <div>
                <label className="gym-label">Título de la rutina</label>
                <input type="text" value={routineForm.title} onChange={e => setRoutineForm({ ...routineForm, title: e.target.value })} required className="gym-input" placeholder="Ej. Rutina de fuerza — Semana 1" />
              </div>
              <div>
                <label className="gym-label">Descripción (opcional)</label>
                <input type="text" value={routineForm.description} onChange={e => setRoutineForm({ ...routineForm, description: e.target.value })} className="gym-input" placeholder="Instrucciones generales" />
              </div>
              <div>
                <label className="gym-label">Ejercicios</label>
                <textarea value={routineForm.exercises} onChange={e => setRoutineForm({ ...routineForm, exercises: e.target.value })} required rows={6} className="gym-input" placeholder="Ej.&#10;1. Sentadilla — 4x12&#10;2. Press de banca — 4x10&#10;3. Peso muerto — 3x8" style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>ASIGNAR RUTINA</button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default CoachDashboard