// Los mecánicos no ven despachos de emergencia (acuerdo de la reunión).
// Se compara sin tildes ni mayúsculas para tolerar "mecanico" / "Mecánico".
// [PENDIENTE DE DEFINIR]: confirmar el nombre exacto del rol en la BD.
export function esMecanico(rol: string | undefined | null): boolean {
  if (!rol) return false;
  return rol
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .includes('mecanic');
}
 