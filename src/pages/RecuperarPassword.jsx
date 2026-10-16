import { useState } from "react";
import { Link } from "react-router-dom";
import LayoutAcceso, { CLASE_BOTON_ACCESO, CLASE_INPUT_ACCESO } from "../components/LayoutAcceso.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useTitulo from "../hooks/useTitulo.js";
import { traducirError } from "../lib/errores.js";

/** Paso 1 de recuperar la contraseña: se pide el email y Supabase manda un link para elegir una nueva. */
export default function RecuperarPassword() {
  useTitulo("Recuperar contraseña | Gestión de Stock");
  const { recuperarPassword } = useAuth();
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const formulario = e.currentTarget;
    if (!formulario.checkValidity()) {
      setMensaje({ tipo: "error", texto: "Escribí un email válido." });
      return;
    }
    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });
    const { error } = await recuperarPassword(formulario.email.value.trim());
    setEnviando(false);
    if (error) {
      setMensaje({ tipo: "error", texto: traducirError(error) });
      return;
    }
    // No se aclara si el email existe o no, para no revelar qué cuentas hay registradas
    setMensaje({ tipo: "ok", texto: "Si ese email tiene una cuenta, te mandamos un link para elegir una contraseña nueva. Revisá también el spam." });
  }

  return (
    <LayoutAcceso titulo="Recuperar contraseña" subtitulo="Te mandamos un link por email para elegir una contraseña nueva.">
      <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--texto)" htmlFor="email">Email</label>
          <input className={CLASE_INPUT_ACCESO} type="email" id="email" name="email" placeholder="tu@email.com" autoComplete="email" required />
        </div>

        {mensaje.texto && (
          <p
            className={"text-sm text-center " + (mensaje.tipo === "ok" ? "text-(--viz-verde-texto)" : "text-(--stock-agotado)")}
            role="alert"
          >
            {mensaje.texto}
          </p>
        )}

        <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-(--texto-suave)">
        <Link className="font-medium text-(--acento-hover) hover:underline" to="/login">Volver a iniciar sesión</Link>
      </p>
    </LayoutAcceso>
  );
}
