import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from './auth.hooks';

/**
 * Wraps every page that needs login. Not logged in → /login, remembering where the
 * user wanted to go. Also kicks in when the session expires: any 401 from the API
 * sets the current user to null (see lib/query-client.ts).
 */
export function RequireAuth() {
  const { data: user, isPending, isError, refetch } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return <p className="p-8 text-muted-foreground">Cargando…</p>;
  }

  if (isError) {
    return (
      <div className="p-8 text-destructive">
        <p>No se pudo conectar con el servidor.</p>
        <button className="mt-2 underline" onClick={() => refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
