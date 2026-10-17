import { api } from "../lib/api.js";
import { guardar } from "./db.js";
import { invalidar, useConsulta } from "./consultas.js";

const CLAVE = "usuarios";

async function pedir() {
  return api("GET", "/admin/usuarios");
}

/**
 * Personas con acceso al panel (solo para administradores). Todo pasa por la API.
 * usuarios: [{ id, email, nombre, rol: 'admin' | 'usuario', activo, created_at }]
 * Los guardados devuelven true/false y, si algo falla, el cartel rojo avisa el motivo.
 */
export function useUsuarios() {
  const { datos, cargando, error } = useConsulta(CLAVE, pedir);

  const crear = (persona) =>
    guardar(async () => {
      await api("POST", "/admin/usuarios", persona);
      invalidar(CLAVE);
    });

  const editar = (id, cambios) =>
    guardar(async () => {
      await api("PATCH", "/admin/usuarios/" + id, cambios);
      invalidar(CLAVE);
    });

  const cambiarPassword = (id, password) => guardar(() => api("POST", "/admin/usuarios/" + id + "/password", { password }));

  const eliminar = (id) =>
    guardar(async () => {
      await api("DELETE", "/admin/usuarios/" + id);
      invalidar(CLAVE);
    });

  return { usuarios: datos, cargando, error, crear, editar, cambiarPassword, eliminar };
}
