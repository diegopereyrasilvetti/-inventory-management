import { supabase } from "./supabase.js";

// En desarrollo, Vite reenvía /api al servidor de server/ (ver vite.config.js).
// En producción, VITE_API_URL tiene la dirección completa de la API.
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

/** Error que devuelve la API. mensajeUsuario es el texto en español que se le muestra a la persona. */
export class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
    this.mensajeUsuario = mensaje;
  }
}

/**
 * Llama a la API enviando el token del usuario que inició sesión.
 * api("POST", "/ventas", { ... }) -> devuelve el JSON de la respuesta (o null si no hay cuerpo).
 */
export async function api(metodo, ruta, cuerpo) {
  if (!supabase) throw new Error("Supabase no está configurado (falta el archivo .env).");

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ErrorApi("Tu sesión venció. Volvé a iniciar sesión.", 401);

  let respuesta;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        Authorization: "Bearer " + token,
        ...(cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor. ¿Está encendido?", 0);
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const detalle = datos?.detalles?.[0] ? " (" + datos.detalles[0].mensaje + ")" : "";
    throw new ErrorApi((datos?.error || "Error del servidor.") + detalle, respuesta.status);
  }
  return datos;
}
