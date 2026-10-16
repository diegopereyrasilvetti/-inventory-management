import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Crecimiento from "../../components/Crecimiento.jsx";
import { estadoDe, unidades, useInventario } from "../../store/inventario.js";

const URL_FRASE = "https://www.positive-api.online/phrase/esp";
const FRASES_RESPALDO = [
  "Cada día es una buena oportunidad para ordenar tu negocio.",
  "Un buen control hoy es tranquilidad mañana.",
  "Los pequeños avances de cada día construyen grandes resultados.",
  "Lo que se mide, se puede mejorar.",
];

const ACCESOS = [
  { ruta: "/dashboard/inventario", titulo: "Inventario", texto: "Stock y niveles", icono: "fa-boxes-stacked", color: "bg-(--viz-violeta)/10 text-(--viz-violeta)" },
  { ruta: "/dashboard/productos", titulo: "Productos", texto: "Catálogo y precios", icono: "fa-tag", color: "bg-(--viz-verde-fondo) text-(--viz-verde-texto)" },
  { ruta: "/dashboard/documentacion", titulo: "Documentación", texto: "Facturas y remitos", icono: "fa-file-lines", color: "bg-(--viz-azul)/10 text-(--viz-azul)" },
  { ruta: "/dashboard/proveedores", titulo: "Proveedores", texto: "Contactos y rubros", icono: "fa-truck", color: "bg-(--viz-naranja-fondo) text-(--viz-naranja-texto)" },
  { ruta: "/dashboard/ventas", titulo: "Ventas", texto: "Ventas y gastos del día", icono: "fa-cart-shopping", color: "bg-(--viz-verde-fondo) text-(--viz-verde-texto)" },
  { ruta: "/dashboard/balances", titulo: "Balances", texto: "Ingresos y ganancias", icono: "fa-scale-balanced", color: "bg-(--viz-violeta)/10 text-(--viz-violeta)" },
];

function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return { texto: "¡Buen día!", icono: "fa-solid fa-sun" };
  if (hora >= 12 && hora < 20) return { texto: "¡Buenas tardes!", icono: "fa-solid fa-cloud-sun" };
  return { texto: "¡Buenas noches!", icono: "fa-solid fa-moon" };
}

function fraseDeRespaldo() {
  return FRASES_RESPALDO[Math.floor(Math.random() * FRASES_RESPALDO.length)];
}

function Saludo() {
  const [saludo] = useState(saludoSegunHora);
  const [frase, setFrase] = useState("Buscando una frase para vos…");
  const [cargando, setCargando] = useState(false);

  const cargarFrase = useCallback(async () => {
    setCargando(true);
    const control = new AbortController();
    const limite = setTimeout(() => control.abort(), 6000);
    let texto;
    try {
      const respuesta = await fetch(URL_FRASE, { cache: "no-store", signal: control.signal });
      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
      const datos = await respuesta.json();
      if (!datos || typeof datos.text !== "string" || !datos.text.trim()) throw new Error("Respuesta sin texto");
      texto = datos.text.trim();
    } catch {
      // Sin conexión o API caída: se muestra una frase propia en lugar de dejar el espacio vacío
      texto = fraseDeRespaldo();
    } finally {
      clearTimeout(limite);
    }
    setFrase(texto);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarFrase();
  }, [cargarFrase]);

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-(--borde) bg-(--superficie) p-4 sm:gap-4 sm:p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--fondo) text-lg text-(--acento-hover)" aria-hidden="true">
        <i className={saludo.icono}></i>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-(--texto) sm:text-xl">{saludo.texto}</p>
        <p className="mt-0.5 break-words text-sm italic text-(--texto-suave) sm:text-base" aria-live="polite">
          {"“" + frase + "”"}
        </p>
      </div>
      <button
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition hover:bg-(--fondo) hover:text-(--acento-hover) disabled:cursor-wait disabled:opacity-60"
        type="button"
        aria-label="Ver otra frase"
        title="Ver otra frase"
        disabled={cargando}
        onClick={cargarFrase}
      >
        <span className={"inline-flex text-sm" + (cargando ? " animate-spin" : "")} aria-hidden="true">
          <i className="fa-solid fa-rotate"></i>
        </span>
      </button>
    </div>
  );
}

