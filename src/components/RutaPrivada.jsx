import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Protege las rutas hijas: si no hay sesión iniciada, manda al login. */
export default function RutaPrivada() {
  const { user, cargando } = useAuth();

  // Mientras Supabase revisa si ya había una sesión guardada, no se decide todavía
  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-(--texto-suave)" role="status">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
