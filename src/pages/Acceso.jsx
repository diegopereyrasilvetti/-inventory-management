import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

/** Pantalla de acceso. modo="login" (ruta /login) o modo="registro" (ruta /registro). */
export default function Acceso({ modo }) {
  const { user, cargando, iniciarSesion, registrarse } = useAuth();
  const navigate = useNavigate();
  const [verPassword, setVerPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);
  const esRegistro = modo === "registro";

  useTitulo(esRegistro ? "Crear cuenta | Gestión de Stock" : "Iniciar sesión | Gestión de Stock");

  // Si ya hay una sesión iniciada, no tiene sentido ver el login
  if (!cargando && user) return <Navigate to="/dashboard" replace />;

  async function enviar(e) {
    e.preventDefault();
    const formulario = e.currentTarget;
    if (!formulario.checkValidity()) {
      setMensaje({ tipo: "error", texto: "Completá todos los campos con un email válido." });
      return;
    }
    const email = formulario.email.value.trim();
    const password = formulario.password.value;
    const nombre = esRegistro ? formulario.nombre.value.trim() : "";
    if (esRegistro && !nombre) {
      setMensaje({ tipo: "error", texto: "Contanos tu nombre." });
      return;
    }

    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });
    const { data, error } = esRegistro
      ? await registrarse(email, password, nombre)
      : await iniciarSesion(email, password);
    setEnviando(false);

    if (error) {
      setMensaje({ tipo: "error", texto: traducirError(error) });
      return;
    }
    // Con la confirmación por mail apagada, el registro ya devuelve la sesión
    if (data?.session) {
      navigate("/dashboard", { replace: true });
    } else {
      setMensaje({ tipo: "ok", texto: "Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión." });
    }
  }

  return (
    <LayoutAcceso
      titulo={esRegistro ? "Crear cuenta" : "Iniciar sesión"}
      subtitulo={esRegistro ? "Registrate para empezar a gestionar tu stock." : "Ingresá para gestionar tu stock."}
    >
      <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
        {esRegistro && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-(--texto)" htmlFor="nombre">Nombre</label>
            <input className={CLASE_INPUT_ACCESO} type="text" id="nombre" name="nombre" placeholder="Tu nombre" autoComplete="given-name" maxLength={40} required />
          </div>
        )}

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
              placeholder={esRegistro ? "Mínimo 6 caracteres" : "Tu contraseña"}
              autoComplete={esRegistro ? "new-password" : "current-password"}
              minLength={esRegistro ? 6 : undefined}
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

        {!esRegistro && (
          <div className="flex items-center justify-end text-sm">
            <Link className="text-(--acento-hover) hover:underline" to="/recuperar">¿Olvidaste tu contraseña?</Link>
          </div>
        )}

        {mensaje.texto && (
          <p
            className={"text-sm text-center " + (mensaje.tipo === "ok" ? "text-(--viz-verde-texto)" : "text-(--stock-agotado)")}
            role="alert"
          >
            {mensaje.texto}
          </p>
        )}

        <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : esRegistro ? "Crear cuenta" : "Ingresar"}
          {!enviando && <i className="fa-solid fa-arrow-right text-sm"></i>}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-(--texto-suave)">
        {esRegistro ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
        <Link className="font-medium text-(--acento-hover) hover:underline" to={esRegistro ? "/login" : "/registro"}>
          {esRegistro ? "Iniciá sesión" : "Registrate"}
        </Link>
      </p>
    </LayoutAcceso>
  );
}
