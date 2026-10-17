// Traduce los errores de la base de datos a respuestas HTTP claras, sin filtrar detalles internos.

// Códigos propios de las funciones SQL (03_funciones.sql): su mensaje ya está en español y es seguro mostrarlo
const CODIGOS_PROPIOS = {
  GS001: 400, // datos inválidos
  GS002: 404, // no encontrado
  GS003: 409, // stock insuficiente
  GS004: 409, // no se puede dejar la empresa sin administrador
};

// Errores comunes de Postgres / PostgREST: se responde un texto genérico
const CODIGOS_GENERICOS = {
  "23514": [400, "Algún valor no es válido."],
  "22P02": [400, "Hay un dato con formato inválido."],
  "23505": [409, "Ya existe un registro con esos datos."],
  "23503": [409, "No se puede completar: hay datos relacionados."],
  "42501": [403, "No tenés permiso para esa acción."],
  "PGRST301": [401, "Tu sesión venció. Volvé a iniciar sesión."],
  "PGRST303": [401, "Tu sesión venció. Volvé a iniciar sesión."],
};

export function responderErrorDB(res, error) {
  const propio = CODIGOS_PROPIOS[error?.code];
  if (propio) return res.status(propio).json({ error: error.message });

  const generico = CODIGOS_GENERICOS[error?.code];
  if (generico) return res.status(generico[0]).json({ error: generico[1] });

  console.error("Error de base de datos:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
}

/** Errores del servicio de cuentas de Supabase (Auth): se traducen sin mostrar detalles internos. */
export function responderErrorAuth(res, error) {
  const codigo = error?.code;
  if (codigo === "email_exists" || codigo === "user_already_exists") {
    return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
  }
  if (codigo === "weak_password") return res.status(400).json({ error: "La contraseña es demasiado débil." });
  if (codigo === "user_not_found") return res.status(404).json({ error: "No existe esa cuenta." });
  if (codigo === "email_address_invalid" || codigo === "validation_failed") {
    return res.status(400).json({ error: "El email no es válido." });
  }
  console.error("Error de cuentas de Supabase:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
}
