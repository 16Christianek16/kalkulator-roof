import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
