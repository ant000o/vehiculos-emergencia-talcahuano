import { useEffect } from 'react';

export interface ToastData {
  titulo: string;
  mensaje: string;
  tipo?: 'falla' | 'despacho' | 'controlada' | 'finalizada';
}

interface ToastAlertaGraveProps {
  data: string | ToastData;
  onClose: () => void;
}

export function ToastAlertaGrave({ data, onClose }: ToastAlertaGraveProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const titulo = typeof data === 'string' ? 'Alerta Crítica de Flota' : data.titulo;
  const mensaje = typeof data === 'string' ? data : data.mensaje;
  const tipo = typeof data === 'string' ? 'falla' : (data.tipo || 'despacho');

  const config =
    tipo === 'finalizada'
      ? { bg: '#15803d', icon: '✅' }
      : tipo === 'controlada'
      ? { bg: '#0284c7', icon: '🟡' }
      : tipo === 'despacho'
      ? { bg: '#b91c1c', icon: '🚒' }
      : { bg: '#dc2626', icon: '⚠️' };

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      backgroundColor: config.bg,
      color: 'white',
      padding: '16px 20px',
      borderRadius: 10,
      boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontFamily: 'var(--font-body)',
      animation: 'slideUp 0.3s ease-out',
      maxWidth: '420px',
    }}>
      <div style={{ fontSize: 26, flexShrink: 0 }}>{config.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, marginBottom: 3, fontSize: '0.9375rem', fontWeight: 700 }}>
          {titulo}
        </h4>
        <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.35, opacity: 0.95 }}>
          {mensaje}
        </p>
      </div>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: 22,
          marginLeft: 8,
          padding: 0,
          opacity: 0.8,
          lineHeight: 1,
        }}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
