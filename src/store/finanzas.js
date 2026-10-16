import { useMemo } from "react";
import { db, guardar, nulo, ok } from "./db.js";
import { invalidar, useConsulta } from "./consultas.js";
import { avisarError } from "./avisos.js";
import { CLAVE_PRODUCTOS, registrarMovimiento, useProductosDB } from "./productos.js";

const CLAVE_VENTAS = "ventas";
const CLAVE_GASTOS = "gastos";

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

function hora(creada) {
  return new Date(creada).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function pedirVentas() {
  return ok(
    await db()
      .from("ventas")
      .select("id,fecha,metodo,total,created_at,venta_items(id,producto_id,sku,nombre,precio,cantidad)")
      .order("created_at"),
  );
}

async function pedirGastos() {
  return ok(await db().from("gastos").select("id,fecha,categoria,detalle,monto").order("id"));
}

/**
 * Ventas y gastos.
 * ventas: [{ id, fecha: 'AAAA-MM-DD', hora: 'HH:mm', items: [{ sku, nombre, precio, cantidad }], metodo, total }]
 * gastos: [{ id, fecha, categoria, detalle, monto }]
 * Los guardados devuelven true/false. Una venta descuenta el stock de cada producto y lo anota en movimientos_stock;
 * al eliminarla, el stock se devuelve.
 */
export function useFinanzas() {
  const { datos: filasVentas, cargando: cargandoVentas } = useConsulta(CLAVE_VENTAS, pedirVentas);
  const { datos: filasGastos, cargando: cargandoGastos } = useConsulta(CLAVE_GASTOS, pedirGastos);
  const { datos: filasProductos } = useProductosDB();

  const ventas = useMemo(
    () =>
      filasVentas.map((v) => ({
        id: v.id,
        fecha: v.fecha,
        hora: hora(v.created_at),
        metodo: v.metodo,
        total: Number(v.total),
        items: (v.venta_items || []).map((it) => ({
          sku: it.sku,
          nombre: it.nombre,
          precio: Number(it.precio),
          cantidad: it.cantidad,
          productoId: it.producto_id,
        })),
      })),
    [filasVentas],
  );

  const gastos = useMemo(
    () =>
      filasGastos.map((g) => ({
        id: g.id,
        fecha: g.fecha,
        categoria: g.categoria,
        detalle: g.detalle || "",
        monto: Number(g.monto),
      })),
    [filasGastos],
  );

  // venta sin id: { fecha, hora, items, metodo, total }
  async function agregarVenta(venta) {
    const porSku = new Map(filasProductos.map((p) => [p.sku, p]));

    // Se revisa el stock antes de guardar nada
    for (const it of venta.items) {
      const p = porSku.get(it.sku);
      if (p && p.stock < it.cantidad) {
        avisarError('Stock insuficiente de "' + it.nombre + '": quedan ' + p.stock + " y querés vender " + it.cantidad + ".");
        return false;
      }
    }

    let ventaId = null;
    const exito = await guardar(async () => {
      const creada = ok(
        await db()
          .from("ventas")
          .insert({ fecha: venta.fecha, metodo: venta.metodo, total: venta.total })
          .select("id")
          .single(),
      );
      ventaId = creada.id;

      ok(
        await db()
          .from("venta_items")
          .insert(
            venta.items.map((it) => ({
              venta_id: ventaId,
              producto_id: porSku.get(it.sku)?.id ?? null,
              sku: it.sku,
              nombre: it.nombre,
              precio: it.precio,
              cantidad: it.cantidad,
            })),
          ),
      );

      for (const it of venta.items) {
        const p = porSku.get(it.sku);
        if (!p) continue;
        ok(await db().from("productos").update({ stock: p.stock - it.cantidad }).eq("id", p.id));
        await registrarMovimiento(p.id, "venta", -it.cantidad, "Venta #" + ventaId);
      }
    });

    // Si algo falló después de crear la venta, se borra para no dejarla a medias
    if (!exito && ventaId) await db().from("ventas").delete().eq("id", ventaId);
    invalidar(CLAVE_VENTAS, CLAVE_PRODUCTOS);
    return exito;
  }

  async function eliminarVenta(id) {
    const venta = filasVentas.find((v) => v.id === id);
    const exito = await guardar(async () => {
      ok(await db().from("ventas").delete().eq("id", id));
      // Se devuelve el stock de los productos que siguen existiendo
      for (const it of venta?.venta_items || []) {
        const p = filasProductos.find((x) => x.id === it.producto_id);
        if (!p) continue;
        ok(await db().from("productos").update({ stock: p.stock + it.cantidad }).eq("id", p.id));
        await registrarMovimiento(p.id, "entrada", it.cantidad, "Venta #" + id + " eliminada");
      }
    });
    invalidar(CLAVE_VENTAS, CLAVE_PRODUCTOS);
    return exito;
  }

  // gasto sin id: { fecha, categoria, detalle, monto }
  const agregarGasto = (g) =>
    guardar(async () => {
      ok(
        await db()
          .from("gastos")
          .insert({ fecha: g.fecha, categoria: g.categoria, detalle: nulo(g.detalle), monto: g.monto }),
      );
      invalidar(CLAVE_GASTOS);
    });

  const eliminarGasto = (id) =>
    guardar(async () => {
      ok(await db().from("gastos").delete().eq("id", id));
      invalidar(CLAVE_GASTOS);
    });

  return {
    ventas,
    gastos,
    cargando: cargandoVentas || cargandoGastos,
    agregarVenta,
    agregarGasto,
    eliminarVenta,
    eliminarGasto,
  };
}
