import { cerrarAviso, useAvisoError } from "../store/avisos.js";

/** Cartel fijo que muestra el último error de guardado en la base de datos. */
export default function AvisoErrores() {
  const mensaje = useAvisoError();
  if (!mensaje) return null;
  return (
    <div
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-(--stock-agotado)/40 bg-(--superficie) p-4 text-sm text-(--texto) shadow-[0_8px_24px_rgba(59,42,32,0.18)]"
      role="alert"
    >
      <i className="fa-solid fa-triangle-exclamation mt-0.5 text-(--stock-agotado)" aria-hidden="true"></i>
      <p className="min-w-0 flex-1 break-words">{mensaje}</p>
      <button className="cursor-pointer text-(--texto-suave) hover:text-(--texto)" type="button" aria-label="Cerrar aviso" onClick={cerrarAviso}>
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
}
