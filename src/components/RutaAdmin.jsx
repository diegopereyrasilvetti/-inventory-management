import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Deja pasar solo a administradores activos; a las demás personas las manda al inicio del panel. */
export default function RutaAdmin() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
