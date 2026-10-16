import { useCallback, useSyncExternalStore } from "react";

/*
 * Caché mínima de consultas a la base de datos, compartida entre componentes.
 *  - useConsulta(clave, fetcher): devuelve { datos, cargando, error } y carga una sola vez por clave.
 *  - invalidar(...claves): vuelve a pedir los datos (se llama después de guardar algo).
 *  - reiniciarCache(): se llama al cambiar de usuario, para no mostrar datos de otra cuenta.
 */

const entradas = new Map(); // clave -> { snap, fetcher, oyentes, pedido, token }

const SNAP_INICIAL = { datos: [], cargando: true, error: null };

function entrada(clave, fetcher) {
  let e = entradas.get(clave);
  if (!e) {
    e = { snap: SNAP_INICIAL, fetcher, oyentes: new Set(), pedido: false, token: 0 };
    entradas.set(clave, e);
  }
  e.fetcher = fetcher;
  return e;
}

async function cargar(clave) {
  const e = entradas.get(clave);
  if (!e) return;
  const token = ++e.token; // si llega una respuesta vieja después de una nueva, se descarta
  try {
    const datos = await e.fetcher();
    if (e.token !== token) return;
    e.snap = { datos, cargando: false, error: null };
  } catch (error) {
    if (e.token !== token) return;
    e.snap = { datos: e.snap.datos, cargando: false, error };
  }
  e.oyentes.forEach((cb) => cb());
}

export function useConsulta(clave, fetcher) {
  const e = entrada(clave, fetcher);
  const suscribir = useCallback(
    (cb) => {
      e.oyentes.add(cb);
      if (!e.pedido) {
        e.pedido = true;
        cargar(clave);
      }
      return () => e.oyentes.delete(cb);
    },
    [e, clave],
  );
  return useSyncExternalStore(suscribir, () => e.snap);
}

export function invalidar(...claves) {
  claves.forEach((clave) => cargar(clave));
}

/** Vacía todo y, si hay un usuario con sesión, vuelve a pedir lo que se está mostrando. */
export function reiniciarCache(recargar) {
  entradas.forEach((e, clave) => {
    e.token++;
    e.snap = recargar ? SNAP_INICIAL : { datos: [], cargando: false, error: null };
    e.pedido = recargar && e.oyentes.size > 0;
    e.oyentes.forEach((cb) => cb());
    if (e.pedido) cargar(clave);
  });
}
