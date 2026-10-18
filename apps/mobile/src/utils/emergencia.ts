// `tipo_emergencia` es texto libre en el backend (hasta 80 caracteres), así que
// el emoji se elige por palabra clave. Si no coincide, se usa 🚨.
// [PENDIENTE DE DEFINIR]: lista oficial de tipos de emergencia con el equipo.
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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  for (const r of REGLAS) {
    if (r.palabras.some((p) => t.includes(p))) return r.emoji;
  }
  return '🚨';
}