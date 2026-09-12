// Enums espejo de los ENUM definidos en Postgres.
// Los valores (strings) deben coincidir EXACTAMENTE con los del script SQL.

export enum EstadoVehiculo {
  OPERATIVO = 'operativo',
  EN_MANTENCION = 'en_mantencion',
  FUERA_DE_SERVICIO = 'fuera_de_servicio',
}

export enum EstadoGrifo {
  OPERATIVO = 'operativo',
  EN_MANTENCION = 'en_mantencion',
  FUERA_DE_SERVICIO = 'fuera_de_servicio',
}

export enum EstadoMantencion {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export enum EstadoEmergencia {
  EN_CURSO = 'en_curso',
  CONTROLADA = 'controlada',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}
