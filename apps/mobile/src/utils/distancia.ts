// Distancia aproximada en metros entre dos puntos [lat, lng], usando la
// fórmula de Haversine. Suficiente precisión para ordenar una lista por
// cercanía -- no se usa para navegación turn-by-turn.
export function distanciaEnMetros(
  origen: [number, number],
  destino: [number, number],
): number {
  const [lat1, lng1] = origen;
  const [lat2, lng2] = destino;
  const R = 6371000; // radio de la Tierra en metros

  const rad = (grados: number) => (grados * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}
