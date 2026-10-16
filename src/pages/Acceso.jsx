import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

/** Pantalla de inicio de sesión. Las cuentas las crea el administrador: no hay registro público. */
export default function Acceso() {
  useTitulo("Iniciar sesión | Gestión de Stock");
  const { user, cargando, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [verPassword, setVerPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Si ya hay una sesión iniciada, no tiene sentido ver el login
  if (!cargando && user) return <Navigate to="/dashboard" replace />;

  async function enviar(e) {
    e.preventDefault();
    const formulario = e.currentTarget;
    if (!formulario.checkValidity()) {
      setMensaje("Completá un email válido y tu contraseña.");
      return;
    }
    setEnviando(true);
    setMensaje("");
    const { error } = await iniciarSesion(formulario.email.value.trim(), formulario.password.value);
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="password">Contraseña</label>
          <div className="relative">
            <input
              className={CLASE_INPUT_ACCESO.replace("px-3.5", "pl-3.5 pr-11")}
              type={verPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
            />
            <button
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-(--texto-suave) cursor-pointer hover:text-(--acento-hover)"
              type="button"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setVerPassword((v) => !v)}
            >
              <i className={verPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link className="text-(--acento-hover) hover:underline" to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </div>

        {mensaje && (
          <p className="text-sm text-center text-(--stock-agotado)" role="alert">{mensaje}</p>
        )}

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
