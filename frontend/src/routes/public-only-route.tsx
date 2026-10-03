import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/auth/use-auth'
import { FullScreenLoader } from '@/components/full-screen-loader'

/**
 * El espejo de `ProtectedRoute`: con sesión activa, login y registro no tienen
 * sentido y se rebota a `to` (el perfil por defecto). Cada pantalla pública
 * decide su destino: el login aterriza en la lista de tareas.
 */
export function PublicOnlyRoute({ to = '/profile' }: { to?: string }) {
  const { status } = useAuth()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to={to} replace />

  return <Outlet />
}