function AlertasResumen({ productos, cargando }) {
  const items = [
    ...productos.filter((p) => estadoDe(p) === "agotado").map((p) => ({
      p,
      tipo: "agotado",
      texto: " no hay stock y se necesitan mínimo " + unidades(p.minimo) + ".",
    })),
    ...productos.filter((p) => estadoDe(p) === "bajo").map((p) => ({
      p,
      tipo: "bajo",
      texto:
        " " +
        (p.stock === 1 ? "queda solo 1 unidad" : "hay pocos (" + unidades(p.stock) + ")") +
        " y se necesitan mínimo " + unidades(p.minimo) + ".",
    })),
  ];

  return (
    <div className="rounded-2xl border border-(--borde) bg-(--superficie) p-4 sm:p-5" aria-labelledby="titulo-alertas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="titulo-alertas" className="text-base font-bold text-(--texto)">Alertas de stock</h3>
        <Link className="text-sm font-medium text-(--acento-hover) hover:underline" to="/dashboard/alertas">
          Gestionar alertas <i className="fa-solid fa-arrow-right text-xs"></i>
        </Link>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((it) => {
            const agotado = it.tipo === "agotado";
            return (
              <li
                key={it.p.id}
                className={
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm " +
                  (agotado ? "bg-(--viz-gris-fondo) text-(--viz-gris-texto)" : "bg-(--viz-naranja-fondo) text-(--viz-naranja-texto)")
                }
              >
                <i className={"mt-0.5 shrink-0 " + (agotado ? "fa-solid fa-circle-xmark" : "fa-solid fa-triangle-exclamation")}></i>
                <p className="min-w-0 break-words">
                  <strong className="font-semibold">{"Alerta de " + it.p.nombre + ":"}</strong>
                  {it.texto}
                </p>
              </li>
            );
          })}
        </ul>
      ) : !cargando && (
        <p className="mt-3 flex items-center gap-2 text-sm text-(--viz-verde-texto)">
          <i className="fa-regular fa-circle-check"></i> Todo en orden: no hay productos con stock bajo ni agotados.
        </p>
      )}
    </div>
  );
}

export default function Resumen() {
  const { productos, cargando } = useInventario();

  return (
    <section id="resumen" className="mx-auto max-w-5xl" aria-labelledby="titulo-resumen">
      <Saludo />

      <h2 id="titulo-resumen" className="sr-only">Resumen</h2>

      <AlertasResumen productos={productos} cargando={cargando} />

      <div className="mt-6">
        <h3 className="mb-2.5 text-base font-bold text-(--texto)">Accesos rápidos</h3>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {ACCESOS.map((a) => (
            <li key={a.ruta}>
              <Link
                className="group flex h-full flex-col items-start gap-2 rounded-xl border border-(--borde) bg-(--superficie) p-3 shadow-[0_2px_8px_rgba(59,42,32,0.04)] transition hover:-translate-y-0.5 hover:border-(--acento) hover:shadow-[0_10px_24px_rgba(59,42,32,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--acento-hover) sm:flex-row sm:items-center sm:gap-3 sm:p-3 lg:p-3.5"
                to={a.ruta}
              >
                <span className={"flex size-9 shrink-0 items-center justify-center rounded-lg text-base sm:size-10 sm:text-lg " + a.color} aria-hidden="true">
                  <i className={"fa-solid " + a.icono}></i>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight text-(--texto) sm:text-[0.95rem]">{a.titulo}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-(--texto-suave)">{a.texto}</span>
                </span>
                <span className="hidden text-xs text-(--texto-suave) transition group-hover:translate-x-0.5 group-hover:text-(--acento-hover) lg:inline-flex" aria-hidden="true">
                  <i className="fa-solid fa-chevron-right"></i>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Crecimiento />
    </section>
  );
}
