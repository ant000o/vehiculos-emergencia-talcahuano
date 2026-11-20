import { UsuarioSesion } from '../types/auth';
import { DespachoEmergencia, EstadoEmergencia } from '../types/despacho';

// Códigos de permiso del backend (nuevo y antiguo) que permiten modificar despachos.
const PERMISOS_ACTUALIZAR = ['despachos.update', 'despacho.gestionar'];

export function puedeFinalizarDespacho(usuario: UsuarioSesion | null | undefined): boolean {
  return !!usuario?.permisos?.some((p) => PERMISOS_ACTUALIZAR.includes(p));
}

export function perteneceATripulacion(
  despacho: DespachoEmergencia,
  usuario: UsuarioSesion | null | undefined,
): boolean {
  if (!usuario) return false;
  return (despacho.tripulacion ?? []).some((t) => Number(t.id_usuario) === Number(usuario.id_usuario));
}

export const ETIQUETA_ESTADO: Record<EstadoEmergencia, string> = {
  [EstadoEmergencia.EN_CURSO]: 'EN CURSO',
  [EstadoEmergencia.CONTROLADA]: 'CONTROLADA',
  [EstadoEmergencia.FINALIZADA]: 'FINALIZADA',
  [EstadoEmergencia.CANCELADA]: 'CANCELADA',
};
