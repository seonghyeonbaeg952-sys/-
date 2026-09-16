import { AdminLayout } from './AdminLayout'
import { ProtectedAdminRoute } from './ProtectedAdminRoute'

/** Loaded only for CMS routes; the original admin authorization remains mandatory. */
export function AdminRouteBoundary() {
  return <ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>
}
