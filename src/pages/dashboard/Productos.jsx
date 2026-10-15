import { useRef, useState } from "react";
import SeccionDashboard from "../../components/SeccionDashboard.jsx";
import { useCatalogo } from "../../store/catalogo.js";

const CAMPOS_BUSQUEDA = ["nombre", "sku", "categoria", "marca", "modelo", "color", "serial", "proveedor"];
const DETALLES = [
  { clave: "categoria", etiqueta: "Categoría", fila: "row-start-3" },
  { clave: "marca", etiqueta: "Marca", fila: "row-start-4" },
  { clave: "modelo", etiqueta: "Modelo", fila: "row-start-5" },
  { clave: "color", etiqueta: "Color", fila: "row-start-6" },
  { clave: "serial", etiqueta: "Serial", fila: "row-start-7" },
  { clave: "proveedor", etiqueta: "Proveedor", fila: "row-start-8" },
  { clave: "precio", etiqueta: "Precio", fila: "row-start-9" },
];
const MONEDA = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const FORM_VACIO = {
  nombre: "", sku: "", categoria: "", marca: "", modelo: "", color: "", serial: "", proveedor: "", precio: "",
};
const BASE_INPUT =
  "w-full rounded-lg border border-(--borde) bg-(--fondo) px-3 py-2.5 focus:outline-none focus:border-(--acento) focus:ring-2 focus:ring-(--acento)/30";
const CLASE_INPUT = BASE_INPUT + " text-sm";
const CLASE_INPUT_SKU = BASE_INPUT + " font-mono text-sm uppercase";
const CLASE_INPUT_SERIAL = BASE_INPUT + " font-mono text-sm";

function valoresUnicos(lista, campo) {
  const valores = [];
  lista.forEach((p) => {
    if (p[campo] && !valores.includes(p[campo])) valores.push(p[campo]);
  });
  return valores.sort();
}

