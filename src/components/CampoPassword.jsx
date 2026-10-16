import { useState } from "react";
import { CLASE_INPUT_ACCESO } from "./LayoutAcceso.jsx";
import Icono from "./Icono.jsx";

const CLASE_INPUT_CON_OJO = CLASE_INPUT_ACCESO.replace("px-3.5", "pl-3.5 pr-11");

/** Campo de contraseña con un ojito para mostrarla u ocultarla (el ícono cambia al tocarlo). */
export default function CampoPassword({ id, etiqueta, placeholder, autoComplete }) {
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
          required
        />
        <button
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-(--texto-suave) cursor-pointer hover:text-(--acento-hover)"
          type="button"
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVer((v) => !v)}
        >
          <Icono clase={ver ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
        </button>
      </div>
    </div>
  );
}
