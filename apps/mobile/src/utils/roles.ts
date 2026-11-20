// Reglas de rol de la app móvil, según la matriz de permisos definida por el equipo
// (Inicio, Dashboard, Despachos, Grifos, Historial de Estado, Inventario,
//  Mantenciones, Mapa, Usuarios y Vehículos).
// Los nombres de rol se comparan sin tildes ni mayúsculas.

function normalizarRol(rol: string | undefined | null): string {
  if (!rol) return '';
  return rol
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function esUno(rol: string | undefined | null, ...nombres: string[]): boolean {
  const r = normalizarRol(rol);
  return nombres.some((n) => r.includes(n));
}

export function esMecanico(rol: string | undefined | null): boolean {
  return esUno(rol, 'mecanic');
}

// Mantenciones: ven administrador, comandante, director, capitán y mecánico.
// (Central y bombero no tienen acceso.)
export function puedeVerMantenciones(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'comandante', 'director', 'capitan', 'mecanic');
}

// Mantenciones: crean/editan administrador, capitán y mecánico.
// Comandante y director solo visualizan.
export function puedeGestionarMantenciones(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'capitan', 'mecanic');
}

// Grifos (solo móvil): administran administrador, capitán y bombero.
// El mecánico no tiene acceso al módulo de grifos.
export function puedeActualizarGrifos(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'capitan', 'bombero');
}

// Historial de estado / revisiones: registran administrador, capitán y mecánico.
export function puedeRegistrarRevision(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'capitan', 'mecanic');
}

// Inventario: lo ven administrador, comandante, director, capitán y mecánico.
// (Central y bombero no.)
export function puedeVerInventario(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'comandante', 'director', 'capitan', 'mecanic');
}

// Usuarios / Personal: lo ven administrador, comandante, director y capitán.
// (Director y capitán solo de su compañía; central, bombero y mecánico no.)
export function puedeVerPersonal(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'comandante', 'director', 'capitan');
}

// Usuarios / Personal: crean y editan administrador y comandante.
export function puedeEditarPersonal(rol: string | undefined | null): boolean {
  return esUno(rol, 'administrador', 'comandante');
}