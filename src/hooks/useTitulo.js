import { useEffect } from "react";

/** Cambia el título de la pestaña mientras la página está montada. */
export default function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);
}
