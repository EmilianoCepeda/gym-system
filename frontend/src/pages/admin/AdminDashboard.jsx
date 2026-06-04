import { useEffect, useState } from 'react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  const fetchData = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/classes')
      ])
      setUsers(usersRes.data)
      setClasses(classesRes.data)
    } catch (err) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleVerified = async (id, verified) => {
    try {
      await api.put(`/admin/users/${id}`, { verified: !verified })
      toast.success('Usuario actualizado')
      fetchData()
    } catch (err) {
      toast.error('Error al actualizar usuario')
    }
  }

  const handleChangeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}`, { role })
      toast.success('Rol actualizado')
      fetchData()
    } catch (err) {
      toast.error('Error al cambiar rol')
    }
  }

  const handleCancelClass = async (id) => {
    try {
      await api.delete(`/classes/${id}`)
      toast.success('Clase cancelada')
      fetchData()
    } catch (err) {
      toast.error('Error al cancelar clase')
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-gray-500">Cargando...</p></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel Administrador</h1>
      <p className="text-gray-500 text-sm mb-6">Gestión completa del sistema</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{users.length}</p>
          <p className="text-sm text-gray-500 mt-1">Usuarios</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{classes.length}</p>
          <p className="text-sm text-gray-500 mt-1">Clases activas</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{users.filter(u => u.role === 'COACH').length}</p>
          <p className="text-sm text-gray-500 mt-1">Coaches</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab('classes')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Clases
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Verificado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="COACH">COACH</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.verified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {u.verified ? 'Verificado' : 'No verificado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVerified(u.id, u.verified)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {u.verified ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.length === 0 && <p className="text-gray-500">No hay clases activas.</p>}
          {classes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{c.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  {c.occupied}/{c.maxCapacity}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{c.description}</p>
              <div className="text-xs text-gray-400 space-y-1 mb-4">
                <p>📅 {new Date(c.date).toLocaleDateString('es-MX')}</p>
                <p>👤 Coach: {c.coach.name}</p>
              </div>
              <button
                onClick={() => handleCancelClass(c.id)}
                className="w-full bg-red-50 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition"
              >
                Cancelar clase
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard