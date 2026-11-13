import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';

import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { crearDespacho, type DespachoEmergencia, listarDespachos } from '../../services/despachos';
import { listarUsuarios, type Usuario } from '../../services/usuarios';
import { listarGrifos, type Grifo } from '../../services/grifos';
import { Modal } from '../../components/Modal';
import { geocodificarDireccion } from '../../services/geocoding';
import { TIPOS_EMERGENCIA, emojiEmergencia, iconoEmojiEmergencia } from '../../utils/emergencia';

// Fix icono defecto de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para grifos
const iconoGrifo = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32],
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

// Mueve el mapa al punto encontrado al buscar una dirección (HU-20).
function CentrarMapa({ punto }: { punto: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (punto) map.flyTo(punto, Math.max(map.getZoom(), 16));
  }, [punto, map]);
  return null;
}

export function CentralMapaPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [todosDespachos, setTodosDespachos] = useState<DespachoEmergencia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [grifos, setGrifos] = useState<Grifo[]>([]);

  // Estado del nuevo despacho modal
  const [coordsEmergencia, setCoordsEmergencia] = useState<[number, number] | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoEmergencia, setTipoEmergencia] = useState(TIPOS_EMERGENCIA[0]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<number | ''>('');
  const [capitanSeleccionado, setCapitanSeleccionado] = useState<number | ''>('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState<number | ''>('');
  const [brigadistasSeleccionados, setBrigadistasSeleccionados] = useState<number[]>([]);
  const [grifoSeleccionado, setGrifoSeleccionado] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HU-20: dirección escrita -> coordenadas
  const [direccionTexto, setDireccionTexto] = useState('');
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState<string | null>(null);
  const [centrarEn, setCentrarEn] = useState<[number, number] | null>(null);

  const emojiTipo = emojiEmergencia(tipoEmergencia);
  const iconoPunto = useMemo(() => iconoEmojiEmergencia(emojiTipo), [emojiTipo]);

  const cargarDatos = () => {
    Promise.all([
      listarVehiculos(),
      listarDespachos().catch(() => []),
      listarUsuarios().catch(() => []),
      listarGrifos().catch(() => []),
    ])
      .then(([vehs, desp, users, grifs]) => {
        setVehiculos(vehs as unknown as Vehiculo[]);
        setTodosDespachos(desp);
        setUsuarios(users);
        setGrifos(grifs);
      })
      .catch(console.error);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // HU-20: un clic en el mapa fija (o ajusta) el punto de la emergencia.
  // Los recursos se asignan después, con el botón "Despachar recursos".
  const handleMapClick = (lat: number, lng: number) => {
    setCoordsEmergencia([lat, lng]);
  };

  const handleBuscarDireccion = async () => {
    if (!direccionTexto.trim()) {
      setErrorDireccion('Escribe una dirección para buscarla.');
      return;
    }
    setBuscandoDireccion(true);
    setErrorDireccion(null);
    try {
      const resultado = await geocodificarDireccion(direccionTexto);
      if (!resultado) {
        setErrorDireccion('No se encontró esa dirección. Revisa el texto o haz clic en el mapa para fijar el punto.');
        return;
      }
      const punto: [number, number] = [resultado.lat, resultado.lng];
      setCoordsEmergencia(punto);
      setCentrarEn(punto);
    } catch (err) {
      setErrorDireccion(err instanceof Error ? err.message : 'No se pudo buscar la dirección.');
    } finally {
      setBuscandoDireccion(false);
    }
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setVehiculoSeleccionado('');
    setCapitanSeleccionado('');
    setConductorSeleccionado('');
    setBrigadistasSeleccionados([]);
    setGrifoSeleccionado('');
  };

  // Deja el mapa listo para registrar otra emergencia.
  const limpiarEmergencia = () => {
    setCoordsEmergencia(null);
    setDireccionTexto('');
    setErrorDireccion(null);
    setCentrarEn(null);
  };

  // Despachos actualmente activos (en_curso)
  const despachosActivos = todosDespachos.filter(
    (d) => d.estado_emergencia === 'en_curso' || d.estado_emergencia === 'controlada'
  );

  const patentesEnDespacho = new Set(despachosActivos.map((d) => d.vehiculo?.patente).filter(Boolean));
  const vehiculosDisponibles = vehiculos.filter(
    (v) => v.estado_operativo === 'operativo' && !patentesEnDespacho.has(v.patente)
  );

  // Identificar qué usuarios ya están en una emergencia activa
  const idsUsuariosEnEmergencia = new Set<number>();
  despachosActivos.forEach((d) => {
    d.tripulacion?.forEach((t) => {
      idsUsuariosEnEmergencia.add(t.id_usuario);
    });
  });

  // Capitanes disponibles.
  // F5: antes se filtraba por id_rol === 2, que depende del orden en que el
  // seed crea los roles — se rompe apenas cambie ese orden o se agregue un
  // rol nuevo (ej: "Central"). Ahora se compara por nombre_rol.
  const capitanesDisponibles = usuarios.filter(
    (u) => u.estado_activo && u.rol?.nombre_rol === 'capitan' && !idsUsuariosEnEmergencia.has(u.id_usuario)
  );

  // Bomberos / Conductores disponibles.
  const bomberosDisponibles = usuarios.filter(
    (u) => u.estado_activo && u.rol?.nombre_rol === 'bombero' && !idsUsuariosEnEmergencia.has(u.id_usuario)
  );

  const toggleBrigadista = (id: number) => {
    setBrigadistasSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDespachar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordsEmergencia || !vehiculoSeleccionado) return;

    setIsSubmitting(true);
    try {
      const vehiculoObj = vehiculos.find((v) => v.id_vehiculo === Number(vehiculoSeleccionado));
      const idCompania = vehiculoObj?.id_compania || 1;

      // Armar tripulación estructurada
      const tripulacionPayload: { id_usuario: number; rol_en_despacho: string }[] = [];

      if (capitanSeleccionado) {
        tripulacionPayload.push({
          id_usuario: Number(capitanSeleccionado),
          rol_en_despacho: 'jefe_despacho',
        });
      }

      if (conductorSeleccionado) {
        tripulacionPayload.push({
          id_usuario: Number(conductorSeleccionado),
          rol_en_despacho: 'conductor',
        });
      }

      brigadistasSeleccionados.forEach((id) => {
        // Evitar duplicar si fue asignado como conductor
        if (id !== Number(conductorSeleccionado) && id !== Number(capitanSeleccionado)) {
          tripulacionPayload.push({
            id_usuario: id,
            rol_en_despacho: 'brigadista',
          });
        }
      });

      await crearDespacho({
        tipo_emergencia: tipoEmergencia,
        id_vehiculo: Number(vehiculoSeleccionado),
        id_grifo: grifoSeleccionado ? Number(grifoSeleccionado) : null,
        id_compania: idCompania,
        coordenada_destino: { type: 'Point', coordinates: coordsEmergencia },
        tripulacion: tripulacionPayload,
      });

      alert('¡Despacho formalizado y generado exitosamente! La orden de salida fue emitida.');
      handleCerrarModal();
      limpiarEmergencia();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al generar el despacho. Verifica que los datos sean válidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)', margin: '0 0 var(--space-1)' }}>
            Mapa Central de Despacho y Flota
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-600)', margin: 0, fontSize: '0.9375rem' }}>
            Busca la dirección o haz clic en el mapa para fijar el punto de la emergencia, elige su tipo y luego despacha la unidad, capitán y tripulación adecuada.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/despachos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-white)',
              backgroundColor: 'var(--color-navy-900)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            📋 Panel de Despachos
          </Link>
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
            }}
          >
            ← Volver al Inicio
          </Link>
        </div>
      </div>

      <div className="emergencia-panel">
        <div className="emergencia-panel__campo emergencia-panel__campo--direccion">
          <label htmlFor="direccion-emergencia">Dirección de la emergencia</label>
          <div className="emergencia-panel__fila">
            <input
              id="direccion-emergencia"
              type="text"
              value={direccionTexto}
              placeholder="Ej: Colón 1234"
              onChange={(e) => setDireccionTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBuscarDireccion();
                }
              }}
            />
            <button type="button" onClick={handleBuscarDireccion} disabled={buscandoDireccion}>
              {buscandoDireccion ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>

        <div className="emergencia-panel__campo">
          <label htmlFor="tipo-emergencia">Tipo de emergencia</label>
          <select
            id="tipo-emergencia"
            value={tipoEmergencia}
            onChange={(e) => setTipoEmergencia(e.target.value)}
          >
            {TIPOS_EMERGENCIA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {emojiEmergencia(tipo)} {tipo}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="emergencia-panel__despachar"
          disabled={!coordsEmergencia}
          onClick={() => setModalAbierto(true)}
        >
          Despachar recursos →
        </button>

        {errorDireccion && (
          <p className="emergencia-panel__mensaje emergencia-panel__mensaje--error" role="alert">{errorDireccion}</p>
        )}
        {coordsEmergencia && !errorDireccion && (
          <p className="emergencia-panel__mensaje">
            {emojiTipo} Punto fijado: {coordsEmergencia[0].toFixed(5)}, {coordsEmergencia[1].toFixed(5)}. Puedes ajustarlo haciendo clic en otro lugar del mapa.
          </p>
        )}
      </div>

      <div className="mapa-container">
        <MapContainer center={[-36.7196, -73.1168]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickInterceptor onMapClick={handleMapClick} />
          <CentrarMapa punto={centrarEn} />

          {/* Renderizar toda la flota en el mapa */}
          {vehiculos.map((v) => {
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
              <Marker key={`veh-${v.id_vehiculo}`} position={pos}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: '1rem', color: '#111827' }}>{v.patente}</strong>
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

          {/* Grifos en el mapa para cruce de recursos */}
          {grifos.map((g) => {
            if (!g.coordenadas?.coordinates) return null;
            const posGrifo: [number, number] = [g.coordenadas.coordinates[0], g.coordenadas.coordinates[1]];
            return (
              <Marker key={`grifo-${g.id_grifo}`} position={posGrifo} icon={iconoGrifo}>
                <Popup>
                  <div style={{ minWidth: 150 }}>
                    <strong>🚰 Grifo #{g.id_grifo}</strong>
                    <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 4 }}>
                      <div><strong>Dirección:</strong> {g.direccion || 'Sin dirección registrada'}</div>
                      <div><strong>Estado:</strong> {g.estado_operativo}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de la emergencia, con el emoji de su tipo (HU-20) */}
          {coordsEmergencia && (
            <Marker position={coordsEmergencia} icon={iconoPunto}>
              <Popup>
                <strong>{emojiTipo} {tipoEmergencia}</strong><br />
                {direccionTexto.trim() && <>{direccionTexto.trim()}<br /></>}
                Coordenadas: {coordsEmergencia[0].toFixed(5)}, {coordsEmergencia[1].toFixed(5)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Modal de Despacho Completo */}
      {modalAbierto && (
        <Modal onClose={handleCerrarModal} title="Despachar Emergencia (Orden de Salida)">
          <form onSubmit={handleDespachar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: 'var(--color-ink-700)' }}>
              {emojiTipo} <strong>{tipoEmergencia}</strong><br />
              📍 {direccionTexto.trim() ? `${direccionTexto.trim()} — ` : ''}{coordsEmergencia?.[0].toFixed(5)}, {coordsEmergencia?.[1].toFixed(5)}
            </div>

            {/* Asignar Vehículo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-900)' }}>
                Asignar Vehículo Operativo Disponible *
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                }}
                value={vehiculoSeleccionado}
                onChange={(e) => setVehiculoSeleccionado(Number(e.target.value))}
                required
              >
                <option value="" disabled>Selecciona una unidad operativa...</option>
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

            {/* Asignar Capitán / Jefe de Despacho */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-900)' }}>
                Asignar Capitán / Oficial a Cargo
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                }}
                value={capitanSeleccionado}
                onChange={(e) => setCapitanSeleccionado(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Sin capitán asignado (u oficial en ruta)</option>
                {capitanesDisponibles.map((c) => (
                  <option key={c.id_usuario} value={c.id_usuario}>
                    Cap. {c.nombre} {c.apellidos} (Disponible)
                  </option>
                ))}
              </select>
            </div>

            {/* Asignar Conductor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-900)' }}>
                Conductor de la Unidad
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                }}
                value={conductorSeleccionado}
                onChange={(e) => setConductorSeleccionado(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Selecciona conductor...</option>
                {bomberosDisponibles.map((b) => (
                  <option key={b.id_usuario} value={b.id_usuario}>
                    {b.nombre} {b.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignar Brigadistas / Bomberos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-900)' }}>
                Tripulación / Brigadistas de Apoyo
              </label>
              {bomberosDisponibles.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-500)', fontStyle: 'italic' }}>
                  No hay bomberos adicionales disponibles.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', padding: '6px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                  {bomberosDisponibles
                    .filter((b) => b.id_usuario !== Number(conductorSeleccionado))
                    .map((b) => {
                      const isSelected = brigadistasSeleccionados.includes(b.id_usuario);
                      return (
                        <button
                          type="button"
                          key={b.id_usuario}
                          onClick={() => toggleBrigadista(b.id_usuario)}
                          style={{
                            fontSize: '0.8125rem',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            border: `1px solid ${isSelected ? '#15803d' : 'var(--color-border)'}`,
                            backgroundColor: isSelected ? '#dcfce7' : '#ffffff',
                            color: isSelected ? '#15803d' : 'var(--color-ink-800)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isSelected ? '✓' : '+'} {b.nombre} {b.apellidos}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Grifo de apoyo (opcional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-900)' }}>
                Grifo Cercano de Abastecimiento (Opcional)
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                }}
                value={grifoSeleccionado}
                onChange={(e) => setGrifoSeleccionado(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Sin grifo asignado inicialmente</option>
                {grifos
                  .filter((g) => g.estado_operativo === 'operativo')
                  .map((g) => (
                    <option key={g.id_grifo} value={g.id_grifo}>
                      Grifo #{g.id_grifo} — {g.direccion || 'Ubicación registrada'}
                    </option>
                  ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={handleCerrarModal}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
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
                  fontSize: '0.875rem',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-red-600)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !vehiculoSeleccionado ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Emitiendo Orden...' : 'Confirmar Orden de Salida'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
