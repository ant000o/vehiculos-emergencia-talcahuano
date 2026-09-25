import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { NAV_ITEMS, ROLE_LABELS } from '../config/navigation';
import './AppLayout.css';

export function AppLayout() {
  const { user, logout } = useAuth();

  // Filtra el menú completo, dejando solo lo que el rol actual puede ver.
  // Si mañana agregan un rol nuevo o cambian permisos, esto no se toca:
  // solo se ajusta la lista en config/navigation.ts.
  const itemsVisibles = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.rol) : false,
  );

  return (
    <div className="app-layout">
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

      <div className="app-layout__content-wrapper">
        <header className="app-layout__topbar">
          <div className="app-layout__user">
            <span className="app-layout__user-name">{user?.nombre}</span>
            <span className="app-layout__user-role">
              {user ? ROLE_LABELS[user.rol] : ''}
            </span>
          </div>
          <button className="app-layout__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </header>

        <main className="app-layout__content">
          {/* Acá React Router inserta la página que corresponda a la URL actual */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
