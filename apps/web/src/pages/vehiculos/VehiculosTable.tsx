import type { Vehiculo, CompaniaOption, EstadoVehiculo } from '../../services/vehiculos';

interface VehiculosTableProps {
  vehiculos: Vehiculo[];
  companias: CompaniaOption[];
}

const ESTADO_LABEL: Record<EstadoVehiculo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

export function VehiculosTable({ vehiculos, companias }: VehiculosTableProps) {
  function nombreCompania(id_compania: number): string {
    return companias.find((c) => c.id_compania === id_compania)?.nombre ?? '—';
  }

  if (vehiculos.length === 0) {
    return <p className="vehiculos-table__empty">No hay vehículos registrados todavía.</p>;
  }

  return (
    <table className="vehiculos-table">
      <thead>
        <tr>
          <th>Patente</th>
          <th>Marca / Modelo</th>
          <th>Año</th>
          <th>Kilometraje</th>
          <th>Estado</th>
          <th>Compañía</th>
        </tr>
      </thead>
      <tbody>
        {vehiculos.map((v) => (
          <tr key={v.id_vehiculo}>
            <td className="vehiculos-table__patente">{v.patente}</td>
            <td>{v.marca} {v.modelo}</td>
            <td>{v.anio}</td>
            <td>{Number(v.kilometraje).toLocaleString('es-CL')} km</td>
            <td>
              <span className={`vehiculos-table__badge is-${v.estado_operativo}`}>
                {ESTADO_LABEL[v.estado_operativo]}
              </span>
            </td>
            <td>{nombreCompania(v.id_compania)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
