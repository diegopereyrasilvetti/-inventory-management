import { Router } from "express";
import { z } from "zod";
import { responderErrorDB } from "../errores.js";
import { esquemaId, validar } from "../validacion.js";

export const productosRouter = Router();

const esquemaAjuste = z
  .object({
    // Positiva suma stock, negativa resta. No puede ser 0.
    cantidad: z
      .number()
      .int()
      .min(-1000000)
      .max(1000000)
      .refine((n) => n !== 0, "La cantidad no puede ser 0."),
    motivo: z.string().trim().max(200).optional(),
  })
  .strict();

// POST /api/productos/:id/stock -> suma o resta stock y anota el movimiento
productosRouter.post("/:id/stock", validar({ params: esquemaId, body: esquemaAjuste }), async (req, res) => {
  const { data, error } = await req.db.rpc("ajustar_stock", {
    p_producto: req.datos.params.id,
    p_cantidad: req.datos.body.cantidad,
    p_motivo: req.datos.body.motivo ?? null,
  });
  if (error) return responderErrorDB(res, error);
  res.json(data);
});
