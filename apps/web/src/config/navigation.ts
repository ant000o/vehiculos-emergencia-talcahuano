import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// Un solo lugar para decidir qué ve cada rol. Agregar una vista nueva al
// menú es agregar una línea acá — el layout no necesita tocarse.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    path: '/',
    roles: ['administrador', 'mecanico', 'comandancia', 'bombero'],
  },
  {
    label: 'Vehículos',
    path: '/vehiculos',
    roles: ['administrador', 'mecanico', 'comandancia', 'bombero'],
  },
  {
    label: 'Mantenciones',
    path: '/mantenciones',
    roles: ['administrador', 'mecanico'],
  },
  {
    label: 'Grifos',
    path: '/grifos',
    roles: ['administrador', 'mecanico', 'comandancia'],
  },
  {
    label: 'Usuarios',
    path: '/usuarios',
    roles: ['administrador'],
  },
];

export const ROLE_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  mecanico: 'Mecánico',
  comandancia: 'Comandancia',
  bombero: 'Bombero / Conductor',
};
