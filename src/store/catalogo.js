import { useMemo } from "react";
import { db, guardar, nulo, ok } from "./db.js";
import { invalidar } from "./consultas.js";
import { avisarError } from "./avisos.js";
import { CLAVE_PRODUCTOS, registrarMovimiento, useProductosDB } from "./productos.js";
import { useProveedores } from "./proveedores.js";

/**
 * Catálogo (datos descriptivos y precio de cada producto), sobre la misma tabla productos que el inventario.
 * { catalogo, cargando, agregar(datos), actualizar(id, datos), eliminar(id) }
 * El proveedor se escribe por nombre y se vincula con la tabla proveedores.
 */
export function useCatalogo() {
  const { datos, cargando } = useProductosDB();
  const { proveedores } = useProveedores();

  const catalogo = useMemo(
    () =>
      datos.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        sku: r.sku,
        categoria: r.categoria || "",
        marca: r.marca || "",
        modelo: r.modelo || "",
        color: r.color || "",
        serial: r.serial || "",
        proveedor: r.proveedores?.nombre || "",
        precio: r.precio === null || r.precio === undefined ? null : Number(r.precio),
      })),
    [datos],
  );

  // Devuelve { id } del proveedor (id es null si no se escribió ninguno) o null si ese nombre no existe
  function resolverProveedor(nombre) {
    const buscado = (nombre || "").trim().toLowerCase();
    if (!buscado) return { id: null };
    const p = proveedores.find((x) => x.nombre.trim().toLowerCase() === buscado);
    return p ? { id: p.id } : null;
  }

  function aFila(d, proveedorId) {
    return {
      sku: d.sku,
      nombre: d.nombre,
      categoria: nulo(d.categoria),
      marca: nulo(d.marca),
      modelo: nulo(d.modelo),
      color: nulo(d.color),
      serial: nulo(d.serial),
      precio: d.precio ?? null,
      proveedor_id: proveedorId,
    };
  }

  async function guardarProducto(d, operacion) {
    const proveedor = resolverProveedor(d.proveedor);
    if (!proveedor) {
      avisarError('El proveedor "' + d.proveedor.trim() + '" no existe. Cargalo primero en la sección Proveedores.');
      return false;
    }
    return guardar(async () => {
      await operacion(aFila(d, proveedor.id));
      invalidar(CLAVE_PRODUCTOS);
    });
  }

  // Al crear un producto se puede cargar su stock inicial y el mínimo (con el que se disparan las alertas)
  const agregar = (d) =>
    guardarProducto(d, async (fila) => {
      const stock = Number.isInteger(d.stock) ? d.stock : 0;
      const stockMinimo = Number.isInteger(d.minimo) ? d.minimo : 0;
      const creado = ok(
        await db().from("productos").insert({ ...fila, stock, stock_minimo: stockMinimo }).select("id").single(),
      );
      if (stock > 0) await registrarMovimiento(creado.id, "entrada", stock, "Stock inicial");
    });
  const actualizar = (id, d) =>
    guardarProducto(d, async (fila) => ok(await db().from("productos").update(fila).eq("id", id)));
  const eliminar = (id) =>
    guardar(async () => {
      ok(await db().from("productos").delete().eq("id", id));
      invalidar(CLAVE_PRODUCTOS);
    });

  return { catalogo, cargando, agregar, actualizar, eliminar };
}
