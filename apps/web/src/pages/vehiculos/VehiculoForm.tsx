import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import type { CompaniaOption, EstadoVehiculo, Vehiculo, TipoVehiculo } from '../../services/vehiculos';
import { formatoNombreCompania } from '../../services/usuarios';

export interface VehiculoFormValues {
  patente: string;
  nomenclatura?: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado_operativo: EstadoVehiculo;
  id_tipo_vehiculo?: number;
  id_compania: number;
}

interface VehiculoFormProps {
  /** Si viene un vehículo, el formulario opera en modo edición (patente bloqueada). */
  vehiculoExistente?: Vehiculo;
  companias: CompaniaOption[];
  tiposVehiculo?: TipoVehiculo[];
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (values: VehiculoFormValues) => void;
  onCancel: () => void;
}

interface FormErrors {
  patente?: string;
  nomenclatura?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  kilometraje?: string;
  id_compania?: string;
}

const ANIO_ACTUAL = new Date().getFullYear();

export function VehiculoForm({
  vehiculoExistente,
  companias,
  tiposVehiculo = [],
  isSaving,
  serverError,
  onSubmit,
  onCancel,
}: VehiculoFormProps) {
  const { user, getScope } = useAuth();
  const scope = getScope('vehiculos');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);

  const esEdicion = vehiculoExistente !== undefined;

  const companiasOrdenadas = [...companias].sort(
    (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
  );

  const [patente, setPatente] = useState(vehiculoExistente?.patente ?? '');
  const [nomenclatura, setNomenclatura] = useState(vehiculoExistente?.nomenclatura ?? '');
  const [marca, setMarca] = useState(vehiculoExistente?.marca ?? '');
  const [modelo, setModelo] = useState(vehiculoExistente?.modelo ?? '');
  const [anio, setAnio] = useState(vehiculoExistente?.anio ?? ANIO_ACTUAL);
  const [kilometraje, setKilometraje] = useState(
    vehiculoExistente ? Number(vehiculoExistente.kilometraje) : 0,
  );
  const [estado, setEstado] = useState<EstadoVehiculo>(
    vehiculoExistente?.estado_operativo ?? 'operativo',
  );
  const [idTipoVehiculo, setIdTipoVehiculo] = useState<number | undefined>(
    vehiculoExistente?.id_tipo_vehiculo ?? tiposVehiculo[0]?.id_tipo_vehiculo ?? undefined,
  );
  const [idCompania, setIdCompania] = useState<number>(() => {
    if (vehiculoExistente?.id_compania) return vehiculoExistente.id_compania;
    if (esAlcanceCompania && user?.id_compania) return user.id_compania;
    return companiasOrdenadas[0]?.id_compania ?? 0;
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!esEdicion && !idTipoVehiculo && tiposVehiculo.length > 0) {
      setIdTipoVehiculo(tiposVehiculo[0].id_tipo_vehiculo);
    }
  }, [esEdicion, idTipoVehiculo, tiposVehiculo]);

  useEffect(() => {
    if (!esEdicion && (!idCompania || idCompania === 0)) {
      if (esAlcanceCompania && user?.id_compania) {
        setIdCompania(user.id_compania);
      } else if (companiasOrdenadas.length > 0) {
        setIdCompania(companiasOrdenadas[0].id_compania);
      }
    }
  }, [esEdicion, idCompania, esAlcanceCompania, user?.id_compania, companiasOrdenadas]);

  function validar(): boolean {
    const nuevosErrores: FormErrors = {};
    if (!esEdicion) {
      if (!patente.trim()) nuevosErrores.patente = 'Ingresa la patente.';
      else if (patente.trim().length > 10) nuevosErrores.patente = 'Máximo 10 caracteres.';
    }
    if (nomenclatura && nomenclatura.trim().length > 15) {
      nuevosErrores.nomenclatura = 'Máximo 15 caracteres para nomenclatura.';
    }
    if (!marca.trim()) nuevosErrores.marca = 'Ingresa la marca.';
    if (!modelo.trim()) nuevosErrores.modelo = 'Ingresa el modelo.';
    if (!anio || anio < 1950 || anio > ANIO_ACTUAL + 1) {
      nuevosErrores.anio = `El año debe estar entre 1950 y ${ANIO_ACTUAL + 1}.`;
    }
    if (kilometraje < 0 || Number.isNaN(kilometraje)) {
      nuevosErrores.kilometraje = 'El kilometraje no puede ser negativo.';
    }
    if (esEdicion && kilometraje < Number(vehiculoExistente!.kilometraje)) {
      nuevosErrores.kilometraje = 'El kilometraje no puede disminuir respecto al actual.';
    }
    if (!idCompania || idCompania <= 0) {
      nuevosErrores.id_compania = 'Selecciona una compañía válida.';
    }
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validar()) return;
    onSubmit({
      patente: patente.trim().toUpperCase(),
      nomenclatura: nomenclatura.trim().toUpperCase() || undefined,
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio,
      kilometraje,
      estado_operativo: estado,
      id_tipo_vehiculo: idTipoVehiculo,
      id_compania: idCompania,
    });
  }

  const rowGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: '16px',
    width: '100%',
  };

  const fullWidthControlStyle = {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  };

  const selectControlStyle = {
    ...fullWidthControlStyle,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <form
      className="vehiculos-form"
      style={{ maxWidth: '640px', width: '100%', boxSizing: 'border-box' }}
      onSubmit={handleSubmit}
      noValidate
    >
      <h2 className="vehiculos-form__title">
        {esEdicion ? `Editar vehículo — ${vehiculoExistente.patente}` : 'Nuevo vehículo'}
      </h2>

      {serverError && (
        <p className="vehiculos-form__alert" role="alert">
          {serverError}
        </p>
      )}

      <div className="vehiculos-form__row" style={rowGridStyle}>
        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="patente">Patente</label>
          <input
            id="patente"
            style={fullWidthControlStyle}
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            placeholder="AB1234"
            maxLength={10}
            disabled={esEdicion}
            aria-invalid={Boolean(errors.patente)}
          />
          {esEdicion && (
            <span className="vehiculos-form__hint">La patente no se puede modificar.</span>
          )}
          {errors.patente && <span className="vehiculos-form__error">{errors.patente}</span>}
        </div>

        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="nomenclatura">Nomenclatura (código institucional)</label>
          <input
            id="nomenclatura"
            style={fullWidthControlStyle}
            value={nomenclatura}
            onChange={(e) => setNomenclatura(e.target.value)}
            placeholder="Ej: B-1, Q-1, R-2"
            maxLength={15}
            aria-invalid={Boolean(errors.nomenclatura)}
          />
          {errors.nomenclatura && <span className="vehiculos-form__error">{errors.nomenclatura}</span>}
        </div>
      </div>

      <div className="vehiculos-form__row" style={rowGridStyle}>
        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="tipo_vehiculo">Tipo de Vehículo</label>
          <select
            id="tipo_vehiculo"
            style={selectControlStyle}
            value={idTipoVehiculo ?? ''}
            onChange={(e) => setIdTipoVehiculo(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Selecciona tipo…</option>
            {tiposVehiculo.map((tv) => (
              <option
                key={tv.id_tipo_vehiculo}
                value={tv.id_tipo_vehiculo}
                title={tv.descripcion ? `${tv.nombre_tipo.toUpperCase()} — ${tv.descripcion}` : tv.nombre_tipo.toUpperCase()}
              >
                {tv.nombre_tipo.toUpperCase()} {tv.descripcion ? `— ${tv.descripcion}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="anio">Año</label>
          <input
            id="anio"
            type="number"
            style={fullWidthControlStyle}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            aria-invalid={Boolean(errors.anio)}
            placeholder={`Ej: ${ANIO_ACTUAL}`}
          />
          {errors.anio && <span className="vehiculos-form__error">{errors.anio}</span>}
        </div>
      </div>

      <div className="vehiculos-form__row" style={rowGridStyle}>
        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="marca">Marca</label>
          <input
            id="marca"
            style={fullWidthControlStyle}
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            aria-invalid={Boolean(errors.marca)}
            placeholder="Ej: Ford"
          />
          {errors.marca && <span className="vehiculos-form__error">{errors.marca}</span>}
        </div>

        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="modelo">Modelo</label>
          <input
            id="modelo"
            style={fullWidthControlStyle}
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            aria-invalid={Boolean(errors.modelo)}
            placeholder="Ej: Ranger"
          />
          {errors.modelo && <span className="vehiculos-form__error">{errors.modelo}</span>}
        </div>
      </div>

      <div className="vehiculos-form__row" style={rowGridStyle}>
        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="kilometraje">Kilometraje</label>
          <input
            id="kilometraje"
            type="number"
            min={0}
            style={fullWidthControlStyle}
            value={kilometraje}
            onChange={(e) => setKilometraje(Number(e.target.value))}
            aria-invalid={Boolean(errors.kilometraje)}
          />
          {errors.kilometraje && (
            <span className="vehiculos-form__error">{errors.kilometraje}</span>
          )}
        </div>

        <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            style={selectControlStyle}
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoVehiculo)}
          >
            <option value="operativo">Operativo</option>
            <option value="en_mantencion">En mantención</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
        </div>
      </div>

      <div className="vehiculos-form__field" style={{ minWidth: 0 }}>
        <label htmlFor="compania">Compañía</label>
        <select
          id="compania"
          value={idCompania}
          onChange={(e) => setIdCompania(Number(e.target.value))}
          disabled={esAlcanceCompania}
          aria-invalid={Boolean(errors.id_compania)}
          style={selectControlStyle}
        >
          <option value={0} disabled>
            Selecciona una compañía…
          </option>
          {companiasOrdenadas.map((c) => (
            <option key={c.id_compania} value={c.id_compania} title={c.nombre}>
              {c.numero_compania
                ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                : formatoNombreCompania(c.nombre)}
            </option>
          ))}
        </select>
        {errors.id_compania && <span className="vehiculos-form__error">{errors.id_compania}</span>}
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