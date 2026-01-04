import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  // Check if user has access (either logged in with password OR has workspace code)
  const user = localStorage.getItem('user')
  const workspaceCode = localStorage.getItem('workspaceCode')

  if (!user && !workspaceCode) {
    // Not logged in and no workspace code, redirect to home
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
