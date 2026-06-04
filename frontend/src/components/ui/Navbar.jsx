import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getDashboardLink = () => {
    if (user?.role === 'ADMIN') return '/admin'
    if (user?.role === 'COACH') return '/coach'
    return '/client'
  }

  return (
    <nav className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">
        💪 Gym System
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to={getDashboardLink()} className="text-sm hover:underline">
              Dashboard
            </Link>
            <span className="text-sm text-indigo-200">
              {user.name} · {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-indigo-50 transition"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm hover:underline">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="bg-white text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-indigo-50 transition"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar