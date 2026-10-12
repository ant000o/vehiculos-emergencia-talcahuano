import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarVehiculos,
  crearVehiculo,
  editarVehiculo,
  listarCompanias,
  type Vehiculo,
  type CompaniaOption,
  type EstadoVehiculo,
} from '../../services/vehiculos';
import { VehiculosTable } from './VehiculosTable';
import { VehiculoForm } from './VehiculoForm';
import './vehiculos.css';

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

  // HU-12 y HU-13: Filtro y Búsqueda
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoVehiculo | ''>('');

  const cargarVehiculos = () => {
    setIsLoading(true);
    listarVehiculos(estado ? { estado, q } : { q })
      .then((res) => {
        setVehiculos(res as unknown as Vehiculo[]);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    listarCompanias().then(setCompanias).catch(console.error);
  }, []);

  useEffect(() => {
    cargarVehiculos();
  }, [estado, q]);

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
              type="text"
              className="vehiculos-page__filtro-input"
              placeholder="Buscar por patente, marca o modelo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="vehiculos-page__filtro-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoVehiculo | '')}
            >
              <option value="">Todos los estados</option>
              <option value="operativo">Operativo</option>
              <option value="en_mantencion">En mantención</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </select>
          </div>

          {isLoading ? (
            <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>Cargando vehículos…</p>
          ) : (
            <VehiculosTable
              vehiculos={vehiculos}
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
          )}
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
          vehiculoExistente={vista.modo === 'editar' ? vista.vehiculo : undefined}
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
