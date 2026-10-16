/** Nombre para mostrar: el que se cargó al registrarse o, si no hay, lo que está antes de la @ del email. */
export function nombreDe(user) {
  const nombre = user?.user_metadata?.nombre?.trim();
  if (nombre) return nombre;
  return (user?.email || "").split("@")[0] || "Usuario";
}

/** Primera letra en mayúscula, para el círculo del avatar. */
export function inicialDe(user) {
  return nombreDe(user).charAt(0).toUpperCase() || "U";
}
