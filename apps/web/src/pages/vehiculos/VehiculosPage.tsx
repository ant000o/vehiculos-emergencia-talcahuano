import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarVehiculos,
  listarCompanias,
  crearVehiculo,
  type Vehiculo,
  type CompaniaOption,
} from '../../services/vehiculos';
import { VehiculosTable } from './VehiculosTable';
import { VehiculoForm } from './VehiculoForm';
import './vehiculos.css';

type Vista = { modo: 'lista' } | { modo: 'crear' };

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

  async function handleCrear(values: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    kilometraje: number;
    estado_operativo: 'operativo' | 'en_mantencion' | 'fuera_de_servicio';
    id_compania: number;
  }) {
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
        <VehiculosTable vehiculos={vehiculos} companias={companias} />
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
    </div>
  );
}
