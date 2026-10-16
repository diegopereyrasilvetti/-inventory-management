import { app } from "./app.js";
import { config, supabaseConfigurado } from "./config.js";

app.listen(config.puerto, () => {
  console.log(`API escuchando en http://localhost:${config.puerto}`);
  if (!supabaseConfigurado) {
    console.warn("Aviso: faltan SUPABASE_URL o SUPABASE_ANON_KEY en server/.env");
  }
});
