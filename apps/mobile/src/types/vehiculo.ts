export enum EstadoVehiculo {
  OPERATIVO = 'operativo',
  EN_MANTENCION = 'en_mantencion',
  FUERA_DE_SERVICIO = 'fuera_de_servicio',
}

export interface Coordenadas {
  type: 'Point';
  coordinates: [number, number]; // [latitud, longitud]
}

export interface Vehiculo {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
  compania: {
    id_compania: number;
    numero_compania: number;
    nombre: string;
  };
  coordenadas: Coordenadas | null;
}