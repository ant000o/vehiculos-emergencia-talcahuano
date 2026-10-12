import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';

import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { crearDespacho } from '../../services/despachos';
import { obtenerDespachosActivos, type DespachoActivo } from '../../services/estadisticas';
import { Modal } from '../../components/Modal';

// Fix icono defecto de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para siniestro / emergencia
const iconoEmergencia = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para capturar clicks en el mapa (HU-19)
function MapClickInterceptor({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function CentralMapaPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [despachosActivos, setDespachosActivos] = useState<DespachoActivo[]>([]);
  const [coordsEmergencia, setCoordsEmergencia] = useState<[number, number] | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargarDatos = () => {
    Promise.all([
      listarVehiculos(),
      obtenerDespachosActivos().catch(() => []),
    ])
      .then(([vehs, desp]) => {
        setVehiculos(vehs as unknown as Vehiculo[]);
        setDespachosActivos(desp);
      })
      .catch(console.error);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setCoordsEmergencia([lat, lng]);
    setModalAbierto(true);
  };

  const handleDespachar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordsEmergencia || !vehiculoSeleccionado) return;
    
    setIsSubmitting(true);
    try {
      await crearDespacho({
        tipo_emergencia: '10-0 (Fuego Estructural)',
        id_vehiculo: Number(vehiculoSeleccionado),
        id_grifo: 1,
        id_compania: 1,
        coordenada_destino: { type: 'Point', coordinates: coordsEmergencia },
      });
      alert('¡Despacho generado y enviado exitosamente a la unidad!');
      setModalAbierto(false);
      setCoordsEmergencia(null);
      setVehiculoSeleccionado('');
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al generar el despacho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patentesEnDespacho = new Set(despachosActivos.map((d) => d.patente));
  const vehiculosDisponibles = vehiculos.filter(
    (v) => v.estado_operativo === 'operativo' && !patentesEnDespacho.has(v.patente),
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)', margin: '0 0 var(--space-1)' }}>
            Mapa Central de Despacho y Flota
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-600)', margin: 0, fontSize: '0.9375rem' }}>
            Visualiza la ubicación en vivo de toda la flota. Haz clic sobre cualquier punto del mapa para fijar una emergencia y despachar una unidad.
          </p>
        </div>

        {/* Botón para devolverse al panel */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'var(--color-navy-900)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 18px',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'border-color 0.15s ease',
          }}
        >
          ← Volver al Panel
        </Link>
      </div>

      <div className="mapa-container">
        <MapContainer center={[-36.7196, -73.1168]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickInterceptor onMapClick={handleMapClick} />

          {/* Renderizar toda la flota activa en el mapa */}
          {vehiculos.map((v) => {
            // Si el vehículo tiene coordenadas directas, o fallback cerca de base central
            const pos: [number, number] = v.coordenadas?.coordinates
              ? [v.coordenadas.coordinates[0], v.coordenadas.coordinates[1]]
              : [-36.7196 + (v.id_vehiculo * 0.002), -73.1168 + (v.id_vehiculo * 0.002)];

            const enDespacho = patentesEnDespacho.has(v.patente);
            const estadoColor = enDespacho
              ? { bg: '#fee2e2', text: '#b91c1c', label: '🚨 En Despacho' }
              : v.estado_operativo === 'operativo' 
              ? { bg: '#DCFCE7', text: '#15803D', label: 'Operativo' }
              : v.estado_operativo === 'en_mantencion'
              ? { bg: '#FEF9C3', text: '#A16207', label: 'En Mantención' }
              : { bg: '#FEE2E2', text: '#B91C1C', label: 'Fuera de Servicio' };

            return (
              <Marker key={v.id_vehiculo} position={pos}>
                <Popup>
                  <div style={{ padding: '4px 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#0f1f38' }}>
                        {v.patente}
                      </strong>
                      <span style={{
                        backgroundColor: estadoColor.bg,
                        color: estadoColor.text,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {estadoColor.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.4 }}>
                      <div><strong>Modelo:</strong> {v.marca} {v.modelo} ({v.anio})</div>
                      <div><strong>Kilometraje:</strong> {Number(v.kilometraje).toLocaleString('es-CL')} km</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de emergencia seleccionado */}
          {coordsEmergencia && (
            <Marker position={coordsEmergencia} icon={iconoEmergencia}>
              <Popup>
                <strong>Punto de Emergencia (10-0)</strong><br />
                Coordenadas: {coordsEmergencia[0].toFixed(5)}, {coordsEmergencia[1].toFixed(5)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)} title="Nuevo Despacho de Emergencia">
          <form onSubmit={handleDespachar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontFamily: 'var(--font-body)', margin: 0, color: 'var(--color-ink-600)', fontSize: '0.9375rem' }}>
              <strong>Coordenadas seleccionadas:</strong> {coordsEmergencia?.[0].toFixed(5)}, {coordsEmergencia?.[1].toFixed(5)}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
                Asignar Vehículo Operativo
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                }}
                value={vehiculoSeleccionado}
                onChange={(e) => setVehiculoSeleccionado(Number(e.target.value))}
                required
              >
                <option value="" disabled>Selecciona un vehículo disponible...</option>
                {vehiculosDisponibles.length === 0 ? (
                  <option value="" disabled>No hay vehículos operativos disponibles actualmente</option>
                ) : (
                  vehiculosDisponibles.map((v) => (
                    <option key={v.id_vehiculo} value={v.id_vehiculo}>
                      {v.patente} — {v.marca} {v.modelo} (Disponible)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: 'pointer',
                  color: 'var(--color-ink-900)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !vehiculoSeleccionado}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-red-600)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !vehiculoSeleccionado ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Despachando...' : 'Confirmar Despacho (10-0)'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
