import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/login'), 3000)
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <p className="text-2xl mb-2">⏳</p>
            <h2 className="text-xl font-bold text-gray-800">Verificando tu cuenta...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-4xl mb-2">✅</p>
            <h2 className="text-xl font-bold text-gray-800">¡Cuenta verificada!</h2>
            <p className="text-gray-500 text-sm mt-2">Redirigiendo al login en 3 segundos...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-4xl mb-2">❌</p>
            <h2 className="text-xl font-bold text-gray-800">Token inválido</h2>
            <p className="text-gray-500 text-sm mt-2">El enlace no es válido o ya fue usado.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail