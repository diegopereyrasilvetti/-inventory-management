import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dirección del servidor de la API (carpeta server/). Se puede cambiar con la variable API_URL.
const apiDestino = process.env.API_URL || "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Las llamadas a /api desde la web se reenvían a la API, así en desarrollo no hay problemas de CORS.
    // Se quita el encabezado Origin para que funcione con cualquier puerto de Vite (5173, 5174...)
    proxy: {
      "/api": {
        target: apiDestino,
        configure(proxy) {
          proxy.on("proxyReq", (req) => req.removeHeader("origin"));
        },
      },
    },
  },
});
