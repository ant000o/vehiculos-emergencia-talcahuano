import { useAuth } from '../context/useAuth';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: 'var(--space-8)', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)' }}>
        Bienvenido{user ? `, ${user.nombre}` : ''}
      </h1>
      <p style={{ color: 'var(--color-ink-600)' }}>
        Sesión iniciada correctamente (datos de prueba). Aquí irá la próxima
        vista del sistema.
      </p>
      <button
        onClick={logout}
        style={{
          fontFamily: 'var(--font-body)',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
