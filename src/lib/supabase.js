import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const claveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !claveAnon) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copiá .env.example como .env y completalo.",
  );
}

// Cliente único de Supabase para toda la app (auth y, más adelante, datos)
export const supabase = createClient(url, claveAnon);
