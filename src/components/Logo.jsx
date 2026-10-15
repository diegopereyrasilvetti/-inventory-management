export const LOGO = "/images/c0867a9a-c574-4d23-9943-410cc741d8ca.png";

/** Marca "Gestion" con la G en azul. */
export function Marca({ azul = "text-[#1a7bff]", className = "" }) {
  return (
    <span className={className}>
      <span className={azul}>G</span>estion
    </span>
  );
}
