import { useEffect, useState } from 'react';
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
      // La patente nunca se envía en la edición (ver EditarVehiculoInput).
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
