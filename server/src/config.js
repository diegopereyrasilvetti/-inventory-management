// Lee la configuración desde las variables de entorno (archivo server/.env)
const env = process.env;

export const config = {
  puerto: Number(env.PORT) || 3001,
  // Lista de webs autorizadas a llamar a la API
  origenesPermitidos: (env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  supabaseUrl: env.SUPABASE_URL || "",
  supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
  produccion: env.NODE_ENV === "production",
};

export const supabaseConfigurado = Boolean(config.supabaseUrl && config.supabaseAnonKey);
