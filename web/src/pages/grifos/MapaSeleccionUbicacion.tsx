import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Fix de un bug conocido: los íconos por defecto de Leaflet se rompen con
// bundlers como Vite/Webpack porque las rutas de imagen no se resuelven
// solas. Se reemplazan manualmente por las importadas.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapaSeleccionUbicacionProps {
  lat: number;
  lng: number;
  onSeleccionar: (lat: number, lng: number) => void;
}

function CapturaClic({ onSeleccionar }: Pick<MapaSeleccionUbicacionProps, 'onSeleccionar'>) {
  useMapEvents({
    click(e) {
      onSeleccionar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapaSeleccionUbicacion({ lat, lng, onSeleccionar }: MapaSeleccionUbicacionProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ height: 320, width: '100%', borderRadius: 'var(--radius-sm)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
      <CapturaClic onSeleccionar={onSeleccionar} />
    </MapContainer>
  );
}
