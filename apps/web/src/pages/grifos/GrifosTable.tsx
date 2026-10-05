import type { Grifo, CompaniaOption, EstadoGrifo } from '../../services/grifos';

interface GrifosTableProps {
  grifos: Grifo[];
  companias: CompaniaOption[];
  onVerUbicacion: (grifo: Grifo) => void;
}

const ESTADO_LABEL: Record<EstadoGrifo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

export function GrifosTable({ grifos, companias, onVerUbicacion }: GrifosTableProps) {
  function nombreCompania(id_compania: number): string {
    return companias.find((c) => c.id_compania === id_compania)?.nombre ?? '—';
  }

  if (grifos.length === 0) {
    return <p className="grifos-table__empty">No hay grifos registrados todavía.</p>;
  }

  return (
    <table className="grifos-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Dirección</th>
          <th>Estado</th>
          <th>Compañía</th>
          <th>Última revisión</th>
          <th aria-label="Acciones"></th>
        </tr>
      </thead>
      <tbody>
        {grifos.map((g) => (
          <tr key={g.id_grifo}>
            <td className="grifos-table__id">#{g.id_grifo}</td>
            <td>{g.direccion ?? 'Sin dirección'}</td>
            <td>
              <span className={`grifos-table__badge is-${g.estado_operativo}`}>
                {ESTADO_LABEL[g.estado_operativo]}
              </span>
            </td>
            <td>{nombreCompania(g.id_compania)}</td>
            <td>{g.ultima_revision ?? '—'}</td>
            <td className="grifos-table__actions">
              <button onClick={() => onVerUbicacion(g)}>Ver ubicación</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
