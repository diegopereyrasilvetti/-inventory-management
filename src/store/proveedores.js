import { useMemo } from "react";
import { db, guardar, nulo, ok } from "./db.js";
import { invalidar, useConsulta } from "./consultas.js";

const CLAVE = "proveedores";
const CAMPOS = "id,nombre,rubro,contacto,telefono,email,activo";

async function pedir() {
  return ok(await db().from("proveedores").select(CAMPOS).order("id"));
}

const aFila = (d) => ({
  nombre: d.nombre,
  rubro: nulo(d.rubro),
  contacto: nulo(d.contacto),
  telefono: nulo(d.telefono),
  email: nulo(d.email),
  activo: d.activo,
});

/** Proveedores: { proveedores, cargando, agregar(datos), actualizar(id, datos), eliminar(id) }. Los guardados devuelven true/false. */
export function useProveedores() {
  const { datos, cargando } = useConsulta(CLAVE, pedir);

  const proveedores = useMemo(
    () =>
      datos.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        rubro: r.rubro || "",
        contacto: r.contacto || "",
        telefono: r.telefono || "",
        email: r.email || "",
        activo: r.activo,
      })),
    [datos],
  );

  const agregar = (d) =>
    guardar(async () => {
      ok(await db().from("proveedores").insert(aFila(d)));
      invalidar(CLAVE);
    });

  const actualizar = (id, d) =>
    guardar(async () => {
      ok(await db().from("proveedores").update(aFila(d)).eq("id", id));
      invalidar(CLAVE, "productos"); // el nombre del proveedor se muestra dentro de los productos
    });

  const eliminar = (id) =>
    guardar(async () => {
      ok(await db().from("proveedores").delete().eq("id", id));
      invalidar(CLAVE, "productos");
    });

  return { proveedores, cargando, agregar, actualizar, eliminar };
}
