import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const CoachDashboard = () => {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', date: '', startTime: '', endTime: '', maxCapacity: ''
  })

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes')
      const myClasses = res.data.filter(c => c.coachId === user.id)
      setClasses(myClasses)
    } catch (err) {
      toast.error('Error al cargar clases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/classes', {
        ...form,
        date: new Date(form.date).toISOString(),
        startTime: new Date(`${form.date}T${form.startTime}`).toISOString(),
        endTime: new Date(`${form.date}T${form.endTime}`).toISOString(),
        maxCapacity: parseInt(form.maxCapacity)
      })
      toast.success('Clase creada exitosamente')
      setShowForm(false)
      setForm({ name: '', description: '', date: '', startTime: '', endTime: '', maxCapacity: '' })
      fetchClasses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear clase')
    }
  }

  const handleCancel = async (id) => {
    try {
      await api.delete(`/classes/${id}`)
      toast.success('Clase cancelada')
      fetchClasses()
    } catch (err) {
      toast.error('Error al cancelar clase')
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-gray-500">Cargando...</p></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Coach</h1>
          <p className="text-gray-500 text-sm">Hola, {user?.name} 👋</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Nueva clase'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Nueva clase</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupo máximo</label>
              <input type="number" name="maxCapacity" value={form.maxCapacity} onChange={handleChange} required min={1}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <button type="submit"
                className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition">
                Crear clase
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.length === 0 && <p className="text-gray-500">No tienes clases creadas.</p>}
        {classes.map(c => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                {c.occupied}/{c.maxCapacity} lugares
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{c.description}</p>
            <div className="text-xs text-gray-400 space-y-1 mb-4">
              <p>📅 {new Date(c.date).toLocaleDateString('es-MX')}</p>
              <p>⏰ {new Date(c.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button
              onClick={() => handleCancel(c.id)}
              className="w-full bg-red-50 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition"
            >
              Cancelar clase
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CoachDashboard