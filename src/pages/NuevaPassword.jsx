import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

/** Paso 2 de recuperar la contraseña: se llega desde el link del email, que ya trae una sesión temporal. */
export default function NuevaPassword() {
  useTitulo("Nueva contraseña | Gestión de Stock");
  const { user, cargando, actualizarPassword } = useAuth();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const password = formulario.password.value;
    if (password.length < 6) {
      setMensaje({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (password !== formulario.repetir.value) {
      setMensaje({ tipo: "error", texto: "Las contraseñas no coinciden." });
      return;
    }
    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });
    const { error } = await actualizarPassword(password);
    setEnviando(false);
    if (error) {
      setMensaje({ tipo: "error", texto: traducirError(error) });
      return;
    }
    setMensaje({ tipo: "ok", texto: "Listo, tu contraseña se cambió. Te llevamos al panel…" });
    setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
  }

  // Sin sesión temporal el link venció o ya se usó
  if (!cargando && !user) {
    return (
      <LayoutAcceso titulo="Link no válido" subtitulo="El link para cambiar la contraseña venció o ya se usó.">
        <p className="mt-6 text-sm text-center">
          <Link className="font-medium text-(--acento-hover) hover:underline" to="/recuperar">Pedir un link nuevo</Link>
        </p>
      </LayoutAcceso>
    );
  }

  return (
    <LayoutAcceso titulo="Nueva contraseña" subtitulo="Elegí la contraseña que vas a usar de ahora en adelante.">
      <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="password">Contraseña nueva</label>
          <input className={CLASE_INPUT_ACCESO} type="password" id="password" name="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="repetir">Repetir contraseña</label>
          <input className={CLASE_INPUT_ACCESO} type="password" id="repetir" name="repetir" placeholder="Escribila de nuevo" autoComplete="new-password" required />
        </div>

        {mensaje.texto && (
          <p
            className={"text-sm text-center " + (mensaje.tipo === "ok" ? "text-(--viz-verde-texto)" : "text-(--stock-agotado)")}
            role="alert"
          >
            {mensaje.texto}
          </p>
        )}

        <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando || cargando}>
          {enviando ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </LayoutAcceso>
  );
}
