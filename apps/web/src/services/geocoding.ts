/**
 * Conversión de una dirección escrita a coordenadas (HU-20), usando el
 * buscador público de OpenStreetMap (Nominatim). Su política de uso pide
 * no más de 1 consulta por segundo y no usarlo para autocompletar, por eso
 * solo se consulta cuando el usuario presiona "Buscar".
 */

export interface ResultadoGeocodificacion {
  lat: number;
  lng: number;
  direccion: string;
}

// Zona de Talcahuano / Gran Concepción: sirve para priorizar resultados de
// la zona (no los restringe).
const VIEWBOX = '-73.30,-36.50,-72.90,-36.90';

async function consultar(texto: string): Promise<ResultadoGeocodificacion | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'cl',
    'accept-language': 'es',
    viewbox: VIEWBOX,
    q: texto,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error('El servicio de búsqueda de direcciones no respondió. Intenta de nuevo o fija el punto en el mapa.');
    }
    const datos: { lat: string; lon: string; display_name: string }[] = await response.json();
    if (datos.length === 0) return null;
    return { lat: Number(datos[0].lat), lng: Number(datos[0].lon), direccion: datos[0].display_name };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La búsqueda de la dirección tardó demasiado. Intenta de nuevo o fija el punto en el mapa.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** Devuelve null si no se encontró la dirección. */
export async function geocodificarDireccion(texto: string): Promise<ResultadoGeocodificacion | null> {
  const limpio = texto.trim();
  if (!limpio) return null;
  // Se asume Talcahuano salvo que el usuario ya haya indicado otra comuna.
  const conComuna = /talcahuano|hualp[eé]n|concepci[oó]n|penco|tom[eé]|san pedro/i.test(limpio)
    ? limpio
    : `${limpio}, Talcahuano`;
  return (await consultar(conComuna)) ?? (conComuna !== limpio ? consultar(limpio) : null);
}

/**
 * Geocodificación inversa: convierte coordenadas [lat, lng] a dirección legible
 * al pinchar en el mapa de despacho.
 */
export async function geocodificarCoordenadas(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    'accept-language': 'es',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const datos = await response.json();
    if (!datos) return null;

    if (datos.address) {
      const calle = datos.address.road || datos.address.pedestrian || datos.address.street || datos.name;
      const numero = datos.address.house_number;
      const sector = datos.address.neighbourhood || datos.address.suburb || datos.address.quarter;
      const ciudad = datos.address.city || datos.address.town || 'Talcahuano';

      if (calle) {
        let direccion = calle;
        if (numero) direccion += ` ${numero}`;
        if (sector) direccion += `, ${sector}`;
        if (ciudad && !sector?.toLowerCase().includes(ciudad.toLowerCase())) direccion += `, ${ciudad}`;
        return direccion;
      }
    }

    if (datos.display_name) {
      const partes = datos.display_name.split(',');
      return partes.slice(0, 3).join(',').trim();
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
