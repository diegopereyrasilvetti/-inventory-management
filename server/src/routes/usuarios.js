import { Router } from "express";
import { z } from "zod";
import { responderErrorAuth, responderErrorDB } from "../errores.js";
import { clienteAdmin } from "../supabase.js";
import { validar } from "../validacion.js";

// Administración de personas (solo administradores: ver middleware/admin.js).
// Crear, cambiar la contraseña y eliminar cuentas usan la clave "secret" de Supabase.
export const usuariosRouter = Router();

const CAMPOS = "id,email,nombre,rol,activo,created_at";

const esquemaId = z.object({ id: z.uuid() });
const rol = z.enum(["admin", "usuario"]);
const nombre = z.string().trim().min(1).max(60);
const password = z.string().min(6).max(72); // 72: límite del algoritmo de hash que usa Supabase

const esquemaCrear = z
  .object({ email: z.email().max(120), nombre, password, rol: rol.default("usuario") })
  .strict();

const esquemaEditar = z
  .object({ nombre: nombre.optional(), rol: rol.optional(), activo: z.boolean().optional() })
  .strict()
  .refine((o) => Object.keys(o).length > 0, "No hay nada para cambiar.");

const esquemaPassword = z.object({ password }).strict();

// GET /api/admin/usuarios -> lista de personas (las reglas de la base dejan al admin ver todos los perfiles)
usuariosRouter.get("/", async (req, res) => {
  const { data, error } = await req.db.from("perfiles").select(CAMPOS).order("created_at");
  if (error) return responderErrorDB(res, error);
  res.json(data);
});

// POST /api/admin/usuarios -> crea una cuenta lista para usar (ya confirmada) con su nombre y rol
usuariosRouter.post("/", validar({ body: esquemaCrear }), async (req, res) => {
  const { email, nombre: nombreNuevo, password: clave, rol: rolNuevo } = req.datos.body;
  const admin = clienteAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: clave,
    email_confirm: true,
    user_metadata: { nombre: nombreNuevo },
  });
  if (error) return responderErrorAuth(res, error);

  // El perfil lo crea solo la base al nacer la cuenta (rol "usuario"); acá se completa con lo elegido
  const { data: perfil, error: errorPerfil } = await admin
    .from("perfiles")
    .update({ nombre: nombreNuevo, rol: rolNuevo })
    .eq("id", data.user.id)
    .select(CAMPOS)
    .single();
  if (errorPerfil) return responderErrorDB(res, errorPerfil);
  res.status(201).json(perfil);
});

// PATCH /api/admin/usuarios/:id -> cambia nombre, rol o si está activo
usuariosRouter.patch("/:id", validar({ params: esquemaId, body: esquemaEditar }), async (req, res) => {
  const { id } = req.datos.params;
  const cambios = req.datos.body;

  // Para no quedar afuera por accidente, uno no puede desactivarse ni quitarse el rol de admin a sí mismo
  if (id === req.user.id && (cambios.activo === false || (cambios.rol && cambios.rol !== "admin"))) {
    return res.status(409).json({ error: "No podés desactivarte ni quitarte el rol de administrador a vos mismo." });
  }

  // La base impide dejar la empresa sin administrador activo (error GS004)
  const { data, error } = await clienteAdmin().from("perfiles").update(cambios).eq("id", id).select(CAMPOS);
  if (error) return responderErrorDB(res, error);
  if (!data || data.length === 0) return res.status(404).json({ error: "No existe esa cuenta." });
  res.json(data[0]);
});

// POST /api/admin/usuarios/:id/password -> el admin le pone una contraseña nueva a esa persona
usuariosRouter.post("/:id/password", validar({ params: esquemaId, body: esquemaPassword }), async (req, res) => {
  const { error } = await clienteAdmin().auth.admin.updateUserById(req.datos.params.id, {
    password: req.datos.body.password,
  });
  if (error) return responderErrorAuth(res, error);
  res.status(204).end();
});

// DELETE /api/admin/usuarios/:id -> elimina la cuenta (lo que cargó la persona se conserva)
usuariosRouter.delete("/:id", validar({ params: esquemaId }), async (req, res) => {
  const { id } = req.datos.params;
  if (id === req.user.id) return res.status(409).json({ error: "No podés eliminar tu propia cuenta." });

  const admin = clienteAdmin();
  // Aviso claro antes de intentarlo (la base también lo impide si se saltara este control)
  const { data: perfil, error: errorLectura } = await admin.from("perfiles").select("rol,activo").eq("id", id).maybeSingle();
  if (errorLectura) return responderErrorDB(res, errorLectura);
  if (!perfil) return res.status(404).json({ error: "No existe esa cuenta." });
  if (perfil.rol === "admin" && perfil.activo) {
    const { count, error: errorConteo } = await admin
      .from("perfiles")
      .select("id", { count: "exact", head: true })
      .eq("rol", "admin")
      .eq("activo", true)
      .neq("id", id);
    if (errorConteo) return responderErrorDB(res, errorConteo);
    if (!count) return res.status(409).json({ error: "No se puede dejar la empresa sin un administrador activo." });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return responderErrorAuth(res, error);
  res.status(204).end();
});
