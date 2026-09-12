import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// ⚠️ PROVISIONAL: el backend hoy solo tiene 3 roles ('administrador',
// 'bombero', 'capitan'), no los 4 que asumimos originalmente. Mientras el
// equipo no confirme si 'capitan' reemplaza a Mecánico, a Comandancia, o a
// ambos, le doy acceso a todo lo que antes veían esos dos roles combinados.
// Revisar esto apenas se resuelva con el equipo.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    path: '/',
    roles: ['administrador', 'bombero', 'capitan'],
  },
  {
    label: 'Vehículos',
    path: '/vehiculos',
    roles: ['administrador', 'bombero', 'capitan'],
  },
  {
    label: 'Mantenciones',
    path: '/mantenciones',
    roles: ['administrador', 'capitan'],
  },
  {
    label: 'Grifos',
    path: '/grifos',
    roles: ['administrador', 'capitan'],
  },
  {
    label: 'Usuarios',
    path: '/usuarios',
    roles: ['administrador'],
  },
];

export const ROLE_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  bombero: 'Bombero / Conductor',
  capitan: 'Capitán',
};
