import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Navbar from './components/ui/Navbar'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ClientDashboard from './pages/client/ClientDashboard'
import CoachDashboard from './pages/coach/CoachDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/client" element={
            <ProtectedRoute roles={['CLIENT']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          <Route path="/coach" element={
            <ProtectedRoute roles={['COACH']}>
              <CoachDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <p className="text-4xl mb-2">🚫</p>
                <h2 className="text-xl font-bold text-gray-800">Sin acceso</h2>
                <p className="text-gray-500 text-sm mt-2">No tienes permiso para ver esta página.</p>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App