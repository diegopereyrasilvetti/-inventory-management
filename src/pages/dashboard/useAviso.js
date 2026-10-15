import { useCallback, useEffect, useRef, useState } from "react";

/** Mensaje de estado que desaparece a los 3,5 segundos. */
export default function useAviso() {
  const [aviso, setAviso] = useState(null); // { texto, ok } | null
  const timer = useRef(null);

  const avisar = useCallback((texto, ok) => {
    setAviso({ texto, ok });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [aviso, avisar];
}
