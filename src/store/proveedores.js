import { useCallback } from "react";
import { useStored } from "./useStored.js";
import { CLAVE_PROVEEDORES } from "./claves.js";

const EJEMPLOS = [
  { id: 1, nombre: "Distribuidora Central", rubro: "Mercadería general", contacto: "Carlos Gómez", telefono: "+54 11 5555-0101", email: "ventas@distribuidoracentral.example", activo: true },
  { id: 2, nombre: "Insumos del Sur", rubro: "Insumos", contacto: "María López", telefono: "+54 11 5555-0102", email: "", activo: true },
  { id: 3, nombre: "Importadora Norte", rubro: "Importación", contacto: "Juan Pérez", telefono: "+54 11 5555-0103", email: "", activo: false },
];

/** Proveedores: { proveedores, agregar(datos), actualizar(id, datos), eliminar(id) } */
export function useProveedores() {
  const [proveedores, setProveedores] = useStored(CLAVE_PROVEEDORES, EJEMPLOS);

  const agregar = useCallback(
    (datos) =>
      setProveedores((lista) => {
        const id = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        return [...lista, { id, ...datos }];
      }),
    [setProveedores],
  );
  const actualizar = useCallback(
    (id, datos) => setProveedores((lista) => lista.map((p) => (p.id === id ? { ...p, ...datos } : p))),
    [setProveedores],
  );
  const eliminar = useCallback(
    (id) => setProveedores((lista) => lista.filter((p) => p.id !== id)),
    [setProveedores],
  );

  return { proveedores, agregar, actualizar, eliminar };
}
