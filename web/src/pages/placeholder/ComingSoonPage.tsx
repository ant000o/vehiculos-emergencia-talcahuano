interface ComingSoonPageProps {
  title: string;
}

// Página reutilizable para cualquier ítem del menú que todavía no tiene
// vista real construida. Se reemplaza por la vista definitiva cuando
// construyamos esa Historia de Usuario específica.
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--color-ink-600)' }}>
        Esta sección todavía no está construida. Próximamente.
      </p>
    </div>
  );
}
