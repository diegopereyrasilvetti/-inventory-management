import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente "neutro" de Supabase, solo para consultar quién es el dueño de un token. */
export function clienteBase() {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, opciones);
}

/**
 * Cliente con la clave "secret": se SALTA todas las reglas de seguridad de la base.
 * Se usa únicamente en las rutas de administración, después de comprobar que quien llama es administrador.
 */
export function clienteAdmin() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, opciones);
}

/**
 * Cliente de Supabase que actúa EN NOMBRE del usuario: envía su token en cada consulta,
 * así las reglas de seguridad de la base (RLS) siguen aplicándose y cada usuario solo ve lo suyo.
 */
export function clienteDelUsuario(token) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    ...opciones,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
