import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarVehiculos,
  listarCompanias,
  crearVehiculo,
  editarVehiculo,
  type Vehiculo,
  type CompaniaOption,
  type EstadoVehiculo,
} from '../../services/vehiculos';
import { VehiculosTable } from './VehiculosTable';
import { VehiculoForm } from './VehiculoForm';
import './vehiculos.css';

const ESTADO_FILTRO_LABEL: Record<EstadoVehiculo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

type Vista = { modo: 'lista' } | { modo: 'crear' } | { modo: 'editar'; vehiculo: Vehiculo };

interface VehiculoFormValues {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
}

export function VehiculosPage() {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'administrador';

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [vista, setVista] = useState<Vista>({ modo: 'lista' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // HU-12: búsqueda por patente/modelo en tiempo real.
  const [busqueda, setBusqueda] = useState('');
  // HU-13: filtro por estado operativo actual.
  const [filtroEstado, setFiltroEstado] = useState<EstadoVehiculo | 'todos'>('todos');

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return vehiculos.filter((v) => {
      const coincideTexto =
        texto === '' ||
        v.patente.toLowerCase().includes(texto) ||
        v.modelo.toLowerCase().includes(texto);
      const coincideEstado = filtroEstado === 'todos' || v.estado_operativo === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [vehiculos, busqueda, filtroEstado]);

  useEffect(() => {
    async function cargarDatos() {
      const [listaVehiculos, listaCompanias] = await Promise.all([
        listarVehiculos(),
        listarCompanias(),
      ]);
      setVehiculos(listaVehiculos);
      setCompanias(listaCompanias);
      setIsLoading(false);
    }
    cargarDatos();
  }, []);

  async function handleCrear(values: VehiculoFormValues) {
    setIsSaving(true);
    setFormError(null);
    try {
      const nuevo = await crearVehiculo(values);
      setVehiculos((prev) => [...prev, nuevo]);
      setVista({ modo: 'lista' });
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
      const actualizado = await editarVehiculo(id_vehiculo, resto);
      setVehiculos((prev) =>
        prev.map((v) => (v.id_vehiculo === id_vehiculo ? actualizado : v)),
      );
      setVista({ modo: 'lista' });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo actualizar el vehículo.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Cargando vehículos…</p>;
  }

  return (
    <div className="vehiculos-page">
      <div className="vehiculos-page__header">
        <h1 className="vehiculos-page__title">Vehículos</h1>
        {esAdmin && vista.modo === 'lista' && (
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
            <input
              type="search"
              className="vehiculos-page__busqueda"
              placeholder="Buscar por patente o modelo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar vehículo por patente o modelo"
            />
            <select
              className="vehiculos-page__filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoVehiculo | 'todos')}
              aria-label="Filtrar por estado operativo"
            >
              <option value="todos">Todos los estados</option>
              {(Object.keys(ESTADO_FILTRO_LABEL) as EstadoVehiculo[]).map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_FILTRO_LABEL[estado]}
                </option>
              ))}
            </select>
          </div>
          {(busqueda || filtroEstado !== 'todos') && (
            <p className="vehiculos-page__contador">
              {vehiculosFiltrados.length} de {vehiculos.length} vehículos
            </p>
          )}

          <VehiculosTable
            vehiculos={vehiculosFiltrados}
            companias={companias}
            onEditar={
              esAdmin
                ? (vehiculo) => {
                    setFormError(null);
                    setVista({ modo: 'editar', vehiculo });
                  }
                : undefined
            }
          />
        </>
      )}

      {vista.modo === 'crear' && (
        <VehiculoForm
          companias={companias}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={handleCrear}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}

      {vista.modo === 'editar' && (
        <VehiculoForm
          vehiculoExistente={vista.vehiculo}
          companias={companias}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={(values) => handleEditar(vista.vehiculo.id_vehiculo, values)}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}
    </div>
  );
}
