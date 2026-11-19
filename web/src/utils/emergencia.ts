import L from 'leaflet';

/**
 * Tipos de emergencia disponibles al registrar un despacho (HU-20).
 * El texto se guarda tal cual en `tipo_emergencia` (campo libre en el backend).
 */
export const TIPOS_EMERGENCIA = [
  '10-0 (Incendio Estructural)',
  '10-1 (Incendio de Vehículo)',
  '10-2 (Pastizal / Forestal)',
  '10-3 (Rescate Vehicular / Accidente)',
  '10-4 (Rescate de Personas)',
  '10-5 (Materiales Peligrosos / HazMat)',
  '10-6 (Fuga de Gas)',
  '10-7 (Eléctrico / Transformador)',
  '10-8 (Derrumbe o Estructura Colapsada)',
];

// Mismas reglas por palabra clave que usa la app móvil (utils/emergencia.ts),
// para que un mismo tipo muestre el mismo emoji en web y móvil.
const REGLAS: { emoji: string; palabras: string[] }[] = [
  { emoji: '🔥', palabras: ['incendio', 'fuego', 'forestal', 'humo', 'estructural'] },
  { emoji: '💥', palabras: ['choque', 'colision', 'accidente', 'volcamiento', 'atropello'] },
  { emoji: '☣️', palabras: ['materiales peligrosos', 'hazmat', 'derrame', 'quimico', 'fuga', 'gas'] },
  { emoji: '🌊', palabras: ['inundacion', 'anegamiento', 'tsunami', 'temporal'] },
  { emoji: '⚡', palabras: ['electric', 'cable', 'corto'] },
  { emoji: '🆘', palabras: ['rescate', 'atrapado', 'derrumbe'] },
  { emoji: '🚑', palabras: ['medica', 'paramedic', 'salud', 'paciente'] },
];

export function emojiEmergencia(tipo: string | undefined | null): string {
  const t = (tipo ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  for (const r of REGLAS) {
    if (r.palabras.some((p) => t.includes(p))) return r.emoji;
  }
  return '🚨';
}

/** Marcador de Leaflet que muestra el emoji del tipo de emergencia. */
export function iconoEmojiEmergencia(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:32px;line-height:36px;display:block;text-align:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.55));cursor:pointer;">${emoji}</span>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

/**
 * Normaliza cualquier formato de coordenadas ([lat, lng], [lng, lat], GeoJSON Point)
 * para asegurar siempre el orden [latitud, longitud] en Leaflet dentro de Chile/Talcahuano.
 *
 * En Talcahuano / Región del Biobío:
 * - Latitud está en el rango ~ -36° a -37°
 * - Longitud está en el rango ~ -73° a -74°
 *
 * Si las coordenadas vienen invertidas ([lng, lat]), esta función las intercambia
 * automáticamente para evitar que los vehículos o grifos se ubiquen en el océano.
 */
export function normalizarCoordenadas(coords: any): [number, number] | null {
  if (!coords) return null;
  const par = Array.isArray(coords) ? coords : coords?.coordinates;
  if (!par || par.length < 2) return null;
  const c0 = Number(par[0]);
  const c1 = Number(par[1]);
  if (!Number.isFinite(c0) || !Number.isFinite(c1)) return null;

  // Si c0 es longitud (magnitud > 50, típicamente -73.x) y c1 es latitud (~ -36.x)
  if (Math.abs(c0) > 50 && Math.abs(c1) < 50) {
    return [c1, c0];
  }
  // Si c0 es latitud (~ -36.x) y c1 es longitud (~ -73.x)
  if (Math.abs(c0) < 50 && Math.abs(c1) > 50) {
    return [c0, c1];
  }
  return [c0, c1];
}
