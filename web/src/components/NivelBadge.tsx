import type { CSSProperties } from 'react';

interface NivelBadgeProps {
  valor: number | string | null | undefined;
  mostrarEtiqueta?: boolean;
}

/**
 * Paleta oficial de colores:
 * - Buena disponibilidad (>= 75%): Fondo #DCFCE7, Texto #15803D, Indicador #16A34A
 * - Programar carga (50% - 74%): Fondo #FEF9C3, Texto #A16207, Indicador #EAB308
 * - Prioridad de abastecimiento (25% - 49%): Fondo #FFEDD5, Texto #C2410C, Indicador #EA580C
 * - Situación crítica (< 25%): Fondo #FEE2E2, Texto #B91C1C, Indicador #DC2626
 */
export function getNivelColor(valor: number | string | null | undefined) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  const n = Number(valor);
  if (isNaN(n)) return null;

  if (n >= 75) {
    return {
      estado: 'Buena disponibilidad',
      fondo: '#DCFCE7',
      texto: '#15803D',
      borde: '#BBF7D0',
      indicador: '#16A34A',
    };
  } else if (n >= 50) {
    return {
      estado: 'Programar carga',
      fondo: '#FEF9C3',
      texto: '#A16207',
      borde: '#FEF08A',
      indicador: '#EAB308',
    };
  } else if (n >= 25) {
    return {
      estado: 'Prioridad de abastecimiento',
      fondo: '#FFEDD5',
      texto: '#C2410C',
      borde: '#FED7AA',
      indicador: '#EA580C',
    };
  } else {
    return {
      estado: 'Situación crítica',
      fondo: '#FEE2E2',
      texto: '#B91C1C',
      borde: '#FECACA',
      indicador: '#DC2626',
    };
  }
}

export function NivelBadge({ valor, mostrarEtiqueta = false }: NivelBadgeProps) {
  const config = getNivelColor(valor);

  if (!config) {
    return <span style={{ color: 'var(--color-ink-400)' }}>—</span>;
  }

  const n = Number(valor).toFixed(0);

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: config.fondo,
    color: config.texto,
    border: `1px solid ${config.borde}`,
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
  };

  const dotStyle: CSSProperties = {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: config.indicador,
  };

  return (
    <span style={badgeStyle} title={config.estado}>
      <span style={dotStyle} />
      {n}%
      {mostrarEtiqueta && <span style={{ fontWeight: 400, opacity: 0.9 }}>· {config.estado}</span>}
    </span>
  );
}
