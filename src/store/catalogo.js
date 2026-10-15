import { useCallback } from "react";
import { useStored } from "./useStored.js";
import { CLAVE_CATALOGO } from "./claves.js";

const EJEMPLOS = [
  { id: 1, nombre: "Camiseta básica", sku: "CAM-001", categoria: "Indumentaria", marca: "Marca Uno", modelo: "Clásica", color: "Blanco", serial: "MU-2024-0001", proveedor: "Distribuidora Central", precio: 45000 },
  { id: 2, nombre: "Taza de cerámica", sku: "TAZ-002", categoria: "Hogar", marca: "Marca Dos", modelo: "Línea 350 ml", color: "Azul", serial: "MD-2024-0002", proveedor: "Insumos del Sur", precio: 68000 },
  { id: 3, nombre: "Cuaderno A5", sku: "CUA-003", categoria: "Papelería", marca: "Marca Tres", modelo: "Tapa dura", color: "Negro", serial: "MT-2024-0003", proveedor: "Importadora Norte", precio: 32000 },
];

/** Catálogo de productos: { catalogo, agregar(datos), actualizar(id, datos), eliminar(id) } */
export function useCatalogo() {
  const [catalogo, setCatalogo] = useStored(CLAVE_CATALOGO, EJEMPLOS);

  const agregar = useCallback(
    (datos) =>
      setCatalogo((lista) => {
        const id = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        return [...lista, { id, ...datos }];
      }),
    [setCatalogo],
  );
  const actualizar = useCallback(
    (id, datos) => setCatalogo((lista) => lista.map((p) => (p.id === id ? { ...p, ...datos } : p))),
    [setCatalogo],
  );
  const eliminar = useCallback(
    (id) => setCatalogo((lista) => lista.filter((p) => p.id !== id)),
    [setCatalogo],
  );

  return { catalogo, agregar, actualizar, eliminar };
}
