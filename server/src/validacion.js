import { z } from "zod";

// Mensajes de validación en español
z.config(z.locales.es());

/**
 * Valida el pedido ANTES de tocar la base de datos.
 * Uso: validar({ body: esquema, params: esquema })
 * Si todo está bien deja los datos limpios en req.datos.body / req.datos.params / req.datos.query.
 * Si algo está mal responde 400 con la lista de problemas.
 */
export function validar(esquemas) {
  return (req, res, next) => {
    const datos = {};
    const problemas = [];

    for (const [donde, esquema] of Object.entries(esquemas)) {
      const resultado = esquema.safeParse(req[donde]);
      if (resultado.success) {
        datos[donde] = resultado.data;
      } else {
        for (const issue of resultado.error.issues) {
          problemas.push({ campo: [donde, ...issue.path].join("."), mensaje: issue.message });
        }
      }
    }

    if (problemas.length > 0) return res.status(400).json({ error: "Datos inválidos.", detalles: problemas });
    req.datos = datos;
    next();
  };
}

/** Id numérico positivo, como llega en la dirección: /api/ventas/12 */
export const esquemaId = z.object({ id: z.coerce.number().int().positive() });
