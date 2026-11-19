import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';

import { listarVehiculos, listarCompanias, type Vehiculo, type CompaniaOption } from '../../services/vehiculos';
import { crearDespacho, type DespachoEmergencia, listarDespachos } from '../../services/despachos';
import { listarUsuarios, type Usuario } from '../../services/usuarios';
import { listarGrifos, type Grifo } from '../../services/grifos';
import { Modal } from '../../components/Modal';
import { geocodificarDireccion, geocodificarCoordenadas } from '../../services/geocoding';
import { TIPOS_EMERGENCIA, emojiEmergencia, iconoEmojiEmergencia, normalizarCoordenadas } from '../../utils/emergencia';
import { useAuth } from '../../context/useAuth';

function coordenadasDespacho(d: DespachoEmergencia): [number, number] | null {
  return normalizarCoordenadas(d.coordenada_destino);
}

/** Distancia Haversine en kilómetros entre dos puntos [lat, lng]. */
function calcularDistanciaKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Fix icono defecto de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono emoji para grifos 🚰
const iconoGrifo = L.divIcon({
  html: `<span style="font-size:26px;line-height:30px;display:block;text-align:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.45))">🚰</span>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Icono emoji para vehículos según estado 🚒
function iconoVehiculo(estadoOperativo: string, enDespacho: boolean): L.DivIcon {
  const emoji = enDespacho
    ? '🚨'
    : estadoOperativo === 'operativo'
    ? '🚒'
    : estadoOperativo === 'en_mantencion'
    ? '🔧'
    : '🚒';
  return L.divIcon({
    html: `<span style="font-size:28px;line-height:32px;display:block;text-align:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))">${emoji}</span>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Componente para capturar clicks en el mapa (HU-19)
function MapClickInterceptor({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const originalTarget = e.originalEvent?.target as HTMLElement | null;
      if (
        originalTarget &&
        (originalTarget.closest('.leaflet-popup') ||
          originalTarget.closest('button') ||
          originalTarget.closest('.leaflet-control') ||
          originalTarget.closest('.leaflet-marker-icon'))
      ) {
        return;
      }
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
  const { user, hasPermission } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const puedeDespachar =
    hasPermission('despachos', 'create') ||
    hasPermission('mapa', 'create') ||
    esAdmin;

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
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
  const isUpdatingCoordsRef = useRef(false);
  const isClearingRef = useRef(false);

  const [actualizando, setActualizando] = useState(false);

  const emojiTipo = emojiEmergencia(tipoEmergencia);
  const iconoPunto = useMemo(() => iconoEmojiEmergencia(emojiTipo), [emojiTipo]);

  const cargarDatos = () => {
    setActualizando(true);
    Promise.all([
      listarVehiculos(),
      listarCompanias().catch(() => []),
      listarDespachos().catch(() => []),
      listarUsuarios().catch(() => []),
      listarGrifos().catch(() => []),
    ])
      .then(([vehs, comps, desp, users, grifs]) => {
        setVehiculos(vehs as unknown as Vehiculo[]);
        setCompanias(comps);
        setTodosDespachos(desp);
        setUsuarios(users);
        setGrifos(grifs);
      })
      .catch(console.error)
      .finally(() => {
        setActualizando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // HU-20: un clic en el mapa fija el punto y rellena automáticamente la dirección.
  const handleMapClick = async (lat: number, lng: number) => {
    if (!puedeDespachar) return;
    if (isClearingRef.current) return;
    isUpdatingCoordsRef.current = true;
    setCoordsEmergencia([lat, lng]);
    setTimeout(() => {
      isUpdatingCoordsRef.current = false;
    }, 200);

    setBuscandoDireccion(true);
    setErrorDireccion(null);
    try {
      const direccionDetectada = await geocodificarCoordenadas(lat, lng);
      if (direccionDetectada) {
        setDireccionTexto(direccionDetectada);
      }
    } catch {
      // Si falla geocodificación inversa, mantiene el valor previo
    } finally {
      setBuscandoDireccion(false);
    }
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
      isUpdatingCoordsRef.current = true;
      setCoordsEmergencia(punto);
      setCentrarEn(punto);
      setTimeout(() => {
        isUpdatingCoordsRef.current = false;
      }, 200);
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
    limpiarEmergencia();
  };

  const limpiarEmergencia = () => {
    isClearingRef.current = true;
    setCoordsEmergencia(null);
    setDireccionTexto('');
    setErrorDireccion(null);
    setCentrarEn(null);
    setTimeout(() => {
      isClearingRef.current = false;
    }, 400);
  };

  // Despachos actualmente activos (en_curso o controlada)
  const despachosActivos = todosDespachos.filter(
    (d) => d.estado_emergencia === 'en_curso' || d.estado_emergencia === 'controlada',
  );

  const patentesEnDespacho = new Set(despachosActivos.map((d) => d.vehiculo?.patente).filter(Boolean));

  // Coordenada efectiva de un vehículo (su coordenada GPS o fallback de cuartel)
  const obtenerCoordsVehiculo = (v: Vehiculo): [number, number] => {
    const coordsNorm = normalizarCoordenadas(v.coordenadas);
    if (coordsNorm) return coordsNorm;
    return [
      -36.7247 - ((v.id_vehiculo % 5) * 0.003),
      -73.1126 - (Math.floor(v.id_vehiculo / 5) * 0.003),
    ];
  };

  // Vehículos disponibles ordenados por cercanía al punto del clic
  const vehiculosRecomendados = useMemo(() => {
    const disponibles = vehiculos.filter(
      (v) => v.estado_operativo === 'operativo' && !patentesEnDespacho.has(v.patente),
    );
    return disponibles
      .map((v) => {
        const pos = obtenerCoordsVehiculo(v);
        const distanciaKm = coordsEmergencia ? calcularDistanciaKm(coordsEmergencia, pos) : null;
        const nombreCompania =
          companias.find((c) => c.id_compania === v.id_compania)?.nombre ||
          (v.id_compania ? `Cía. #${v.id_compania}` : 'Sin compañía');
        return { vehiculo: v, distanciaKm, nombreCompania };
      })
      .sort((a, b) => {
        if (a.distanciaKm !== null && b.distanciaKm !== null) {
          return a.distanciaKm - b.distanciaKm;
        }
        return 0;
      });
  }, [vehiculos, patentesEnDespacho, coordsEmergencia, companias]);

  // Grifos operativos ordenados por cercanía al punto del clic
  const grifosRecomendados = useMemo(() => {
    const operativos = grifos.filter((g) => g.estado_operativo === 'operativo');
    return operativos
      .map((g) => {
        const pos = normalizarCoordenadas(g.coordenadas);
        const distanciaKm =
          coordsEmergencia && pos ? calcularDistanciaKm(coordsEmergencia, pos) : null;
        return { grifo: g, distanciaKm };
      })
      .sort((a, b) => {
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        if (a.distanciaKm !== null) return -1;
        if (b.distanciaKm !== null) return 1;
        return 0;
      });
  }, [grifos, coordsEmergencia]);

  // Identificar qué usuarios ya están en una emergencia activa
  const idsUsuariosEnEmergencia = useMemo(() => {
    const set = new Set<number>();
    despachosActivos.forEach((d) => {
      d.tripulacion?.forEach((t) => {
        set.add(t.id_usuario);
      });
    });
    return set;
  }, [despachosActivos]);

  // Distancia estimada de un usuario según la ubicación de su compañía (o vehículo asignado a su compañía)
  const obtenerDistanciaUsuarioKm = (u: Usuario): number | null => {
    if (!coordsEmergencia || !u.id_compania) return null;
    const carroDeSuCia = vehiculos.find((v) => v.id_compania === u.id_compania);
    if (!carroDeSuCia) return null;
    return calcularDistanciaKm(coordsEmergencia, obtenerCoordsVehiculo(carroDeSuCia));
  };

  // Compañía objetivo: la del vehículo seleccionado en el modal, o la del vehículo más cercano
  const companiaObjetivoId = useMemo(() => {
    if (vehiculoSeleccionado) {
      const vObj = vehiculos.find((v) => v.id_vehiculo === Number(vehiculoSeleccionado));
      return vObj?.id_compania ?? null;
    }
    return vehiculosRecomendados[0]?.vehiculo.id_compania ?? null;
  }, [vehiculoSeleccionado, vehiculos, vehiculosRecomendados]);

  // Solo Capitanes activos disponibles como Oficial a Cargo (excluye Comandante, Director, etc.)
  const capitanesDisponibles = useMemo(() => {
    return usuarios
      .filter((u) => {
        const rolStr = (u.rol?.nombre_rol || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return (
          u.estado_activo &&
          rolStr === 'capitan' &&
          !idsUsuariosEnEmergencia.has(u.id_usuario)
        );
      })
      .map((u) => ({
        usuario: u,
        distanciaKm: obtenerDistanciaUsuarioKm(u),
        mismaCompania: companiaObjetivoId !== null && u.id_compania === companiaObjetivoId,
      }))
      .sort((a, b) => {
        if (a.mismaCompania !== b.mismaCompania) return a.mismaCompania ? -1 : 1;
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        return 0;
      });
  }, [usuarios, idsUsuariosEnEmergencia, companiaObjetivoId, coordsEmergencia, vehiculos]);

  // Solo Bomberos activos disponibles como Conductor / Brigadista (excluye Mecánico, Comandante, Director)
  const bomberosDisponibles = useMemo(() => {
    return usuarios
      .filter((u) => {
        const rolStr = (u.rol?.nombre_rol || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return (
          u.estado_activo &&
          rolStr === 'bombero' &&
          !idsUsuariosEnEmergencia.has(u.id_usuario)
        );
      })
      .map((u) => ({
        usuario: u,
        distanciaKm: obtenerDistanciaUsuarioKm(u),
        mismaCompania: companiaObjetivoId !== null && u.id_compania === companiaObjetivoId,
      }))
      .sort((a, b) => {
        if (a.mismaCompania !== b.mismaCompania) return a.mismaCompania ? -1 : 1;
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        return 0;
      });
  }, [usuarios, idsUsuariosEnEmergencia, companiaObjetivoId, coordsEmergencia, vehiculos]);

  // Abrir modal preseleccionando automáticamente los recursos más cercanos al clic
  const handleAbrirModalConRecomendados = (idVehiculoPreferido?: number) => {
    const vehiculoElegido =
      idVehiculoPreferido ?? vehiculosRecomendados[0]?.vehiculo.id_vehiculo ?? '';
    setVehiculoSeleccionado(vehiculoElegido);

    const vObj = vehiculos.find((v) => v.id_vehiculo === Number(vehiculoElegido));
    const ciaId = vObj?.id_compania ?? null;

    // Capitán más cercano (priorizando la compañía del vehículo)
    const capRecomendado =
      capitanesDisponibles.find((c) => ciaId !== null && c.usuario.id_compania === ciaId) ??
      capitanesDisponibles[0];
    setCapitanSeleccionado(capRecomendado ? capRecomendado.usuario.id_usuario : '');

    // Conductor más cercano (priorizando la compañía del vehículo)
    const personalCia = bomberosDisponibles.filter(
      (b) => ciaId !== null && b.usuario.id_compania === ciaId,
    );
    const poolPersonal = personalCia.length > 0 ? personalCia : bomberosDisponibles;

    const condRecomendado = poolPersonal[0];
    setConductorSeleccionado(condRecomendado ? condRecomendado.usuario.id_usuario : '');

    // Hasta 3 brigadistas más cercanos de apoyo
    const brigadistasSugeridos = poolPersonal
      .filter((b) => b.usuario.id_usuario !== condRecomendado?.usuario.id_usuario)
      .slice(0, 3)
      .map((b) => b.usuario.id_usuario);
    setBrigadistasSeleccionados(brigadistasSugeridos);

    // Grifo operativo más cercano
    const grifoCercano = grifosRecomendados[0];
    setGrifoSeleccionado(grifoCercano ? grifoCercano.grifo.id_grifo : '');

    setModalAbierto(true);
  };

  const toggleBrigadista = (id: number) => {
    setBrigadistasSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleDespachar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordsEmergencia || !vehiculoSeleccionado) return;

    setIsSubmitting(true);
    try {
      const vehiculoObj = vehiculos.find((v) => v.id_vehiculo === Number(vehiculoSeleccionado));
      const idCompania = vehiculoObj?.id_compania || 1;

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
    <div className="central-mapa-page" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-navy-900)',
              margin: '0 0 var(--space-1)',
            }}
          >
            Mapa Central de Despacho y Flota
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-ink-600)',
              margin: 0,
              fontSize: '0.9375rem',
            }}
          >
            Busca la dirección o haz clic en el mapa para fijar el punto de la emergencia y recibir recomendación automática de carros, personal y grifos más cercanos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={cargarDatos}
            disabled={actualizando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-navy-900)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              cursor: actualizando ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {actualizando ? '⏳ Actualizando…' : '🔄 Actualizar'}
          </button>
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
            Volver al Inicio
          </Link>
        </div>
      </div>

      {puedeDespachar ? (
        <div className="emergencia-panel">
          <div className="emergencia-panel__campo emergencia-panel__campo--direccion">
            <label htmlFor="direccion-emergencia">Dirección de la emergencia</label>
            <div className="emergencia-panel__fila">
              <input
                id="direccion-emergencia"
                type="text"
                value={direccionTexto}
                placeholder={
                  buscandoDireccion
                    ? 'Obteniendo dirección del mapa…'
                    : 'Ej: Colón 1234 (o haz clic en el mapa)'
                }
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
            onClick={() => handleAbrirModalConRecomendados()}
          >
            Despachar recursos
          </button>

          {errorDireccion && (
            <p className="emergencia-panel__mensaje emergencia-panel__mensaje--error" role="alert">
              {errorDireccion}
            </p>
          )}

          {coordsEmergencia && !errorDireccion && (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-800)' }}>
                  {emojiTipo} <strong>Punto fijado:</strong> {coordsEmergencia[0].toFixed(5)},{' '}
                  {coordsEmergencia[1].toFixed(5)} —{' '}
                  <span style={{ color: '#0369a1', fontWeight: 600 }}>
                    Recursos ordenados por cercanía al punto
                  </span>
                </span>
                <button
                  type="button"
                  onClick={limpiarEmergencia}
                  style={{
                    background: 'rgba(0, 0, 0, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-ink-700)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  title="Quitar punto marcado (✕)"
                  aria-label="Quitar punto marcado"
                >
                  ✕
                </button>
              </div>

              {/* Tarjetas de recomendación rápida según el clic */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '10px',
                }}
              >
                {/* Carros más cercanos */}
                <div
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-navy-900)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    🚒 Carros más cercanos
                  </div>
                  {vehiculosRecomendados.length === 0 ? (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-500)' }}>
                      Sin carros disponibles
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {vehiculosRecomendados.slice(0, 2).map((item, idx) => (
                        <div
                          key={item.vehiculo.id_vehiculo}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8125rem',
                            gap: '6px',
                          }}
                        >
                          <span>
                            <strong>
                              {item.vehiculo.nomenclatura
                                ? `${item.vehiculo.nomenclatura} (${item.vehiculo.patente})`
                                : item.vehiculo.patente}
                            </strong>{' '}
                            <span style={{ color: 'var(--color-ink-500)' }}>
                              ({item.distanciaKm !== null ? formatearDistancia(item.distanciaKm) : '—'})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAbrirModalConRecomendados(item.vehiculo.id_vehiculo)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: idx === 0 ? '#dc2626' : 'var(--color-navy-900)',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {idx === 0 ? 'Despachar #1' : 'Elegir'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Personal cercano disponible */}
                <div
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-navy-900)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    🧑‍🚒 Personal disponible cercano
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-700)', lineHeight: 1.4 }}>
                    <div>
                      <strong>Oficial:</strong>{' '}
                      {capitanesDisponibles[0]
                        ? `Cap. ${capitanesDisponibles[0].usuario.nombre} ${capitanesDisponibles[0].usuario.apellidos}`
                        : 'Sin capitán disponible'}
                    </div>
                    <div>
                      <strong>Dotación:</strong> {bomberosDisponibles.length} bomberos disponibles
                      {vehiculosRecomendados[0]
                        ? ` (${vehiculosRecomendados[0].nombreCompania})`
                        : ''}
                    </div>
                  </div>
                </div>

                {/* Grifos operativos más cercanos */}
                <div
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-navy-900)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    🚰 Grifos operativos cercanos
                  </div>
                  {grifosRecomendados.length === 0 ? (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-500)' }}>
                      Sin grifos operativos
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8125rem' }}>
                      {grifosRecomendados.slice(0, 2).map((item) => (
                        <div key={item.grifo.id_grifo}>
                          <strong>Grifo #{item.grifo.id_grifo}</strong>{' '}
                          <span style={{ color: '#0369a1', fontWeight: 600 }}>
                            ({item.distanciaKm !== null ? formatearDistancia(item.distanciaKm) : '—'})
                          </span>{' '}
                          — {item.grifo.direccion || 'Ubicación registrada'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mapa-banner-monitoreo">
          <div className="mapa-banner-monitoreo__content">
            <span className="mapa-banner-monitoreo__icon">🛡️</span>
            <div>
              <strong>Modo Supervisión y Monitoreo de Flota en Tiempo Real</strong>
              <p>
                Visualización de unidades en servicio y grifos de apoyo en Talcahuano.
                La emisión y coordinación de despachos de emergencia está reservada a la{' '}
                <strong>Central de Despacho y Alarmas</strong>.
              </p>
            </div>
          </div>
          <div className="mapa-banner-monitoreo__leyenda">
            <span className="mapa-leyenda-item">🚨 En Despacho</span>
            <span className="mapa-leyenda-item">🚒 Operativo</span>
            <span className="mapa-leyenda-item">🔧 Mantención</span>
            <span className="mapa-leyenda-item">🚰 Grifos</span>
          </div>
        </div>
      )}

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
            const pos = obtenerCoordsVehiculo(v);
            const distanciaClic = coordsEmergencia ? calcularDistanciaKm(coordsEmergencia, pos) : null;

            const enDespacho = patentesEnDespacho.has(v.patente);
            const estadoColor = enDespacho
              ? { bg: '#fee2e2', text: '#b91c1c', label: '🚨 En Despacho' }
              : v.estado_operativo === 'operativo'
              ? { bg: '#DCFCE7', text: '#15803D', label: 'Operativo' }
              : v.estado_operativo === 'en_mantencion'
              ? { bg: '#FEF9C3', text: '#A16207', label: 'En Mantención' }
              : { bg: '#FEE2E2', text: '#B91C1C', label: 'Fuera de Servicio' };

            return (
              <Marker
                key={`veh-${v.id_vehiculo}`}
                position={pos}
                icon={iconoVehiculo(v.estado_operativo, enDespacho)}
              >
                <Popup>
                  <div style={{ minWidth: 170 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <strong style={{ fontSize: '1rem', color: '#111827' }}>
                        {v.nomenclatura ? `${v.nomenclatura} (${v.patente})` : v.patente}
                      </strong>
                      <span
                        style={{
                          backgroundColor: estadoColor.bg,
                          color: estadoColor.text,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {estadoColor.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.4 }}>
                      <div>
                        <strong>Modelo:</strong> {v.marca} {v.modelo} ({v.anio})
                      </div>
                      <div>
                        <strong>Kilometraje:</strong> {Number(v.kilometraje).toLocaleString('es-CL')} km
                      </div>
                      {distanciaClic !== null && (
                        <div style={{ color: '#0369a1', fontWeight: 600, marginTop: 2 }}>
                          📍 A {formatearDistancia(distanciaClic)} de la emergencia
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Grifos en el mapa para cruce de recursos */}
          {grifos.map((g) => {
            const posGrifo = normalizarCoordenadas(g.coordenadas);
            if (!posGrifo) return null;
            const distanciaClic = coordsEmergencia
              ? calcularDistanciaKm(coordsEmergencia, posGrifo)
              : null;
            return (
              <Marker key={`grifo-${g.id_grifo}`} position={posGrifo} icon={iconoGrifo}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>🚰 Grifo #{g.id_grifo}</strong>
                    <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 4 }}>
                      <div>
                        <strong>Dirección:</strong> {g.direccion || 'Sin dirección registrada'}
                      </div>
                      <div>
                        <strong>Estado:</strong> {g.estado_operativo}
                      </div>
                      {distanciaClic !== null && (
                        <div style={{ color: '#0369a1', fontWeight: 600, marginTop: 2 }}>
                          📍 A {formatearDistancia(distanciaClic)} de la emergencia
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Despachos de emergencia activos en el mapa con su emoji */}
          {despachosActivos.map((d) => {
            const coord = coordenadasDespacho(d);
            if (!coord) return null;
            const emoji = emojiEmergencia(d.tipo_emergencia);
            return (
              <Marker
                key={`despacho-activo-${d.id_despacho}`}
                position={coord}
                icon={iconoEmojiEmergencia(emoji)}
              >
                <Popup>
                  <div style={{ minWidth: 170 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <strong style={{ fontSize: '0.9375rem', color: '#111827' }}>
                        {emoji} Despacho #{d.id_despacho}
                      </strong>
                      <span
                        style={{
                          backgroundColor: d.estado_emergencia === 'en_curso' ? '#fee2e2' : '#e0f2fe',
                          color: d.estado_emergencia === 'en_curso' ? '#b91c1c' : '#0369a1',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {d.estado_emergencia === 'en_curso' ? 'En Curso' : 'Controlada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.4 }}>
                      <div>
                        <strong>Emergencia:</strong> {d.tipo_emergencia}
                      </div>
                      {d.vehiculo && (
                        <div>
                          <strong>Unidad asignada:</strong> 🚒 {d.vehiculo.patente}
                        </div>
                      )}
                      {d.grifo && (
                        <div>
                          <strong>Grifo de apoyo:</strong> 🚰 #{d.grifo.id_grifo}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de la emergencia a despachar, con el emoji de su tipo (HU-20) */}
          {coordsEmergencia && (
            <Marker position={coordsEmergencia} icon={iconoPunto}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <strong>
                    {emojiTipo} {tipoEmergencia}
                  </strong>
                  <br />
                  {direccionTexto.trim() && (
                    <>
                      {direccionTexto.trim()}
                      <br />
                    </>
                  )}
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {coordsEmergencia[0].toFixed(5)}, {coordsEmergencia[1].toFixed(5)}
                  </span>
                  <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <button
                      type="button"
                      ref={(node) => {
                        if (node) {
                          node.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            limpiarEmergencia();
                          };
                          node.onmousedown = (e) => e.stopPropagation();
                          node.ontouchstart = (e) => e.stopPropagation();
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        limpiarEmergencia();
                      }}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        width: '100%',
                        display: 'block',
                      }}
                    >
                      ✕ Quitar punto
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Modal de Despacho Completo (ordenado por cercanía al punto marcado) */}
      {modalAbierto && (
        <Modal onClose={handleCerrarModal} title="Despachar Emergencia (Orden de Salida)">
          <form
            onSubmit={handleDespachar}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              maxHeight: '75vh',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                color: 'var(--color-ink-700)',
              }}
            >
              {emojiTipo} <strong>{tipoEmergencia}</strong>
              <br />
              📍 {direccionTexto.trim() ? `${direccionTexto.trim()} — ` : ''}
              {coordsEmergencia?.[0].toFixed(5)}, {coordsEmergencia?.[1].toFixed(5)}
              <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, marginTop: '4px' }}>
                ✨ Recursos preseleccionados y ordenados por cercanía al punto de emergencia
              </div>
            </div>

            {/* Asignar Vehículo (ordenado por distancia) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Asignar Vehículo Operativo Disponible (Más cercanos primero) *
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
                <option value="" disabled>
                  Selecciona una unidad operativa...
                </option>
                {vehiculosRecomendados.length === 0 ? (
                  <option value="" disabled>
                    No hay vehículos operativos disponibles actualmente
                  </option>
                ) : (
                  vehiculosRecomendados.map(({ vehiculo: v, distanciaKm, nombreCompania }, idx) => (
                    <option key={v.id_vehiculo} value={v.id_vehiculo}>
                      {idx === 0 ? '⭐ [Más cercano] ' : ''}
                      {v.nomenclatura ? `${v.nomenclatura} (${v.patente})` : v.patente} — {v.marca}{' '}
                      {v.modelo} | {nombreCompania}
                      {distanciaKm !== null ? ` (${formatearDistancia(distanciaKm)})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Asignar Capitán / Jefe de Despacho */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Asignar Capitán / Oficial a Cargo (Prioridad compañía cercana)
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
                {capitanesDisponibles.map(({ usuario: c, distanciaKm, mismaCompania }) => (
                  <option key={c.id_usuario} value={c.id_usuario}>
                    {mismaCompania ? '⭐ ' : ''}Cap. {c.nombre} {c.apellidos}
                    {distanciaKm !== null ? ` (${formatearDistancia(distanciaKm)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignar Conductor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Conductor de la Unidad (Más cercanos primero)
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
                {bomberosDisponibles.map(({ usuario: b, distanciaKm, mismaCompania }) => (
                  <option key={b.id_usuario} value={b.id_usuario}>
                    {mismaCompania ? '⭐ ' : ''}
                    {b.nombre} {b.apellidos}
                    {distanciaKm !== null ? ` (${formatearDistancia(distanciaKm)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignar Brigadistas / Bomberos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Tripulación / Brigadistas de Apoyo (⭐ = Compañía más cercana)
              </label>
              {bomberosDisponibles.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-500)', fontStyle: 'italic' }}>
                  No hay bomberos adicionales disponibles.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '110px',
                    overflowY: 'auto',
                    padding: '6px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {bomberosDisponibles
                    .filter(({ usuario: b }) => b.id_usuario !== Number(conductorSeleccionado))
                    .map(({ usuario: b, distanciaKm, mismaCompania }) => {
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
                          {isSelected ? '✓' : '+'} {mismaCompania ? '⭐ ' : ''}
                          {b.nombre} {b.apellidos}
                          {distanciaKm !== null ? ` (${formatearDistancia(distanciaKm)})` : ''}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Grifo de apoyo (ordenado por cercanía) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Grifo Cercano de Abastecimiento (Más cercanos primero)
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
                {grifosRecomendados.map(({ grifo: g, distanciaKm }, idx) => (
                  <option key={g.id_grifo} value={g.id_grifo}>
                    {idx === 0 ? '⭐ [Más cercano] ' : ''}Grifo #{g.id_grifo} —{' '}
                    {g.direccion || 'Ubicación registrada'}
                    {distanciaKm !== null ? ` (${formatearDistancia(distanciaKm)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-2)',
              }}
            >
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