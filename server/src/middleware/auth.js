import { supabaseConfigurado } from "../config.js";
import { clienteBase, clienteDelUsuario } from "../supabase.js";

const NO_AUTORIZADO = { error: "Necesitás iniciar sesión." };

/**
 * Protege una ruta: exige un token de Supabase en el encabezado "Authorization: Bearer <token>".
 * Supabase verifica que el token sea auténtico y no esté vencido. Si todo está bien deja
 *   req.user -> { id, email }
 *   req.db   -> cliente de Supabase que actúa como ese usuario
 */
export async function requiereUsuario(req, res, next) {
  if (!supabaseConfigurado) {
    return res.status(503).json({ error: "El servidor no tiene configurado Supabase." });
  }

  const encabezado = req.get("authorization") || "";
  const [tipo, token] = encabezado.split(" ");
  if (tipo?.toLowerCase() !== "bearer" || !token) return res.status(401).json(NO_AUTORIZADO);

  try {
    const { data, error } = await clienteBase().auth.getUser(token);
    if (error || !data?.user) return res.status(401).json(NO_AUTORIZADO);
    req.user = { id: data.user.id, email: data.user.email };
    req.db = clienteDelUsuario(token);
    next();
  } catch (err) {
    next(err); // falla de red con Supabase u otro problema inesperado: lo maneja el error general
  }
}
