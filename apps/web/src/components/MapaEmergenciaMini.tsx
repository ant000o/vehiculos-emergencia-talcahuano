import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { emojiEmergencia, iconoEmojiEmergencia } from '../utils/emergencia';

interface MapaEmergenciaMiniProps {
  lat: number;
  lng: number;
  tipoEmergencia: string;
  altura?: number;
}

/**
 * Mapa pequeño y de solo lectura que muestra dónde es la emergencia, con el
 * emoji de su tipo (HU-28). No se puede mover ni hacer zoom: es solo para
 * ubicarse de un vistazo dentro de la tarjeta.
 */
export function MapaEmergenciaMini({ lat, lng, tipoEmergencia, altura = 150 }: MapaEmergenciaMiniProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: altura, width: '100%' }}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={iconoEmojiEmergencia(emojiEmergencia(tipoEmergencia))} interactive={false} />
    </MapContainer>
  );
}
