import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const claveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las claves la app igual arranca: se muestra un aviso y el login no funciona
export const supabaseConfigurado = Boolean(url && claveAnon);

// Cliente único de Supabase para toda la app (auth y, más adelante, datos)
export const supabase = supabaseConfigurado ? createClient(url, claveAnon) : null;

/**
 * Cliente de un solo uso que NO guarda la sesión en el navegador.
 * Sirve para verificar la contraseña actual de alguien y cambiársela sin iniciar sesión en la app.
 */
export function crearClienteTemporal() {
  if (!supabaseConfigurado) return null;
  return createClient(url, claveAnon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "gestion-cambio-password-temporal",
    },
  });
}
