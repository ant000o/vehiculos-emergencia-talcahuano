import { useState } from 'react';
import { exportarGastosCSV } from '../services/estadisticas';

function fechaLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * HU-24: exportar reporte de gastos (mano de obra + insumos) de un periodo.
 * Por defecto propone los últimos 30 días.
 */
export function ExportarGastosCSV() {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);

  const [desde, setDesde] = useState(fechaLocalISO(hace30));
  const [hasta, setHasta] = useState(fechaLocalISO(hoy));
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'ok'; texto: string } | null>(null);

  async function handleExportar() {
    setMensaje(null);
    if (!desde || !hasta) {
      setMensaje({ tipo: 'error', texto: 'Selecciona la fecha de inicio y de término.' });
      return;
    }
    if (desde > hasta) {
      setMensaje({ tipo: 'error', texto: 'La fecha de inicio no puede ser posterior a la de término.' });
      return;
    }
    setIsLoading(true);
    try {
      const cantidad = await exportarGastosCSV(desde, hasta);
      setMensaje(
        cantidad === 0
          ? { tipo: 'error', texto: 'No hay mantenciones en ese periodo.' }
          : { tipo: 'ok', texto: `Reporte descargado (${cantidad} mantenciones).` },
      );
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo generar el reporte.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="exportar-gastos">
      <label className="exportar-gastos__campo">
        Desde
        <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
      </label>
      <label className="exportar-gastos__campo">
        Hasta
        <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
      </label>
      <button className="dashboard__btn-exportar" onClick={handleExportar} disabled={isLoading}>
        {isLoading ? 'Generando…' : '↓ Exportar a CSV'}
      </button>
      {mensaje && (
        <span
          className={`exportar-gastos__mensaje exportar-gastos__mensaje--${mensaje.tipo}`}
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
        >
          {mensaje.texto}
        </span>
      )}
    </div>
  );
}
