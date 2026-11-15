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
    html: `<span>${emoji}</span>`,
    className: 'emergencia-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
