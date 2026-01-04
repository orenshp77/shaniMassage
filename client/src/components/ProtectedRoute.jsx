import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  // Check if user is logged in with password (has 'user' in localStorage)
  const user = localStorage.getItem('user')

  if (!user) {
    // Not logged in with password, redirect to login
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
