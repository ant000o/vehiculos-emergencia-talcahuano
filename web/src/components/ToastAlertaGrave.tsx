import { useEffect } from 'react';

export function ToastAlertaGrave({ mensaje, onClose }: { mensaje: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '16px 24px',
      borderRadius: 8,
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontFamily: 'var(--font-body)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ fontSize: 24 }}>⚠️</div>
      <div>
        <h4 style={{ margin: 0, marginBottom: 4 }}>Alerta Crítica de Flota</h4>
        <p style={{ margin: 0 }}>{mensaje}</p>
      </div>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20, marginLeft: 16 }}
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
