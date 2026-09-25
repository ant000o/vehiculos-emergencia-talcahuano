import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { NAV_ITEMS, ROLE_LABELS } from '../config/navigation';

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Accesos rápidos: reutiliza la misma config del sidebar, filtrada igual,
  // así nunca queda desincronizado con lo que el usuario realmente puede ver.
  const accesos = NAV_ITEMS.filter(
    (item) => item.path !== '/' && item.roles.includes(user.rol),
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)', marginBottom: 4 }}>
        Hola, {user.nombre}
      </h1>
      <p style={{ color: 'var(--color-ink-600)', marginTop: 0 }}>
        Sesión activa como <strong>{ROLE_LABELS[user.rol]}</strong>.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        {accesos.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-navy-900)',
              background: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              textDecoration: 'none',
            }}
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
