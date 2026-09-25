import { useEffect, useMemo, useState } from 'react';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { listarRegistros, type RegistroOperatividad } from '../../services/registroOperatividad';
import './historial-estados.css';

const REGISTROS_POR_PAGINA = 10;

function formatearNivel(valor: number | string | null): string {
  if (valor === null) return '—';
  return `${Number(valor).toFixed(0)}%`;
}

export function HistorialEstadosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [registros, setRegistros] = useState<RegistroOperatividad[]>([]);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const [listaVehiculos, listaRegistros] = await Promise.all([
        listarVehiculos(),
        listarRegistros(),
      ]);
      setVehiculos(listaVehiculos);
      setRegistros(listaRegistros);
      setIdVehiculo(listaVehiculos[0]?.id_vehiculo ?? null);
      setIsLoading(false);
    }
    cargar();
  }, []);

  // Filtra por el vehículo elegido y ordena por fecha descendente (lo que
  // pide la HU). Se recalcula solo cuando cambian los datos o el vehículo.
  const registrosDelVehiculo = useMemo(() => {
    return registros
      .filter((r) => r.id_vehiculo === idVehiculo)
      .sort(
        (a, b) =>
          new Date(b.fecha_hora_registro).getTime() -
          new Date(a.fecha_hora_registro).getTime(),
      );
  }, [registros, idVehiculo]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosDelVehiculo.length / REGISTROS_POR_PAGINA),
  );
  const registrosPagina = registrosDelVehiculo.slice(
    (pagina - 1) * REGISTROS_POR_PAGINA,
    pagina * REGISTROS_POR_PAGINA,
  );

  function handleCambiarVehiculo(id: number) {
    setIdVehiculo(id);
    setPagina(1);
  }

  if (isLoading) {
    return <p>Cargando historial…</p>;
  }

  return (
    <div className="historial-page">
      <h1 className="historial-page__title">Historial de estados</h1>
      <p className="historial-page__subtitle">
        Registros de operatividad reportados para el vehículo seleccionado, del más reciente al más antiguo.
      </p>

      <div className="historial-page__field">
        <label htmlFor="vehiculo">Vehículo</label>
        <select
          id="vehiculo"
          value={idVehiculo ?? ''}
          onChange={(e) => handleCambiarVehiculo(Number(e.target.value))}
        >
          {vehiculos.map((v) => (
            <option key={v.id_vehiculo} value={v.id_vehiculo}>
              {v.patente} — {v.marca} {v.modelo}
            </option>
          ))}
        </select>
      </div>

      {registrosDelVehiculo.length === 0 ? (
        <p className="historial-table__empty">
          Este vehículo todavía no tiene registros de estado.
        </p>
      ) : (
        <>
          <table className="historial-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Combustible</th>
                <th>Agua</th>
                <th>Aceite</th>
                <th>Observaciones</th>
                <th>Reportado por</th>
              </tr>
            </thead>
            <tbody>
              {registrosPagina.map((r) => (
                <tr key={r.id_registro}>
                  <td>{new Date(r.fecha_hora_registro).toLocaleString('es-CL')}</td>
                  <td>{formatearNivel(r.nivel_combustible)}</td>
                  <td>{formatearNivel(r.nivel_agua)}</td>
                  <td>{formatearNivel(r.nivel_aceite)}</td>
                  <td>{r.observaciones || '—'}</td>
                  <td>{r.usuario ? `${r.usuario.nombre} ${r.usuario.apellidos}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="historial-page__paginacion">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>
            <span>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
