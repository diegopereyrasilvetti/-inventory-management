import { useState } from "react";
import { Link } from "react-router-dom";
import { LOGO, Marca } from "../components/Logo.jsx";
import useTitulo from "../hooks/useTitulo.js";

const CLASE_INPUT =
  "w-full px-3.5 py-2.5 text-sm rounded-lg bg-(--fondo) border border-(--borde) text-(--texto) placeholder:text-(--texto-suave)/60 focus:outline-none focus:border-(--acento) focus:ring-2 focus:ring-(--acento)/30";

export default function Login() {
  useTitulo("Iniciar sesión | Gestión de Stock");
  const [verPassword, setVerPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function enviar(e) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setMensaje("Completá un email válido y tu contraseña.");
      return;
    }
    setMensaje("El inicio de sesión todavía no está disponible.");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-(--superficie) border-b border-(--borde)">
        <nav className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Link className="flex items-center gap-2.5" to="/" aria-label="Volver al inicio">
            <img className="block h-9 sm:h-11 w-auto" src={LOGO} alt="Logo de Gestión De Stock" />
            <Marca className="text-2xl sm:text-3xl font-extrabold tracking-[0.02em] text-(--texto)" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-(--borde) text-(--texto) transition hover:bg-(--fondo) hover:text-(--acento-hover)"
            to="/"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i> Volver al inicio
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <section
          id="iniciar-sesion"
          className="w-full max-w-sm bg-(--superficie) border border-(--borde) rounded-xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(59,42,32,0.06)]"
        >
          <h1 className="text-2xl font-bold text-(--texto) text-center">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-(--texto-suave) text-center">Ingresá para gestionar tu stock.</p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--texto)" htmlFor="email">Email</label>
              <input className={CLASE_INPUT} type="email" id="email" name="email" placeholder="tu@email.com" autoComplete="email" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--texto)" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  className={CLASE_INPUT.replace("px-3.5", "pl-3.5 pr-11")}
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

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-(--texto-suave) cursor-pointer">
                <input className="size-4 accent-(--acento-hover)" type="checkbox" name="recordarme" /> Recordarme
              </label>
              <a className="text-(--acento-hover) hover:underline" href="#">¿Olvidaste tu contraseña?</a>
            </div>

            {mensaje && (
              <p className="text-sm text-center text-(--stock-agotado)" role="alert">{mensaje}</p>
            )}

            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-(--acento-hover) text-white font-semibold cursor-pointer transition hover:bg-(--texto) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--acento-hover)"
              type="submit"
            >
              Ingresar <i className="fa-solid fa-arrow-right text-sm"></i>
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-(--texto-suave)">
            ¿No tenés cuenta? <a className="font-medium text-(--acento-hover) hover:underline" href="#">Registrate</a>
          </p>
        </section>
      </main>

      <footer className="bg-(--texto) text-[#e8dcc8]/70">
        <p className="px-4 py-4 text-xs text-center">© 2026 Gestión de Stock. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
