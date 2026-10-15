import { useCallback, useSyncExternalStore } from "react";

/*
 * Estado persistido en localStorage y compartido entre componentes.
 * Todos los componentes que usan la misma clave se actualizan juntos.
 * Las claves son las mismas de la versión anterior, así que los datos ya cargados se conservan.
 */

const oyentes = new Map(); // clave -> Set de callbacks
const cache = new Map(); // clave -> { raw, valor }

function valorInicial(inicial) {
  return typeof inicial === "function" ? inicial() : inicial;
}

export function leerStored(clave, inicial) {
  let raw = null;
  try {
    raw = localStorage.getItem(clave);
  } catch {
    /* sin almacenamiento disponible */
  }
  const guardado = cache.get(clave);
  if (guardado && (guardado.raw === raw || raw === null)) return guardado.valor;

  let valor;
  if (raw !== null) {
    try {
      valor = JSON.parse(raw);
    } catch {
      valor = valorInicial(inicial);
    }
  } else {
    valor = valorInicial(inicial);
  }
  cache.set(clave, { raw, valor });
  return valor;
}

export function escribirStored(clave, inicial, nuevo) {
  const actual = leerStored(clave, inicial);
  const valor = typeof nuevo === "function" ? nuevo(actual) : nuevo;
  let raw = null;
  try {
    raw = JSON.stringify(valor);
    localStorage.setItem(clave, raw);
  } catch {
    /* sin almacenamiento disponible: queda solo en memoria */
  }
  cache.set(clave, { raw, valor });
  (oyentes.get(clave) || []).forEach((cb) => cb());
}

function suscribir(clave, cb) {
  if (!oyentes.has(clave)) oyentes.set(clave, new Set());
  oyentes.get(clave).add(cb);
  function alCambiarOtraPestana(e) {
    if (e.key === clave) cb();
  }
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.get(clave).delete(cb);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

/**
 * useStored(clave, inicial) -> [valor, setValor]
 * `inicial` es un valor o una función; debe ser estable (definila fuera del componente).
 * setValor acepta un valor nuevo o una función (actual) => nuevo.
 */
export function useStored(clave, inicial) {
  const valor = useSyncExternalStore(
    useCallback((cb) => suscribir(clave, cb), [clave]),
    () => leerStored(clave, inicial),
  );
  const setValor = useCallback(
    (nuevo) => escribirStored(clave, inicial, nuevo),
    [clave, inicial],
  );
  return [valor, setValor];
}
