import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LayoutAcceso, { CLASE_BOTON_ACCESO } from "./LayoutAcceso.jsx";

const CLASE_BOTON_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-(--borde) text-(--texto) font-medium cursor-pointer transition hover:bg-(--fondo)";

/**
 * Protege las rutas hijas del panel. Deja pasar solo a quien:
 *   1) inició sesión, y
 *   2) tiene un perfil activo (lo crea el administrador al dar de alta la cuenta).
 */
export default function RutaPrivada() {
  const { user, cargando, perfil, errorPerfil, reintentarPerfil, cerrarSesion } = useAuth();

  // Mientras se revisa la sesión y el perfil, no se decide todavía
  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-(--texto-suave)" role="status">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // No se pudo consultar el perfil (sin conexión, por ejemplo): no se confunde con "sin permiso"
  if (errorPerfil) {
    return (
      <LayoutAcceso titulo="No pudimos verificar tu acceso" subtitulo="Revisá tu conexión y probá de nuevo.">
        <div className="mt-6 flex flex-col gap-3">
          <button className={CLASE_BOTON_ACCESO} type="button" onClick={reintentarPerfil}>Reintentar</button>
          <button className={CLASE_BOTON_SECUNDARIO} type="button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </LayoutAcceso>
    );
  }

  // Cuenta sin perfil o desactivada
  if (!perfil || !perfil.activo) {
    return (
      <LayoutAcceso
        titulo="Tu cuenta no tiene acceso"
        subtitulo={
          perfil
            ? "Tu cuenta está desactivada. Pedile al administrador que la vuelva a activar."
            : "Todavía no tenés permisos para entrar. Pedile al administrador que te habilite."
        }
      >
        <div className="mt-6 flex flex-col gap-3">
          <button className={CLASE_BOTON_SECUNDARIO} type="button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </LayoutAcceso>
    );
  }

  return <Outlet />;
}
