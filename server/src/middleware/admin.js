import { adminConfigurado } from "../config.js";
import { responderErrorDB } from "../errores.js";

/**
 * Solo deja pasar a administradores activos. Va DESPUÉS de requiereUsuario.
 * La base decide quién es admin (función es_admin), no lo que diga el navegador.
 */
export async function requiereAdmin(req, res, next) {
  if (!adminConfigurado) {
    return res.status(503).json({ error: "El servidor no tiene configurada la administración de personas." });
  }
  const { data, error } = await req.db.rpc("es_admin");
  if (error) return responderErrorDB(res, error);
  if (data !== true) return res.status(403).json({ error: "Solo un administrador puede hacer esto." });
  next();
}
