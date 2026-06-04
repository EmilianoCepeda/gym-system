import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const ClientDashboard = () => {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('classes')

  const fetchData = async () => {
    try {
      const [classesRes, reservationsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/reservations/my')
      ])
      setClasses(classesRes.data)
      setMyReservations(reservationsRes.data)
    } catch (err) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleReserve = async (classId) => {
    try {
      await api.post('/reservations', { classId })
      toast.success('¡Reserva realizada!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar')
    }
  }

  const handleCancel = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/cancel`)
      toast.success('Reserva cancelada')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar')
    }
  }

  const isReserved = (classId) => {
    return myReservations.some(r => r.classId === classId && r.status === 'ACTIVE')
  }

  const getReservationId = (classId) => {
    return myReservations.find(r => r.classId === classId && r.status === 'ACTIVE')?.id
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-gray-500">Cargando...</p></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Hola, {user?.name} 👋</h1>
      <p className="text-gray-500 text-sm mb-6">Bienvenido a tu panel de cliente</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('classes')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Clases disponibles
        </button>
        <button
          onClick={() => setTab('reservations')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'reservations' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Mis reservas
        </button>
      </div>

      {tab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.length === 0 && <p className="text-gray-500">No hay clases disponibles.</p>}
          {classes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{c.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${c.occupied >= c.maxCapacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {c.occupied}/{c.maxCapacity} lugares
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{c.description}</p>
              <div className="text-xs text-gray-400 space-y-1 mb-4">
                <p>📅 {new Date(c.date).toLocaleDateString('es-MX')}</p>
                <p>⏰ {new Date(c.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                <p>👤 Coach: {c.coach.name}</p>
              </div>
              {isReserved(c.id) ? (
                <button
                  onClick={() => handleCancel(getReservationId(c.id))}
                  className="w-full bg-red-50 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition"
                >
                  Cancelar reserva
                </button>
              ) : (
                <button
                  onClick={() => handleReserve(c.id)}
                  disabled={c.occupied >= c.maxCapacity}
                  className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {c.occupied >= c.maxCapacity ? 'Clase llena' : 'Reservar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'reservations' && (
        <div className="space-y-4">
          {myReservations.length === 0 && <p className="text-gray-500">No tienes reservas aún.</p>}
          {myReservations.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">{r.class.name}</h3>
                <p className="text-xs text-gray-400 mt-1">📅 {new Date(r.class.date).toLocaleDateString('es-MX')}</p>
                <p className="text-xs text-gray-400">👤 Coach: {r.class.coach.name}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {r.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientDashboard