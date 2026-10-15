import { useCallback } from "react";
import { useStored } from "./useStored.js";
import { CLAVE_INVENTARIO } from "./claves.js";

export const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Camiseta básica", codigo: "CAM-001", stock: 24, minimo: 10 },
  { id: 2, nombre: "Taza de cerámica", codigo: "TAZ-002", stock: 8, minimo: 10 },
  { id: 3, nombre: "Cuaderno A5", codigo: "CUA-003", stock: 0, minimo: 5 },
];

export const ESTADOS = {
  disponible: { texto: "Disponible", clases: "bg-(--viz-verde-fondo) text-(--viz-verde-texto)" },
  bajo: { texto: "Bajo", clases: "bg-(--viz-naranja-fondo) text-(--viz-naranja-texto)" },
  agotado: { texto: "Agotado", clases: "bg-(--viz-gris-fondo) text-(--viz-gris-texto)" },
};

export function estadoDe(p) {
  if (p.stock === 0) return "agotado";
  if (p.stock <= p.minimo) return "bajo";
  return "disponible";
}

export function unidades(n) {
  return n + (n === 1 ? " unidad" : " unidades");
}

/** Productos del inventario (stock y mínimo). Devuelve { productos, setProductos, cambiarStock, agregar, eliminar }. */
export function useInventario() {
  const [productos, setProductos] = useStored(CLAVE_INVENTARIO, PRODUCTOS_INICIALES);

  const cambiarStock = useCallback(
    (id, nuevo) => {
      setProductos((lista) =>
        lista.map((p) =>
          p.id === id
            ? { ...p, stock: Math.max(0, Number.isFinite(nuevo) ? Math.floor(nuevo) : p.stock) }
            : p,
        ),
      );
    },
    [setProductos],
  );

  const agregar = useCallback(
    (producto) => {
      setProductos((lista) => {
        const id = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        return [...lista, { ...producto, id }];
      });
    },
    [setProductos],
  );

  const eliminar = useCallback(
    (id) => setProductos((lista) => lista.filter((p) => p.id !== id)),
    [setProductos],
  );

  return { productos, setProductos, cambiarStock, agregar, eliminar };
}
