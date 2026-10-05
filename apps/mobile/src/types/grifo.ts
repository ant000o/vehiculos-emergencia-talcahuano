import { Coordenadas } from './vehiculo';

export enum EstadoGrifo {
  OPERATIVO = 'operativo',
  EN_MANTENCION = 'en_mantencion',
  FUERA_DE_SERVICIO = 'fuera_de_servicio',
}

export interface Grifo {
  id_grifo: number;
  coordenadas: Coordenadas;
  direccion: string | null;
  estado_operativo: EstadoGrifo;
  ultima_revision: string | null;
  id_compania: number;
  compania: {
    id_compania: number;
    numero_compania: number;
    nombre: string;
  };
}

export interface UpdateEstadoGrifoPayload {
  estado_operativo: EstadoGrifo;
  ultima_revision: string;
}
