import { supabase } from "../lib/supabase.js";
import { mensajeDeError } from "../lib/errores.js";
import { avisarError } from "./avisos.js";

/** Devuelve el cliente de Supabase o falla con un mensaje claro si falta el .env. */
export function db() {
  if (!supabase) throw new Error("Supabase no está configurado (falta el archivo .env).");
  return supabase;
}

/** Cada consulta de Supabase devuelve { data, error }: si hay error, se lanza para manejarlo en un solo lugar. */
export function ok({ data, error }) {
  if (error) throw error;
  return data;
}

/**
 * Corre una operación de guardado. Si falla, muestra el cartel de error y devuelve false;
 * si sale bien, devuelve true. Las pantallas pueden usar el resultado para decidir si cierran el diálogo.
 */
export async function guardar(operacion) {
  try {
    await operacion();
    return true;
  } catch (error) {
    console.error(error);
    avisarError(mensajeDeError(error));
    return false;
  }
}

/** Texto vacío -> null (la base guarda null en vez de ""). */
export const nulo = (valor) => {
  const texto = typeof valor === "string" ? valor.trim() : valor;
  return texto === "" || texto === undefined ? null : texto;
};
