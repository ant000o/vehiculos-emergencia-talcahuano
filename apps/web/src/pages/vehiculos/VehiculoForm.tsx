import { useState, type FormEvent } from 'react';
import type { CompaniaOption, EstadoVehiculo } from '../../services/vehiculos';

interface VehiculoFormValues {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
}

interface VehiculoFormProps {
  companias: CompaniaOption[];
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (values: VehiculoFormValues) => void;
  onCancel: () => void;
}

interface FormErrors {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
}

const ANIO_ACTUAL = new Date().getFullYear();

export function VehiculoForm({
  companias,
  isSaving,
  serverError,
  onSubmit,
  onCancel,
}: VehiculoFormProps) {
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [kilometraje, setKilometraje] = useState(0);
  const [estado, setEstado] = useState<EstadoVehiculo>('operativo');
  const [idCompania, setIdCompania] = useState(companias[0]?.id_compania ?? 0);
  const [errors, setErrors] = useState<FormErrors>({});

  function validar(): boolean {
    const nuevosErrores: FormErrors = {};
    if (!patente.trim()) nuevosErrores.patente = 'Ingresa la patente.';
    else if (patente.length > 10) nuevosErrores.patente = 'Máximo 10 caracteres.';
    if (!marca.trim()) nuevosErrores.marca = 'Ingresa la marca.';
    if (!modelo.trim()) nuevosErrores.modelo = 'Ingresa el modelo.';
    if (anio < 1950 || anio > ANIO_ACTUAL + 1) {
      nuevosErrores.anio = `El año debe estar entre 1950 y ${ANIO_ACTUAL + 1}.`;
    }
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validar()) return;
    onSubmit({
      // Las patentes se guardan en mayúsculas por convención.
      patente: patente.trim().toUpperCase(),
      marca,
      modelo,
      anio,
      kilometraje,
      estado_operativo: estado,
      id_compania: idCompania,
    });
  }

  return (
    <form className="vehiculos-form" onSubmit={handleSubmit} noValidate>
      <h2 className="vehiculos-form__title">Nuevo vehículo</h2>

      {serverError && (
        <p className="vehiculos-form__alert" role="alert">
          {serverError}
        </p>
      )}

      <div className="vehiculos-form__row">
        <div className="vehiculos-form__field">
          <label htmlFor="patente">Patente</label>
          <input
            id="patente"
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            placeholder="AB1234"
            maxLength={10}
            aria-invalid={Boolean(errors.patente)}
          />
          {errors.patente && <span className="vehiculos-form__error">{errors.patente}</span>}
        </div>

        <div className="vehiculos-form__field">
          <label htmlFor="anio">Año</label>
          <input
            id="anio"
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            aria-invalid={Boolean(errors.anio)}
          />
          {errors.anio && <span className="vehiculos-form__error">{errors.anio}</span>}
        </div>
      </div>

      <div className="vehiculos-form__row">
        <div className="vehiculos-form__field">
          <label htmlFor="marca">Marca</label>
          <input
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            aria-invalid={Boolean(errors.marca)}
          />
          {errors.marca && <span className="vehiculos-form__error">{errors.marca}</span>}
        </div>

        <div className="vehiculos-form__field">
          <label htmlFor="modelo">Modelo</label>
          <input
            id="modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            aria-invalid={Boolean(errors.modelo)}
          />
          {errors.modelo && <span className="vehiculos-form__error">{errors.modelo}</span>}
        </div>
      </div>

      <div className="vehiculos-form__row">
        <div className="vehiculos-form__field">
          <label htmlFor="kilometraje">Kilometraje inicial</label>
          <input
            id="kilometraje"
            type="number"
            min={0}
            value={kilometraje}
            onChange={(e) => setKilometraje(Number(e.target.value))}
          />
        </div>

        <div className="vehiculos-form__field">
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoVehiculo)}>
            <option value="operativo">Operativo</option>
            <option value="en_mantencion">En mantención</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
        </div>
      </div>

      <div className="vehiculos-form__field">
        <label htmlFor="compania">Compañía</label>
        <select
          id="compania"
          value={idCompania}
          onChange={(e) => setIdCompania(Number(e.target.value))}
        >
          {companias.map((c) => (
            <option key={c.id_compania} value={c.id_compania}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="vehiculos-form__actions">
        <button type="button" className="vehiculos-form__cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="vehiculos-form__submit" disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
