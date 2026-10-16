import { useMemo } from "react";
import { db, guardar, ok } from "./db.js";
import { invalidar } from "./consultas.js";
import { CLAVE_PRODUCTOS, registrarMovimiento, useProductosDB } from "./productos.js";

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

/**
 * Inventario (stock y mínimo de cada producto), sobre la tabla productos.
 * { productos, cargando, cambiarStock(id, nuevo, motivo), agregar({nombre, codigo, stock, minimo}), eliminar(id) }
 * Los guardados devuelven true/false y cada cambio de stock queda en movimientos_stock.
 */
export function useInventario() {
  const { datos, cargando } = useProductosDB();

  const productos = useMemo(
    () => datos.map((r) => ({ id: r.id, nombre: r.nombre, codigo: r.sku, stock: r.stock, minimo: r.stock_minimo })),
    [datos],
  );

  const cambiarStock = (id, nuevo, motivo) =>
    guardar(async () => {
      const actual = datos.find((r) => r.id === id);
      if (!actual || !Number.isFinite(nuevo)) return;
      const stock = Math.max(0, Math.floor(nuevo));
      const diferencia = stock - actual.stock;
      if (diferencia === 0) return;
      ok(await db().from("productos").update({ stock }).eq("id", id));
      await registrarMovimiento(id, diferencia > 0 ? "entrada" : "salida", diferencia, motivo || "Ajuste manual");
      invalidar(CLAVE_PRODUCTOS);
    });

  const agregar = ({ nombre, codigo, stock, minimo }) =>
    guardar(async () => {
      const creado = ok(
        await db().from("productos").insert({ nombre, sku: codigo, stock, stock_minimo: minimo }).select("id").single(),
      );
      if (stock > 0) await registrarMovimiento(creado.id, "entrada", stock, "Stock inicial");
      invalidar(CLAVE_PRODUCTOS);
    });

  const eliminar = (id) =>
    guardar(async () => {
      ok(await db().from("productos").delete().eq("id", id));
      invalidar(CLAVE_PRODUCTOS);
    });

  return { productos, cargando, cambiarStock, agregar, eliminar };
}
