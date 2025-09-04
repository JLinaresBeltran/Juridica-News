import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { checkAuthStatus } from '@/services/authService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        setLoading(true)
        try {
          await checkAuthStatus()
        } catch (error) {
          // Auth check failed, user will be redirected to login
        } finally {
          setLoading(false)
        }
      }
    }

    verifyAuth()
  }, [isAuthenticated, setLoading])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  return <>{children}</>
}