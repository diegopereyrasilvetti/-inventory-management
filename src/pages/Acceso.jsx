import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

const CLASE_ENLACE = "text-(--acento-hover) hover:underline cursor-pointer";
const CLASE_INPUT_CON_OJO = CLASE_INPUT_ACCESO.replace("px-3.5", "pl-3.5 pr-11");

/** Campo de contraseña con botón para mostrarla u ocultarla */
function CampoPassword({ id, etiqueta, placeholder, autoComplete, minLength }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-(--texto)" htmlFor={id}>{etiqueta}</label>
      <div className="relative">
        <input
          className={CLASE_INPUT_CON_OJO}
          type={ver ? "text" : "password"}
          id={id}
          name={id}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-(--texto-suave) cursor-pointer hover:text-(--acento-hover)"
          type="button"
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVer((v) => !v)}
        >
          <i className={ver ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
        </button>
      </div>
    </div>
  );
}

/**
 * Pantalla de acceso, con dos modos en la misma tarjeta:
 *  - "ingresar": inicio de sesión (las cuentas las crea el administrador: no hay registro público)
 *  - "cambiar": cambiar la contraseña sabiendo la actual
 */
export default function Acceso() {
  const { user, cargando, iniciarSesion, cambiarPasswordConActual } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState("ingresar");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);
  const cambiando = modo === "cambiar";

  useTitulo(cambiando ? "Cambiar contraseña | Gestión de Stock" : "Iniciar sesión | Gestión de Stock");

  // Si ya hay una sesión iniciada, no tiene sentido ver el login
  if (!cargando && user) return <Navigate to="/dashboard" replace />;

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setMensaje({ tipo: "", texto: "" });
  }

  async function ingresar(e) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) {
      setMensaje({ tipo: "error", texto: "Completá un email válido y tu contraseña." });
      return;
    }
    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });
    const { error } = await iniciarSesion(f.email.value.trim(), f.password.value);
    setEnviando(false);
    if (error) {
      setMensaje({ tipo: "error", texto: traducirError(error) });
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  async function cambiar(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const email = f.email.value.trim();
    const actual = f.password.value;
    const nueva = f["nueva-password"].value;
    const repetida = f["repetir-password"].value;

    if (!f.checkValidity()) {
      setMensaje({ tipo: "error", texto: "Completá todos los campos con un email válido." });
      return;
    }
    if (nueva.length < 6) {
      setMensaje({ tipo: "error", texto: "La contraseña nueva debe tener al menos 6 caracteres." });
      return;
    }
    if (nueva !== repetida) {
      setMensaje({ tipo: "error", texto: "Las dos contraseñas nuevas no coinciden." });
      return;
    }
    if (nueva === actual) {
      setMensaje({ tipo: "error", texto: "La contraseña nueva tiene que ser distinta de la actual." });
      return;
    }

    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });
    const { error } = await cambiarPasswordConActual(email, actual, nueva);
    setEnviando(false);
    if (error) {
      setMensaje({ tipo: "error", texto: traducirError(error) });
      return;
    }
    // Se vuelve al inicio de sesión para entrar con la contraseña nueva
    setModo("ingresar");
    setMensaje({ tipo: "ok", texto: "Listo, tu contraseña se cambió. Ya podés iniciar sesión con la nueva." });
  }

  const textoMensaje = mensaje.texto && (
    <p
      className={"text-sm text-center " + (mensaje.tipo === "ok" ? "text-(--viz-verde-texto)" : "text-(--stock-agotado)")}
      role="alert"
    >
      {mensaje.texto}
    </p>
  );

  if (cambiando) {
    return (
      <LayoutAcceso titulo="Cambiar contraseña" subtitulo="Escribí tu contraseña actual y elegí una nueva.">
        <form className="mt-6 flex flex-col gap-4" onSubmit={cambiar} noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-(--texto)" htmlFor="email">Email</label>
            <input className={CLASE_INPUT_ACCESO} type="email" id="email" name="email" placeholder="tu@email.com" autoComplete="email" required />
          </div>
          <CampoPassword id="password" etiqueta="Contraseña actual" placeholder="Tu contraseña actual" autoComplete="current-password" />
          <CampoPassword id="nueva-password" etiqueta="Contraseña nueva" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          <CampoPassword id="repetir-password" etiqueta="Repetir contraseña nueva" placeholder="Escribila de nuevo" autoComplete="new-password" />

          {textoMensaje}

          <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-(--texto-suave)">
          <button className={CLASE_ENLACE} type="button" onClick={() => cambiarModo("ingresar")}>Volver a iniciar sesión</button>
        </p>
      </LayoutAcceso>
    );
  }

  return (
    <LayoutAcceso titulo="Iniciar sesión" subtitulo="Ingresá para gestionar tu stock.">
      <form className="mt-6 flex flex-col gap-4" onSubmit={ingresar} noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="email">Email</label>
          <input className={CLASE_INPUT_ACCESO} type="email" id="email" name="email" placeholder="tu@email.com" autoComplete="email" required />
        </div>
        <CampoPassword id="password" etiqueta="Contraseña" placeholder="Tu contraseña" autoComplete="current-password" />

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button className={CLASE_ENLACE} type="button" onClick={() => cambiarModo("cambiar")}>Cambiar mi contraseña</button>
          <Link className={CLASE_ENLACE} to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </div>

        {textoMensaje}

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
