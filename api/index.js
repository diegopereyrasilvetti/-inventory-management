// Punto de entrada de la API en Vercel (función serverless).
// Vercel ejecuta este archivo cuando se llama a /api/...; es la misma app Express de server/.
import { app } from "../server/src/app.js";

export default app;
