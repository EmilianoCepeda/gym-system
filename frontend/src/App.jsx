import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Navbar from './components/ui/Navbar'

import LandingPage from './pages/LandingPage'
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
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/client" element={
            <ProtectedRoute roles={['CLIENT']}>
              <Navbar />
              <ClientDashboard />
            </ProtectedRoute>
          } />

          <Route path="/coach" element={
            <ProtectedRoute roles={['COACH']}>
              <Navbar />
              <CoachDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Navbar />
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</p>
                <h2 className="display-md" style={{ marginBottom: '12px' }}>Sin acceso</h2>
                <p className="body-text">No tienes permiso para ver esta página.</p>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App