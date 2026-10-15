import { useCallback } from "react";
import { useStored } from "./useStored.js";
import { CLAVE_VENTAS, CLAVE_GASTOS } from "./claves.js";

const VENTAS_INICIAL = [];
const GASTOS_INICIAL = [];

export const MONEDA = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const CATEGORIAS_GASTO = [
  "Mercadería y proveedores",
  "Alquiler",
  "Servicios (luz, agua, internet)",
  "Sueldos y personal",
  "Transporte y envíos",
  "Impuestos y tasas",
  "Mantenimiento",
  "Packaging e insumos",
  "Publicidad",
  "Otros",
];

/** Fecha local en formato AAAA-MM-DD. */
export function iso(fecha = new Date()) {
  return fecha.toLocaleDateString("en-CA");
}

function siguienteId(lista) {
  return lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

/**
 * Ventas y gastos compartidos (persistidos en localStorage).
 * ventas: [{ id, fecha: 'AAAA-MM-DD', hora, items: [{ sku, nombre, precio, cantidad }], metodo, total }]
 * gastos: [{ id, fecha, categoria, detalle, monto }]
 */
export function useFinanzas() {
  const [ventas, setVentas] = useStored(CLAVE_VENTAS, VENTAS_INICIAL);
  const [gastos, setGastos] = useStored(CLAVE_GASTOS, GASTOS_INICIAL);

  // venta sin id: { fecha, hora, items, metodo, total }. Devuelve la venta guardada.
  const agregarVenta = useCallback(
    (venta) => {
      const nueva = { id: 0, ...venta };
      setVentas((actual) => {
        nueva.id = siguienteId(actual);
        return [...actual, nueva];
      });
      return nueva;
    },
    [setVentas],
  );

  // gasto sin id: { fecha, categoria, detalle, monto }
  const agregarGasto = useCallback(
    (gasto) => {
      setGastos((actual) => [...actual, { id: siguienteId(actual), ...gasto }]);
    },
    [setGastos],
  );

  const eliminarVenta = useCallback(
    (id) => setVentas((actual) => actual.filter((v) => v.id !== id)),
    [setVentas],
  );

  const eliminarGasto = useCallback(
    (id) => setGastos((actual) => actual.filter((g) => g.id !== id)),
    [setGastos],
  );

  return { ventas, gastos, agregarVenta, agregarGasto, eliminarVenta, eliminarGasto };
}
