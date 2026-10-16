// Supabase devuelve los errores en inglés: se traducen los más comunes
export function traducirError(error) {
  const texto = (error?.message || "").toLowerCase();
  if (texto.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (texto.includes("already registered")) return "Ya existe una cuenta con ese email.";
  if (texto.includes("different from the old password")) return "La nueva contraseña tiene que ser distinta a la anterior.";
  if (texto.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (texto.includes("email not confirmed")) return "Confirmá tu email antes de iniciar sesión.";
  if (texto.includes("rate limit") || texto.includes("security purposes")) return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (texto.includes("supabase no está configurado")) return "Falta configurar Supabase (archivo .env).";
  return "No se pudo completar la acción. Probá de nuevo.";
}

/** Mensaje en español para errores de la base de datos (Postgres / Supabase). */
export function mensajeDeError(error) {
  const codigo = error?.code;
  const texto = (error?.message || "").toLowerCase();
  if (codigo === "23505") return "Ya existe un registro con ese código.";
  if (codigo === "23514") return "Algún valor no es válido (por ejemplo, un stock negativo).";
  if (codigo === "23503") return "No se puede completar: hay datos relacionados.";
  if (codigo === "42501" || texto.includes("jwt") || texto.includes("row-level security")) {
    return "No tenés permiso para esa acción. Probá cerrar sesión y entrar de nuevo.";
  }
  if (texto.includes("failed to fetch") || texto.includes("network")) return "No hay conexión con el servidor. Revisá tu internet.";
  if (texto.includes("supabase no está configurado")) return "Falta configurar Supabase (archivo .env).";
  return "No se pudo guardar. " + (error?.message || "Probá de nuevo.");
}
