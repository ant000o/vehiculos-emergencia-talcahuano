import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Mismo fix de íconos que en MapaSeleccionUbicacion (bug conocido de
// Leaflet + bundlers tipo Vite).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapaVistaUbicacionProps {
  lat: number;
  lng: number;
}

/**
 * Mapa de solo lectura: muestra dónde está un grifo, sin permitir
 * reubicarlo. Se usa en el modal "Ver ubicación" de la tabla de grifos.
 */
export function MapaVistaUbicacion({ lat, lng }: MapaVistaUbicacionProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      style={{ height: 320, width: '100%', borderRadius: 'var(--radius-sm)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}
