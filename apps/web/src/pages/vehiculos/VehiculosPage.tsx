import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarVehiculos,
  crearVehiculo,
  editarVehiculo,
  listarCompanias,
  listarTiposVehiculo,
  type Vehiculo,
  type TipoVehiculo,
  type CompaniaOption,
  type EstadoVehiculo,
} from '../../services/vehiculos';
import { VehiculosCards } from './VehiculosCards';
import { VehiculoForm, type VehiculoFormValues } from './VehiculoForm';
import './vehiculos.css';

type Vista = { modo: 'lista' } | { modo: 'crear' } | { modo: 'editar'; vehiculo: Vehiculo };

export function VehiculosPage() {
  const { user, hasPermission, getScope } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const scope = getScope('vehiculos');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;
  const puedeCrearVehiculos = hasPermission('vehiculos', 'create') || esAdmin;
  const puedeEditarVehiculos = hasPermission('vehiculos', 'update') || esAdmin;

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>([]);
  const [vista, setVista] = useState<Vista>({ modo: 'lista' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // HU-12 y HU-13: Filtro y Búsqueda
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [estado, setEstado] = useState<EstadoVehiculo | ''>('');
  const [idCompania, setIdCompania] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Espera 300ms a que el usuario deje de escribir (o limpia de inmediato si q está vacío)
  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setQDebounced('');
      return;
    }
    const timer = window.setTimeout(() => {
      setQDebounced(trimmed);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (esAlcanceCompania && user?.id_compania) {
      setIdCompania(String(user.id_compania));
    } else if (puedeVerTodasCompanias) {
      setIdCompania('');
    }
  }, [esAlcanceCompania, puedeVerTodasCompanias, user?.id_compania]);

  const cargarVehiculos = (signal?: { cancelled: boolean }) => {
    setIsLoading(true);
    const companiaIdNum =
      esAlcanceCompania && user?.id_compania
        ? Number(user.id_compania)
        : idCompania
          ? Number(idCompania)
          : undefined;

    listarVehiculos({
      ...(estado ? { estado } : {}),
      ...(qDebounced ? { q: qDebounced } : {}),
      ...(companiaIdNum ? { id_compania: companiaIdNum } : {}),
    })
      .then((res) => {
        if (signal?.cancelled) return;
        setVehiculos(res as unknown as Vehiculo[]);
        setLoadError(null);
      })
      .catch((err) => {
        if (signal?.cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos.');
      })
      .finally(() => {
        if (!signal?.cancelled) setIsLoading(false);
      });
  };

  useEffect(() => {
    listarCompanias()
      .then((comps) => setCompanias(comps.sort((a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania))))
      .catch(console.error);
    listarTiposVehiculo().then(setTiposVehiculo).catch(console.error);
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    cargarVehiculos(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [estado, qDebounced, idCompania, esAlcanceCompania, user?.id_compania]);

  async function handleCrear(values: VehiculoFormValues) {
    setIsSaving(true);
    setFormError(null);
    try {
      await crearVehiculo(values);
      setVista({ modo: 'lista' });
      cargarVehiculos();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo registrar el vehículo.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditar(id_vehiculo: number, values: VehiculoFormValues) {
    setIsSaving(true);
    setFormError(null);
    try {
      const { patente: _patente, ...resto } = values;
      await editarVehiculo(id_vehiculo, resto);
      setVista({ modo: 'lista' });
      cargarVehiculos();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo actualizar el vehículo.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Filtrado instantáneo por compañía, estado y texto mientras el usuario escribe
  const vehiculosFiltrados = useMemo(() => {
    let lista = vehiculos;
    if (esAlcanceCompania && user?.id_compania) {
      lista = lista.filter((v) => v.id_compania === user.id_compania);
    } else if (idCompania) {
      lista = lista.filter((v) => String(v.id_compania) === idCompania);
    }
    if (estado) {
      lista = lista.filter((v) => v.estado_operativo === estado);
    }
    const termino = q.trim().toLowerCase();
    if (termino) {
      lista = lista.filter((v) =>
        [v.patente, v.nomenclatura, v.marca, v.modelo]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termino)),
      );
    }
    return lista;
  }, [vehiculos, esAlcanceCompania, user?.id_compania, idCompania, estado, q]);

  // Estadísticas rápidas de estado para Comandancia y Operaciones
  const statsFlota = useMemo(() => {
    const total = vehiculosFiltrados.length;
    const operativos = vehiculosFiltrados.filter((v) => v.estado_operativo === 'operativo').length;
    const mantencion = vehiculosFiltrados.filter((v) => v.estado_operativo === 'en_mantencion').length;
    const fuera = vehiculosFiltrados.filter((v) => v.estado_operativo === 'fuera_de_servicio').length;
    return { total, operativos, mantencion, fuera };
  }, [vehiculosFiltrados]);

  return (
    <div className="vehiculos-page">
      <div className="vehiculos-page__header">
        <div>
          <h1 className="vehiculos-page__title">
            {esAlcanceCompania && user?.compania
              ? `Vehículos — ${user.compania}`
              : 'Vehículos de Emergencia'}
          </h1>
          {vista.modo === 'lista' && !loadError && (
            <div className="vehiculos-page__stats">
              <span className="vehiculos-stat-pill">
                <strong>{statsFlota.total}</strong> {statsFlota.total === 1 ? 'unidad' : 'unidades'}
              </span>
              <span className="vehiculos-stat-pill is-operativo">
                🟢 <strong>{statsFlota.operativos}</strong> operativos
              </span>
              <span className="vehiculos-stat-pill is-mantencion">
                🟡 <strong>{statsFlota.mantencion}</strong> mantención
              </span>
              {statsFlota.fuera > 0 && (
                <span className="vehiculos-stat-pill is-fuera">
                  🔴 <strong>{statsFlota.fuera}</strong> fuera de servicio
                </span>
              )}
            </div>
          )}
        </div>
        {puedeCrearVehiculos && vista.modo === 'lista' && (
          <button
            className="vehiculos-page__nuevo"
            onClick={() => {
              setFormError(null);
              setVista({ modo: 'crear' });
            }}
          >
            + Nuevo vehículo
          </button>
        )}
      </div>

      {vista.modo === 'lista' && (
        <>
          <div className="vehiculos-page__filtros">
            <div className="vehiculos-page__search-wrap">
              <input
                type="text"
                className="vehiculos-page__filtro-input"
                placeholder="Buscar por patente, nomenclatura, marca o modelo..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  className="vehiculos-page__search-clear"
                  onClick={() => setQ('')}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro de Compañía: visible solo si el rol/alcance es GLOBAL */}
            {puedeVerTodasCompanias && (
              <select
                className="vehiculos-page__filtro-select"
                style={{
                  maxWidth: '220px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                value={idCompania}
                onChange={(e) => setIdCompania(e.target.value)}
              >
                <option value="">Todas las compañías</option>
                {companias.map((c) => (
                  <option key={c.id_compania} value={c.id_compania}>
                    {`${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`}
                  </option>
                ))}
              </select>
            )}

            <select
              className="vehiculos-page__filtro-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoVehiculo | '')}
            >
              <option value="">Todos los estados</option>
              <option value="operativo">🟢 Operativo</option>
              <option value="en_mantencion">🟡 En mantención</option>
              <option value="fuera_de_servicio">🔴 Fuera de servicio</option>
            </select>
          </div>

          {loadError ? (
            <p className="vehiculos-form__alert" role="alert">{loadError}</p>
          ) : isLoading && vehiculos.length === 0 ? (
            <p className="vehiculos-page__vacio">Cargando vehículos…</p>
          ) : (
            <VehiculosCards
              vehiculos={vehiculosFiltrados}
              companias={companias}
              onEditar={
                puedeEditarVehiculos
                  ? (vehiculo) => {
                      setFormError(null);
                      setVista({ modo: 'editar', vehiculo });
                    }
                  : undefined
              }
            />
          )}
        </>
      )}

      {vista.modo === 'crear' && (
        <VehiculoForm
          companias={companias}
          tiposVehiculo={tiposVehiculo}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={handleCrear}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}

      {vista.modo === 'editar' && (
        <VehiculoForm
          vehiculoExistente={vista.modo === 'editar' ? vista.vehiculo : undefined}
          companias={companias}
          tiposVehiculo={tiposVehiculo}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={(values) => handleEditar(vista.vehiculo.id_vehiculo, values)}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}
    </div>
  );
}
