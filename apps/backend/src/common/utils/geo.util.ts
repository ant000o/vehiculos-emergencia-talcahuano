/**
 * Utilidad de conversión de coordenadas geográficas.
 *
 * El frontend/móvil envía coordenadas en orden [latitud, longitud]
 * (convención común en apps de mapas como Google Maps y Leaflet).
 *
 * PostGIS/GeoJSON internamente usa el estándar [longitud, latitud] (= [x, y]).
 *
 * Estas funciones hacen el intercambio automáticamente para que ningún módulo
 * tenga que recordar el orden correcto.
 */

/**
 * Convierte un GeoJSON Point enviado por el cliente ([lat, lng])
 * al formato PostGIS ([lng, lat]) antes de guardar en la BD.
 *
 * @example
 *   toPostGIS({ type: 'Point', coordinates: [-36.7196, -73.1168] })
 *   // → { type: 'Point', coordinates: [-73.1168, -36.7196] }
 */
export function toPostGIS(point: { type: string; coordinates: [number, number] }): {
  type: string;
  coordinates: [number, number];
} {
  if (!point?.coordinates) return point;
  const [lat, lng] = point.coordinates;
  return { type: 'Point', coordinates: [lng, lat] };
}

/**
 * Convierte un GeoJSON Point leído de la BD ([lng, lat])
 * al formato del cliente ([lat, lng]) antes de enviar en la respuesta.
 *
 * @example
 *   fromPostGIS({ type: 'Point', coordinates: [-73.1168, -36.7196] })
 *   // → { type: 'Point', coordinates: [-36.7196, -73.1168] }
 */
export function fromPostGIS(point: any): { type: string; coordinates: [number, number] } | null {
  if (!point?.coordinates) return null;
  const [lng, lat] = point.coordinates;
  return { type: 'Point', coordinates: [lat, lng] };
}

/**
 * Aplica fromPostGIS a un objeto completo, solo en las claves indicadas.
 * Evita repetir la conversión en cada método del servicio.
 *
 * @example
 *   transformGeoFields(grifo, ['coordenadas'])
 *   transformGeoFields(vehiculo, ['ubicacion'])
 */
export function transformGeoFields(
  entity: Record<string, any>,
  fields: string[],
): Record<string, any> {
  if (!entity) return entity;
  const result: Record<string, any> = { ...entity };
  for (const field of fields) {
    if (result[field]) {
      result[field] = fromPostGIS(result[field]);
    }
  }
  return result;
}
