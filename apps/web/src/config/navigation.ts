import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// Roles reales confirmados en la BD: administrador, bombero, capitan (=
// Comandancia/Oficial a Cargo), mecanico.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    path: '/',
    roles: ['administrador', 'bombero', 'capitan', 'mecanico'],
  },
  {
    label: 'Vehículos',
    path: '/vehiculos',
    roles: ['administrador', 'bombero', 'capitan', 'mecanico'],
  },
  {
    label: 'Registrar Estado',
    path: '/registrar-estado',
    // Admin puede ver y hacer todo lo que ve un bombero, capitán o mecánico
    // desde la web (HU actualizada en clase: solo admin/capitán/mecánico
    // usan computador, los bomberos operan desde la app).
    roles: ['administrador', 'bombero'],
  },
  {
    label: 'Historial de Estados',
    path: '/historial-estados',
    roles: ['administrador', 'mecanico'],
  },
  {
    label: 'Mantenciones',
    path: '/mantenciones',
    roles: ['administrador', 'mecanico'],
  },
  {
    label: 'Grifos',
    path: '/grifos',
    roles: ['administrador', 'capitan', 'mecanico', 'bombero'],
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
  capitan: 'Capitán / Comandancia',
  mecanico: 'Mecánico',
};
