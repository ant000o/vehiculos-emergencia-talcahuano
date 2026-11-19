export function esMecanico(rol: string | undefined | null): boolean {
  if (!rol) return false;
  return rol
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .includes('mecanic');
}

function normalizarRol(rol: string | undefined | null): string {
  if (!rol) return '';
  return rol
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Coincide con los @Roles del backend (mantencion.controller.ts):
// administrador, mecanico y capitan. Un bombero recibiría 403.
export function puedeGestionarMantenciones(rol: string | undefined | null): boolean {
  const r = normalizarRol(rol);
  return r.includes('administrador') || r.includes('mecanic') || r.includes('capitan');
}

// Coincide con PATCH /grifos/:id (grifo.controller.ts): administrador, capitan y mecanico.
export function puedeActualizarGrifos(rol: string | undefined | null): boolean {
  return puedeGestionarMantenciones(rol);
}