export default function Productos() {
  const { catalogo, agregar, actualizar, eliminar } = useCatalogo();
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(FORM_VACIO);
  const [idEditado, setIdEditado] = useState(null);
  const [error, setError] = useState("");
  const dialogoRef = useRef(null);
  const nombreRef = useRef(null);

  const q = busqueda.trim().toLowerCase();
  const visibles = q
    ? catalogo.filter((p) => CAMPOS_BUSQUEDA.some((c) => String(p[c] || "").toLowerCase().includes(q)))
    : catalogo;

  function campo(nombre) {
    return (e) => setForm((f) => ({ ...f, [nombre]: e.target.value }));
  }

  function abrir(producto) {
    setError("");
    setIdEditado(producto ? producto.id : null);
    setForm(
      producto
        ? {
            nombre: producto.nombre,
            sku: producto.sku,
            categoria: producto.categoria || "",
            marca: producto.marca || "",
            modelo: producto.modelo || "",
            color: producto.color || "",
            serial: producto.serial || "",
            proveedor: producto.proveedor || "",
            precio: typeof producto.precio === "number" ? producto.precio : "",
          }
        : FORM_VACIO,
    );
    dialogoRef.current.showModal();
    nombreRef.current?.focus();
  }

  function borrar(p) {
    if (window.confirm('¿Eliminar "' + p.nombre + '" del catálogo?')) eliminar(p.id);
  }

  function guardar(e) {
    e.preventDefault();
    const datos = {
      nombre: form.nombre.trim(),
      sku: form.sku.trim().toUpperCase(),
      categoria: form.categoria.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      color: form.color.trim(),
      serial: form.serial.trim(),
      proveedor: form.proveedor.trim(),
      precio: parseFloat(form.precio),
    };
    if (!(datos.precio >= 0)) datos.precio = null;

    let mensaje = "";
    if (!datos.nombre || !datos.sku) {
      mensaje = "Completá el nombre y el SKU del producto.";
    } else if (catalogo.some((p) => p.sku === datos.sku && p.id !== idEditado)) {
      mensaje = "Ya existe un producto con el SKU " + datos.sku + ".";
    }
    if (mensaje) {
      setError(mensaje);
      return;
    }

    if (idEditado) actualizar(idEditado, datos);
    else agregar(datos);
    dialogoRef.current.close();
  }

  return (
    <SeccionDashboard aria-labelledby="titulo-productos">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <h2 id="titulo-productos" className="text-xl font-bold text-(--texto)">Productos</h2>
          <p className="mt-0.5 text-sm text-(--texto-suave)">Creá, editá y eliminá los datos de cada producto.</p>
        </div>
        <span className="rounded-full bg-(--viz-verde-fondo) px-3 py-1 text-xs font-semibold text-(--viz-verde-texto)">
          {catalogo.length + (catalogo.length === 1 ? " producto" : " productos")}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-6">
        <form className="relative w-full sm:w-72" role="search" onSubmit={(e) => e.preventDefault()}>
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-(--texto-suave)" />
          <input
            className="w-full rounded-lg border border-(--borde) bg-(--fondo) py-2.5 pl-8 pr-3 text-sm text-(--texto) placeholder:text-(--texto-suave)/60 focus:outline-none focus:border-(--acento) focus:ring-2 focus:ring-(--acento)/30"
            type="search"
            placeholder="Buscar por nombre, SKU, marca…"
            aria-label="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </form>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-(--acento-hover) px-5 py-2.5 text-sm font-semibold text-white cursor-pointer transition hover:bg-(--texto) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--acento-hover)"
          type="button"
          onClick={() => abrir(null)}
        >
          <i className="fa-solid fa-plus text-xs" /> Nuevo producto
        </button>
      </div>

      <div className="mt-2 px-4 pb-3 sm:mt-3 sm:px-6 xl:overflow-x-auto">
        <table className="block w-full border-collapse text-left xl:table xl:min-w-[58rem]">
          <thead className="hidden xl:table-header-group">
            <tr className="border-b border-(--borde) text-xs font-semibold uppercase tracking-wider text-(--texto-suave)">
              <th className="py-3 pr-4" scope="col">Producto</th>
              <th className="py-3 pr-4" scope="col">SKU</th>
              <th className="py-3 pr-4" scope="col">Categoría</th>
              <th className="py-3 pr-4" scope="col">Marca</th>
              <th className="py-3 pr-4" scope="col">Modelo</th>
              <th className="py-3 pr-4" scope="col">Color</th>
              <th className="py-3 pr-4" scope="col">Serial</th>
              <th className="py-3 pr-4" scope="col">Proveedor</th>
              <th className="py-3 pr-4" scope="col">Precio</th>
              <th className="py-3 w-20" scope="col"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="block md:grid md:grid-cols-2 md:gap-x-8 xl:table-row-group">
            {visibles.map((p) => (
              <tr
                key={p.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-(--borde) py-4 last:border-0 hover:bg-(--fondo)/60 xl:table-row xl:py-0"
              >
                <td className="col-start-1 row-start-1 min-w-0 font-semibold text-(--texto) [overflow-wrap:anywhere] xl:py-3.5 xl:pr-4 xl:font-medium">{p.nombre}</td>
                <td className="col-span-2 row-start-2 min-w-0 font-mono text-sm text-(--texto-suave) [overflow-wrap:anywhere] xl:py-3.5 xl:pr-4 xl:whitespace-nowrap">{p.sku}</td>
                {DETALLES.map((d) => {
                  let valor = p[d.clave];
                  if (d.clave === "precio") valor = typeof valor === "number" ? MONEDA.format(valor) : "";
                  return (
                    <td
                      key={d.clave}
                      className={
                        "col-span-2 " + d.fila + " flex items-baseline justify-between gap-3 text-sm text-(--texto) xl:table-cell xl:py-3.5 xl:pr-4" +
                        (d.clave === "serial" || d.clave === "precio" ? " xl:whitespace-nowrap" : "")
                      }
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-(--texto-suave) xl:hidden">{d.etiqueta}</span>
                      <span className={"min-w-0 [overflow-wrap:anywhere] " + (d.clave === "serial" ? "font-mono" : d.clave === "precio" ? "font-semibold" : "")}>
                        {valor || "—"}
                      </span>
                    </td>
                  );
                })}
                <td className="col-start-2 row-start-1 flex justify-self-end gap-1 xl:table-cell xl:py-3.5 xl:text-right xl:whitespace-nowrap">
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition xl:size-8 hover:bg-(--fondo) hover:text-(--acento-hover) xl:inline-flex"
                    aria-label={"Editar " + p.nombre}
                    onClick={() => abrir(p)}
                  >
                    <i className="fa-regular fa-pen-to-square text-sm" />
                  </button>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition xl:size-8 hover:bg-(--stock-agotado)/10 hover:text-(--stock-agotado) xl:inline-flex"
                    aria-label={"Eliminar " + p.nombre}
                    onClick={() => borrar(p)}
                  >
                    <i className="fa-regular fa-trash-can text-sm" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="py-10 text-center text-sm text-(--texto-suave)">
            {catalogo.length === 0
              ? 'Todavía no cargaste productos. Tocá "Nuevo producto" para empezar.'
              : "No hay productos que coincidan con la búsqueda."}
          </p>
        )}
      </div>

      <dialog
        ref={dialogoRef}
        className="m-auto w-[min(94vw,32rem)] max-h-[92vh] rounded-xl border border-(--borde) bg-(--superficie) p-0 text-(--texto) backdrop:bg-black/50"
      >
        <form className="flex flex-col gap-4 p-6" noValidate onSubmit={guardar}>
          <h3 className="text-lg font-bold">{idEditado ? "Editar producto" : "Nuevo producto"}</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="prod-nombre">Nombre *</label>
            <input ref={nombreRef} className={CLASE_INPUT} id="prod-nombre" type="text" maxLength={80} placeholder="Ej: Camiseta básica" required value={form.nombre} onChange={campo("nombre")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-sku">SKU *</label>
              <input className={CLASE_INPUT_SKU} id="prod-sku" type="text" maxLength={30} placeholder="CAM-001" required value={form.sku} onChange={campo("sku")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-serial">Serial</label>
              <input className={CLASE_INPUT_SERIAL} id="prod-serial" type="text" maxLength={40} placeholder="Número de serie" value={form.serial} onChange={campo("serial")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-categoria">Categoría</label>
              <input className={CLASE_INPUT} id="prod-categoria" type="text" maxLength={40} list="prod-lista-categorias" placeholder="Ej: Indumentaria" value={form.categoria} onChange={campo("categoria")} />
              <datalist id="prod-lista-categorias">
                {valoresUnicos(catalogo, "categoria").map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-marca">Marca</label>
              <input className={CLASE_INPUT} id="prod-marca" type="text" maxLength={40} placeholder="Ej: Nombre de la marca" value={form.marca} onChange={campo("marca")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-modelo">Modelo</label>
              <input className={CLASE_INPUT} id="prod-modelo" type="text" maxLength={40} placeholder="Ej: Clásica" value={form.modelo} onChange={campo("modelo")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-color">Color</label>
              <input className={CLASE_INPUT} id="prod-color" type="text" maxLength={30} placeholder="Ej: Negro" value={form.color} onChange={campo("color")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-proveedor">Proveedor</label>
              <input className={CLASE_INPUT} id="prod-proveedor" type="text" maxLength={60} list="prod-lista-proveedores" placeholder="Ej: Distribuidora Central" value={form.proveedor} onChange={campo("proveedor")} />
              <datalist id="prod-lista-proveedores">
                {valoresUnicos(catalogo, "proveedor").map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="prod-precio">Precio ($)</label>
              <input className={CLASE_INPUT} id="prod-precio" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00" value={form.precio} onChange={campo("precio")} />
            </div>
          </div>

          {error && <p className="text-sm text-(--stock-agotado)" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="rounded-full border border-(--borde) px-5 py-2 text-sm font-medium cursor-pointer hover:bg-(--fondo)" type="button" onClick={() => dialogoRef.current.close()}>Cancelar</button>
            <button className="rounded-full bg-(--acento-hover) px-5 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-(--texto)" type="submit">Guardar</button>
          </div>
        </form>
      </dialog>
    </SeccionDashboard>
  );
}
