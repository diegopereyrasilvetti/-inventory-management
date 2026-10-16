/**
 * Ícono de Font Awesome que SÍ se actualiza cuando cambia.
 *
 * Font Awesome reemplaza cada <i> por un dibujo (SVG) cuando carga. Si después React solo cambia
 * la clase del <i>, el dibujo no se entera y queda el ícono viejo. Con "key", cuando cambia la
 * clase React crea un <i> nuevo y Font Awesome lo vuelve a dibujar.
 *
 * Usalo para íconos que cambian según un estado (ojo/ojo tachado, hamburguesa/X...).
 * Los íconos fijos pueden seguir siendo <i className="fa-solid ..."></i>.
 */
export default function Icono({ clase, ...resto }) {
  return <i key={clase} className={clase} {...resto}></i>;
}
