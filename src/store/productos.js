import { db, ok } from "./db.js";
import { useConsulta } from "./consultas.js";

export const CLAVE_PRODUCTOS = "productos";
const CAMPOS =
  "id,sku,nombre,categoria,marca,modelo,color,serial,precio,stock,stock_minimo,proveedor_id,proveedores(nombre)";

async function pedir() {
  return ok(await db().from("productos").select(CAMPOS).order("id"));
}

/** Filas crudas de la tabla productos (catálogo + inventario). Lo usan useInventario, useCatalogo y useFinanzas. */
export function useProductosDB() {
  return useConsulta(CLAVE_PRODUCTOS, pedir);
}

/** Registra un cambio de stock en el historial (movimientos_stock). cantidad: positiva suma, negativa resta. */
export async function registrarMovimiento(productoId, tipo, cantidad, motivo) {
  ok(await db().from("movimientos_stock").insert({ producto_id: productoId, tipo, cantidad, motivo: motivo || null }));
}
