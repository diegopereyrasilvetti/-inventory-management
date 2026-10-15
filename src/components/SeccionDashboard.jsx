/** Tarjeta contenedora que usan las secciones del dashboard (Inventario, Productos, etc.). */
export default function SeccionDashboard({ children, className = "", ...resto }) {
  return (
    <section
      className={
        "mx-auto max-w-5xl bg-(--superficie) border border-(--borde) rounded-2xl shadow-[0_8px_24px_rgba(59,42,32,0.06)] " +
        className
      }
      {...resto}
    >
      {children}
    </section>
  );
}
