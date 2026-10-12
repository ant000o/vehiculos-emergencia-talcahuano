import { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { NAV_ITEMS, ROLE_LABELS } from '../config/navigation';
import { getSocket } from '../services/socket';
import { ToastAlertaGrave } from '../components/ToastAlertaGrave';
import './AppLayout.css';

interface NotificacionItem {
  id: string;
  tipo: 'falla' | 'despacho';
  titulo: string;
  mensaje: string;
  fecha: Date;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [alerta, setAlerta] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Conexión compartida Socket.IO al backend
    const socket = getSocket();
    
    // HU-16: Falla grave reportada en vehículo
    const onAlertaFalla = (data: { vehiculo?: any; observaciones?: string }) => {
      const msg = data.observaciones || 'Un vehículo fue reportado Fuera de Servicio.';
      setAlerta(msg);
      setNotificaciones((prev) => [
        {
          id: Math.random().toString(),
          tipo: 'falla',
          titulo: '🚨 Alerta Crítica de Flota',
          mensaje: msg,
          fecha: new Date(),
        },
        ...prev,
      ]);
    };

    // HU-20 / HU-21: Nuevo despacho de emergencia emitido
    const onNuevoDespacho = (data: { tipo_emergencia?: string; vehiculo?: any }) => {
      const msg = `Despacho ${data.tipo_emergencia ?? 'de emergencia'} generado para ${data.vehiculo?.patente ?? 'unidad'}.`;
      setAlerta(msg);
      setNotificaciones((prev) => [
        {
          id: Math.random().toString(),
          tipo: 'despacho',
          titulo: '🚒 Nuevo Despacho en Curso',
          mensaje: msg,
          fecha: new Date(),
        },
        ...prev,
      ]);
    };

    socket.on('alerta_falla_grave', onAlertaFalla);
    socket.on('nuevo_despacho', onNuevoDespacho);

    return () => {
      socket.off('alerta_falla_grave', onAlertaFalla);
      socket.off('nuevo_despacho', onNuevoDespacho);
    };
  }, [user]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPanelAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSimularNotificacion = () => {
    const msg = 'Vehículo EEEE44 acaba de ser reportado como Fuera de Servicio (Alerta de prueba).';
    setAlerta(msg);
    setNotificaciones((prev) => [
      {
        id: Math.random().toString(),
        tipo: 'falla',
        titulo: '🚨 Alerta de Prueba (WebSocket)',
        mensaje: msg,
        fecha: new Date(),
      },
      ...prev,
    ]);
  };

  // Filtra el menú completo de la A a la Z
  const itemsVisibles = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.rol) : false,
  );

  return (
    <div className="app-layout">
      {alerta && <ToastAlertaGrave mensaje={alerta} onClose={() => setAlerta(null)} />}

      {/* SIDEBAR */}
      <aside className="app-layout__sidebar">
        <div className="app-layout__brand">
          <span className="app-layout__brand-eyebrow">Bomberos</span>
          <span className="app-layout__brand-title">TALCAHUANO</span>
        </div>

        <nav className="app-layout__nav">
          {itemsVisibles.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                isActive ? 'app-layout__nav-link is-active' : 'app-layout__nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="app-layout__content-wrapper">
        <header className="app-layout__topbar">
          <div className="app-layout__user">
            <span className="app-layout__user-name">{user?.nombre}</span>
            <span className="app-layout__user-role">
              {user ? ROLE_LABELS[user.rol] : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* CENTRO DE NOTIFICACIONES */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setPanelAbierto(!panelAbierto)}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-navy-900)',
                }}
                title="Centro de Notificaciones en Vivo"
              >
                <span>🔔</span>
                <span style={{ fontWeight: 600 }}>Notificaciones</span>
                {notificaciones.length > 0 && (
                  <span
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '999px',
                    }}
                  >
                    {notificaciones.length}
                  </span>
                )}
              </button>

              {/* DROPDOWN PANEL */}
              {panelAbierto && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '340px',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--color-navy-900)' }}>
                      Notificaciones en Vivo
                    </strong>
                    {notificaciones.length > 0 && (
                      <button
                        onClick={() => setNotificaciones([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.75rem',
                          color: 'var(--color-ink-600)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notificaciones.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-ink-600)', fontSize: '0.875rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📭</div>
                        No hay notificaciones recientes.<br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>
                          El WebSocket está escuchando en tiempo real.
                        </span>
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: n.tipo === 'falla' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(59, 130, 246, 0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.8125rem', color: n.tipo === 'falla' ? '#b91c1c' : '#1e40af' }}>
                              {n.titulo}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-400)' }}>
                              {n.fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-ink-900)', lineHeight: 1.35 }}>
                            {n.mensaje}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', backgroundColor: '#fafafa', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSimularNotificacion}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-navy-700)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Simular alerta de prueba en vivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="app-layout__logout" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
