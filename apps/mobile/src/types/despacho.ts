import { Coordenadas } from './vehiculo';

export enum EstadoEmergencia {
  EN_CURSO = 'en_curso',
  CONTROLADA = 'controlada',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export enum RolEnDespacho {
  CONDUCTOR = 'conductor',
  BRIGADISTA = 'brigadista',
  JEFE_DESPACHO = 'jefe_despacho',
}

export interface TripulanteDespacho {
  id_despacho: number;
  id_usuario: number;
  rol_en_despacho: RolEnDespacho | null;
  usuario?: {
    id_usuario: number;
    nombre: string;
    apellidos: string;
  };
}

export interface DespachoEmergencia {
  id_despacho: number;
  fecha_hora_despacho: string;
  coordenada_destino: Coordenadas; // [latitud, longitud]
  tipo_emergencia: string;
  estado_emergencia: EstadoEmergencia;
  id_vehiculo: number;
  vehiculo?: {
    id_vehiculo: number;
    patente: string;
    marca: string;
    modelo: string;
  };
  id_grifo: number | null;
  grifo?: { id_grifo: number; direccion: string | null } | null;
  id_compania: number;
  compania?: { id_compania: number; numero_compania: number; nombre: string };
  tripulacion?: TripulanteDespacho[];
}