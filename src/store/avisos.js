import { useSyncExternalStore } from "react";

/* Aviso global de errores ("No se pudo guardar..."): lo muestra <AvisoErrores /> */

let mensaje = "";
let temporizador;
const oyentes = new Set();

function emitir() {
  oyentes.forEach((cb) => cb());
}

export function avisarError(texto) {
  mensaje = texto;
  emitir();
  clearTimeout(temporizador);
  temporizador = setTimeout(cerrarAviso, 7000);
}

export function cerrarAviso() {
  mensaje = "";
  emitir();
}

export function useAvisoError() {
  return useSyncExternalStore(
    (cb) => {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    },
    () => mensaje,
  );
}
