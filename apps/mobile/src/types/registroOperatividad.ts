export interface RegistroOperatividad {
  id_registro: number;
  fecha_hora_registro: string;
  nivel_combustible: number | null;
  nivel_agua: number | null;
  nivel_aceite: number | null;
  observaciones: string | null;
  id_usuario: number;
  usuario: {
    id_usuario: number;
    nombre: string;
    apellidos: string;
  };
  id_vehiculo: number;
  vehiculo: {
    id_vehiculo: number;
    patente: string;
  };
}

export interface CreateRegistroOperatividadPayload {
  nivel_combustible?: number;
  nivel_agua?: number;
  nivel_aceite?: number;
  observaciones?: string;
  id_usuario: number;
  id_vehiculo: number;
}