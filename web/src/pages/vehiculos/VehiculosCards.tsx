import type { Vehiculo, CompaniaOption, EstadoVehiculo } from '../../services/vehiculos';
import { VehiculoImagen } from './VehiculoImagen';

interface VehiculosCardsProps {
  vehiculos: Vehiculo[];
  companias: CompaniaOption[];
  /** Si se pasa, cada tarjeta muestra el botón Editar. */
  onEditar?: (vehiculo: Vehiculo) => void;
}

const ESTADO_LABEL: Record<EstadoVehiculo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

export function VehiculosCards({ vehiculos, companias, onEditar }: VehiculosCardsProps) {
  function nombreCompania(id_compania: number): string {
    return companias.find((c) => c.id_compania === id_compania)?.nombre ?? '—';
  }

  if (vehiculos.length === 0) {
    return <p className="vehiculos-page__vacio">No hay vehículos que coincidan con la búsqueda.</p>;
  }

  return (
    <div className="vehiculos-grid">
      {vehiculos.map((v) => {
        const kmActual = Number(v.kilometraje ?? 0);
        const proxKm = v.proxima_mantencion ?? kmActual + 10000;
        const mantencionVencida = v.proxima_mantencion != null && kmActual >= v.proxima_mantencion;

        return (
          <article key={v.id_vehiculo} className={`vehiculo-card is-${v.estado_operativo}`}>
            <div className="vehiculo-card__media">
              <VehiculoImagen src={v.imagen_url} alt={`${v.marca} ${v.modelo}`} />
              <span className={`vehiculo-card__estado is-${v.estado_operativo}`}>
                {ESTADO_LABEL[v.estado_operativo]}
              </span>
            </div>

            <div className="vehiculo-card__body">
              <div className="vehiculo-card__titulo">
                <h2 className="vehiculo-card__patente">{v.patente}</h2>
                <span className="vehiculo-card__modelo">{v.marca} {v.modelo}</span>
              </div>

              <dl className="vehiculo-card__datos">
                <div>
                  <dt>Año</dt>
                  <dd>{v.anio}</dd>
                </div>
                <div>
                  <dt>Kilometraje</dt>
                  <dd>{kmActual.toLocaleString('es-CL')} km</dd>
                </div>
                <div>
                  <dt>Próx. mantención</dt>
                  <dd className={mantencionVencida ? 'is-vencida' : undefined}>
                    {Number(proxKm).toLocaleString('es-CL')} km
                  </dd>
                </div>
                <div>
                  <dt>Compañía</dt>
                  <dd>{nombreCompania(v.id_compania)}</dd>
                </div>
              </dl>

              {onEditar && (
                <div className="vehiculo-card__acciones">
                  <button type="button" onClick={() => onEditar(v)}>Editar</button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
