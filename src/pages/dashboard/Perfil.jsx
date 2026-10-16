import { useState } from "react";
import CampoPassword from "../../components/CampoPassword.jsx";
import { CLASE_BOTON_ACCESO } from "../../components/LayoutAcceso.jsx";
import SeccionDashboard from "../../components/SeccionDashboard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import useTitulo from "../../hooks/useTitulo.js";
import { traducirError } from "../../lib/errores.js";
import { nombreDe } from "../../lib/usuario.js";

function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-lg border border-(--borde) bg-(--fondo) px-3.5 py-2.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-(--texto-suave)">{etiqueta}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-(--texto)">{valor}</dd>
    </div>
  );
}

/** Mi perfil: datos de la cuenta y cambio de contraseña (para quien ya inició sesión). */
export default function Perfil() {
  useTitulo("Mi perfil | Gestión de Stock");
  const { user, perfil, cambiarPasswordConActual } = useAuth();
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);

  const nombre = perfil?.nombre || nombreDe(user);
  const rol = perfil?.rol === "admin" ? "Administrador" : "Usuario";

  async function cambiar(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const actual = f.password.value;
    const nueva = f["nueva-password"].value;
    const repetida = f["repetir-password"].value;

    if (!f.checkValidity()) {
      setMensaje({ tipo: "error", texto: "Completá los tres campos." });
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
    // Se verifica la contraseña actual (sin tocar tu sesión) y después se cambia
    const { error } = await cambiarPasswordConActual(user.email, actual, nueva);
    setEnviando(false);
    if (error) {
      const incorrecta = (error.message || "").toLowerCase().includes("invalid login credentials");
      setMensaje({ tipo: "error", texto: incorrecta ? "La contraseña actual no es correcta." : traducirError(error) });
      return;
    }
    f.reset();
    setMensaje({ tipo: "ok", texto: "Listo, tu contraseña se cambió. La próxima vez entrá con la nueva." });
  }

  return (
    <SeccionDashboard aria-labelledby="titulo-perfil" className="max-w-2xl">
      <div className="px-5 pt-5 sm:px-6">
        <h1 id="titulo-perfil" className="text-xl font-bold text-(--texto)">Mi perfil</h1>
        <p className="mt-0.5 text-sm text-(--texto-suave)">Los datos de tu cuenta y tu contraseña.</p>
      </div>

      <dl className="mt-4 grid gap-3 px-5 sm:grid-cols-3 sm:px-6">
        <Dato etiqueta="Nombre" valor={nombre} />
        <Dato etiqueta="Email" valor={user?.email} />
        <Dato etiqueta="Rol" valor={rol} />
      </dl>

      <form className="mt-6 flex flex-col gap-4 border-t border-(--borde) px-5 py-5 sm:px-6" onSubmit={cambiar} noValidate>
        <div>
          <h2 className="text-base font-bold text-(--texto)">Cambiar contraseña</h2>
          <p className="mt-0.5 text-sm text-(--texto-suave)">Escribí la actual y elegí una nueva.</p>
        </div>

        <CampoPassword id="password" etiqueta="Contraseña actual" placeholder="Tu contraseña actual" autoComplete="current-password" />
        <CampoPassword id="nueva-password" etiqueta="Contraseña nueva" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
        <CampoPassword id="repetir-password" etiqueta="Repetir contraseña nueva" placeholder="Escribila de nuevo" autoComplete="new-password" />

        {mensaje.texto && (
          <p
            className={"text-sm " + (mensaje.tipo === "ok" ? "text-(--viz-verde-texto)" : "text-(--stock-agotado)")}
            role="alert"
          >
            {mensaje.texto}
          </p>
        )}

        <div>
          <button className={CLASE_BOTON_ACCESO} type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </SeccionDashboard>
  );
}
