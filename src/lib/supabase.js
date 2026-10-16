import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const claveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las claves la app igual arranca: se muestra un aviso y el login no funciona
export const supabaseConfigurado = Boolean(url && claveAnon);

// Cliente único de Supabase para toda la app (auth y, más adelante, datos)
export const supabase = supabaseConfigurado ? createClient(url, claveAnon) : null;
