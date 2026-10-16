import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import CampoPassword from "../components/CampoPassword.jsx";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

/** Pantalla de inicio de sesión. Las cuentas las crea el administrador: no hay registro público. */
export default function Acceso() {
  useTitulo("Iniciar sesión | Gestión de Stock");
  const { user, cargando, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Si ya hay una sesión iniciada, no tiene sentido ver el login
  if (!cargando && user) return <Navigate to="/dashboard" replace />;

  async function enviar(e) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) {
      setMensaje("Completá un email válido y tu contraseña.");
      return;
    }
    setEnviando(true);
    setMensaje("");
    const { error } = await iniciarSesion(f.email.value.trim(), f.password.value);
    setEnviando(false);
    if (error) {
      setMensaje(traducirError(error));
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <LayoutAcceso titulo="Iniciar sesión" subtitulo="Ingresá para gestionar tu stock.">
      <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="email">Email</label>
          <input className={CLASE_INPUT_ACCESO} type="email" id="email" name="email" placeholder="tu@email.com" autoComplete="email" required />
        </div>
        <CampoPassword id="password" etiqueta="Contraseña" placeholder="Tu contraseña" autoComplete="current-password" />

        <div className="flex items-center justify-end text-sm">
          <Link className="text-(--acento-hover) hover:underline" to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </div>

        {mensaje && <p className="text-sm text-center text-(--stock-agotado)" role="alert">{mensaje}</p>}

        <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : "Ingresar"}
          {!enviando && <i className="fa-solid fa-arrow-right text-sm"></i>}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-(--texto-suave)">
        ¿No tenés cuenta? Pedísela al administrador.
      </p>
    </LayoutAcceso>
  );
}
