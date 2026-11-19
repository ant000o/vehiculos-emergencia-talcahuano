import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarRoles,
  listarPermisosPorRol,
  guardarMatrizRol,
  restablecerPredeterminadosRol,
  type RolItem,
  type ModuloPermisosConfig,
} from '../../services/permisos';
import { Modal } from '../../components/Modal';
import './permisos.css';

interface ModuloDefinicion {
  key: string;
  label: string;
  icon: string;
  desc: string;
  soportaParticipacion?: boolean;
}

const MODULOS_DEFINIDOS: ModuloDefinicion[] = [
  { key: 'inicio', label: 'Inicio', icon: '🏠', desc: 'Pantalla principal y vista general del sistema' },
  { key: 'dashboard', label: 'Dashboard KPI', icon: '📊', desc: 'Métricas agregadas, gráficos e indicadores operativos' },
  { key: 'despachos', label: 'Despachos', icon: '🚨', desc: 'Registro, tripulación y despacho de emergencias', soportaParticipacion: true },
  { key: 'grifos', label: 'Grifos', icon: '🚰', desc: 'Catálogo georreferenciado y red hídrica de Talcahuano' },
  { key: 'operatividad', label: 'Historial de Estado', icon: '📋', desc: 'Inspecciones diarias y niveles de operatividad de unidades' },
  { key: 'inventario', label: 'Inventario', icon: '📦', desc: 'Kardex de artículos, repuestos y stock de bodega' },
  { key: 'mantenciones', label: 'Mantenciones', icon: '🔧', desc: 'Órdenes de trabajo preventivas y correctivas en vehículos' },
  { key: 'mapa', label: 'Mapa de Despacho', icon: '🗺️', desc: 'Geolocalización satelital en tiempo real de unidades' },
  { key: 'usuarios', label: 'Usuarios', icon: '👥', desc: 'Nómina institucional, bomberos, cargos y personal' },
  { key: 'vehiculos', label: 'Vehículos', icon: '🚒', desc: 'Ficha técnica, odómetro y operatividad de la flota' },
];

type MatrizEstado = Record<string, ModuloPermisosConfig>;

export function PermisosPage() {
  const { refrescarSesion } = useAuth();

  const [roles, setRoles] = useState<RolItem[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolItem | null>(null);
  const [matriz, setMatriz] = useState<MatrizEstado>({});
  const [matrizOriginal, setMatrizOriginal] = useState<MatrizEstado>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Modales de confirmación
  const [modalGuardarAbierto, setModalGuardarAbierto] = useState(false);
  const [modalRestablecerAbierto, setModalRestablecerAbierto] = useState(false);

  // Cargar lista de roles al montar
  useEffect(() => {
    async function init() {
      try {
        const rolesList = await listarRoles();
        const ordenDeseado = ['central', 'comandante', 'director', 'capitán', 'capitan', 'bombero', 'mecánico', 'mecanico', 'administrador'];
        const ordenados = [...rolesList].sort((a, b) => {
          const ia = ordenDeseado.indexOf(a.nombre_rol.toLowerCase().trim());
          const ib = ordenDeseado.indexOf(b.nombre_rol.toLowerCase().trim());
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        setRoles(ordenados);
        if (ordenados.length > 0) {
          const primerConfigurable = ordenados.find(r => r.nombre_rol.toLowerCase().trim() !== 'administrador') || ordenados[0];
          setRolSeleccionado(primerConfigurable);
        }
      } catch (err) {
        setMensajeError(err instanceof Error ? err.message : 'Error al cargar roles');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Cargar configuración de permisos reales desde la BD al cambiar de rol
  useEffect(() => {
    if (!rolSeleccionado) return;

    const esAdmin = rolSeleccionado.nombre_rol.toLowerCase().trim() === 'administrador';
    if (esAdmin) {
      const adminMatriz: MatrizEstado = {};
      MODULOS_DEFINIDOS.forEach((m) => {
        adminMatriz[m.key] = {
          modulo: m.key,
          ver: true,
          crear: true,
          editar: true,
          eliminar: false,
          alcance: 'GLOBAL',
        };
      });
      setMatriz(adminMatriz);
      setMatrizOriginal(adminMatriz);
      return;
    }

    async function cargarPermisosRol() {
      try {
        setMensajeError(null);
        setMensajeExito(null);
        const asignaciones = await listarPermisosPorRol(rolSeleccionado!.id_rol);

        const nuevaMatriz: MatrizEstado = {};

        MODULOS_DEFINIDOS.forEach((mod) => {
          const asignacionesModulo = asignaciones.filter((a: any) => {
            const codigo = String(a.codigo || '').toLowerCase();
            return codigo.startsWith(`${mod.key}.`);
          });

          let alcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE' = 'NONE';
          if (asignacionesModulo.length > 0) {
            const rawAlcance = String(asignacionesModulo[0].alcance || 'COMPANY').toUpperCase();
            if (rawAlcance === 'GLOBAL' || rawAlcance === 'TODAS_COMPANIAS') alcance = 'GLOBAL';
            else if (rawAlcance === 'PARTICIPATION') alcance = 'PARTICIPATION';
            else if (rawAlcance === 'NONE') alcance = 'NONE';
            else alcance = 'COMPANY';
          }

          nuevaMatriz[mod.key] = {
            modulo: mod.key,
            ver: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.view')),
            crear: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.create')),
            editar: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.update')),
            eliminar: false,
            alcance,
          };
        });

        setMatriz(nuevaMatriz);
        setMatrizOriginal(JSON.parse(JSON.stringify(nuevaMatriz)));
      } catch (err) {
        setMensajeError(err instanceof Error ? err.message : 'Error al cargar permisos del rol');
      }
    }

    cargarPermisosRol();
  }, [rolSeleccionado]);

  // Detección de cambios pendientes
  const cambiosPendientes = useMemo(() => {
    if (!rolSeleccionado || rolSeleccionado.nombre_rol.toLowerCase().trim() === 'administrador') {
      return 0;
    }
    let count = 0;
    for (const mod of MODULOS_DEFINIDOS) {
      const actual = matriz[mod.key];
      const orig = matrizOriginal[mod.key];
      if (!actual || !orig) continue;

      if (
        actual.ver !== orig.ver ||
        actual.crear !== orig.crear ||
        actual.editar !== orig.editar ||
        actual.alcance !== orig.alcance
      ) {
        count++;
      }
    }
    return count;
  }, [matriz, matrizOriginal, rolSeleccionado]);

  // Manejadores de cambios
  const handleToggle = (moduloKey: string, accion: 'ver' | 'crear' | 'editar') => {
    setMatriz((prev) => {
      const modActual = prev[moduloKey] || {
        modulo: moduloKey,
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        alcance: 'COMPANY',
      };

      const nuevoValor = !modActual[accion];
      const updated = { ...modActual, [accion]: nuevoValor, eliminar: false };

      if (nuevoValor && updated.alcance === 'NONE') {
        updated.alcance = 'COMPANY';
      }

      if (accion === 'ver' && !nuevoValor) {
        updated.crear = false;
        updated.editar = false;
        updated.alcance = 'NONE';
      }

      return { ...prev, [moduloKey]: updated };
    });
  };

  const handleChangeAlcance = (moduloKey: string, nuevoAlcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE') => {
    setMatriz((prev) => {
      const modActual = prev[moduloKey] || {
        modulo: moduloKey,
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        alcance: 'COMPANY',
      };

      const updated = { ...modActual, alcance: nuevoAlcance, eliminar: false };
      if (nuevoAlcance === 'NONE') {
        updated.ver = false;
        updated.crear = false;
        updated.editar = false;
      } else if (!updated.ver) {
        updated.ver = true;
      }

      return { ...prev, [moduloKey]: updated };
    });
  };

  // Guardar Cambios en la Matriz
  const handleConfirmarGuardar = async () => {
    if (!rolSeleccionado) return;
    setIsSaving(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const payload: ModuloPermisosConfig[] = Object.values(matriz).map((item) => ({
        ...item,
        eliminar: false,
      }));
      await guardarMatrizRol(rolSeleccionado.id_rol, payload);

      setMatrizOriginal(JSON.parse(JSON.stringify(matriz)));
      setModalGuardarAbierto(false);
      setMensajeExito(`✓ Permisos del rol ${rolSeleccionado.nombre_rol} guardados con éxito. Los cambios están activos de inmediato.`);
      await refrescarSesion();
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : 'Error al guardar la matriz de permisos');
    } finally {
      setIsSaving(false);
    }
  };

  // Restablecer Valores Predeterminados
  const handleConfirmarRestablecer = async () => {
    if (!rolSeleccionado) return;
    setIsSaving(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      await restablecerPredeterminadosRol(rolSeleccionado.id_rol);

      const asignaciones = await listarPermisosPorRol(rolSeleccionado.id_rol);
      const nuevaMatriz: MatrizEstado = {};

      MODULOS_DEFINIDOS.forEach((mod) => {
        const asignacionesModulo = asignaciones.filter((a: any) => {
          const codigo = String(a.codigo || '').toLowerCase();
          return codigo.startsWith(`${mod.key}.`);
        });

        let alcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE' = 'NONE';
        if (asignacionesModulo.length > 0) {
          const rawAlcance = String(asignacionesModulo[0].alcance || 'COMPANY').toUpperCase();
          if (rawAlcance === 'GLOBAL' || rawAlcance === 'TODAS_COMPANIAS') alcance = 'GLOBAL';
          else if (rawAlcance === 'PARTICIPATION') alcance = 'PARTICIPATION';
          else if (rawAlcance === 'NONE') alcance = 'NONE';
          else alcance = 'COMPANY';
        }

        nuevaMatriz[mod.key] = {
          modulo: mod.key,
          ver: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.view')),
          crear: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.create')),
          editar: asignacionesModulo.some((a: any) => String(a.codigo).endsWith('.update')),
          eliminar: false,
          alcance,
        };
      });

      setMatriz(nuevaMatriz);
      setMatrizOriginal(JSON.parse(JSON.stringify(nuevaMatriz)));
      setModalRestablecerAbierto(false);
      setMensajeExito(`✓ Configuración predeterminada restablecida para el rol ${rolSeleccionado.nombre_rol}.`);
      await refrescarSesion();
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : 'Error al restablecer valores');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="permisos-cargando">Cargando panel de gestión de permisos...</p>;
  }

  const esAdmin = rolSeleccionado?.nombre_rol.toLowerCase().trim() === 'administrador';

  return (
    <div className="permisos-page">
      <div className="permisos-page__header">
        <div>
          <h1 className="permisos-page__title">Gestión Centralizada de Permisos y Alcances (RBAC)</h1>
          <p className="permisos-page__desc">
            Administra con precisión los privilegios de cada rol, combinando acciones independientes (Ver, Crear, Editar) con el alcance geográfico o por compañía.
          </p>
        </div>
      </div>

      {/* Selector de Roles */}
      <div className="permisos-roles-selector" role="tablist" aria-label="Roles del sistema">
        {roles.map((r) => {
          const isActive = rolSeleccionado?.id_rol === r.id_rol;
          const isAdminRole = r.nombre_rol.toLowerCase().trim() === 'administrador';
          return (
            <button
              key={r.id_rol}
              type="button"
              className={`permisos-role-pill ${isActive ? 'permisos-role-pill--active' : ''} ${isAdminRole ? 'permisos-role-pill--admin' : ''}`}
              onClick={() => {
                if (cambiosPendientes > 0) {
                  if (!confirm('Tienes cambios pendientes sin guardar en este rol. ¿Deseas descartarlos y cambiar de rol?')) {
                    return;
                  }
                }
                setRolSeleccionado(r);
              }}
            >
              <span>{isAdminRole ? '🛡️' : '👤'}</span>
              <span>{r.nombre_rol}</span>
            </button>
          );
        })}
      </div>

      {/* Mensajes de Notificación */}
      {mensajeExito && (
        <div className="permisos-alert permisos-alert--success" role="status">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="permisos-alert permisos-alert--error" role="alert">
          ⚠️ {mensajeError}
        </div>
      )}

      {/* Banner Especial de Superadministrador */}
      {esAdmin ? (
        <div className="permisos-admin-banner">
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <strong>Rol Superadministrador Protegido:</strong> El rol <strong>Administrador</strong> posee acceso total e irrestricto (alcance GLOBAL y operaciones completas de consulta, creación y edición en todos los módulos) por regla de seguridad centralizada del backend.
          </div>
        </div>
      ) : (
        <div className="permisos-actions-bar">
          <div>
            {cambiosPendientes > 0 ? (
              <span className="permisos-pending-badge">
                ⚠️ {cambiosPendientes} {cambiosPendientes === 1 ? 'módulo modificado' : 'módulos modificados'} (pendientes de guardar)
              </span>
            ) : (
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Configuración sincronizada con la base de datos
              </span>
            )}
          </div>

          <div className="permisos-buttons-group">
            <button
              type="button"
              className="btn-restablecer"
              disabled={isSaving}
              onClick={() => setModalRestablecerAbierto(true)}
            >
              Restablecer Predeterminados
            </button>

            <button
              type="button"
              className="btn-guardar-matriz"
              disabled={isSaving || cambiosPendientes === 0}
              onClick={() => setModalGuardarAbierto(true)}
            >
              {isSaving ? 'Guardando...' : `Guardar Cambios (${cambiosPendientes})`}
            </button>
          </div>
        </div>
      )}

      {/* Matriz de Permisos (Tabla sin columna Eliminar) */}
      <div className="permisos-matrix-card">
        <table className="permisos-table">
          <thead>
            <tr>
              <th style={{ width: '34%' }}>Módulo</th>
              <th style={{ width: '11%', textAlign: 'center' }}>Ver</th>
              <th style={{ width: '11%', textAlign: 'center' }}>Crear</th>
              <th style={{ width: '11%', textAlign: 'center' }}>Editar</th>
              <th style={{ width: '33%' }}>Alcance de Información</th>
            </tr>
          </thead>
          <tbody>
            {MODULOS_DEFINIDOS.map((m) => {
              const cfg = matriz[m.key] || {
                modulo: m.key,
                ver: esAdmin,
                crear: esAdmin,
                editar: esAdmin,
                eliminar: false,
                alcance: esAdmin ? 'GLOBAL' : 'NONE',
              };

              return (
                <tr key={m.key}>
                  <td>
                    <div className="modulo-cell">
                      <span className="modulo-cell__icon">{m.icon}</span>
                      <div>
                        <div className="modulo-cell__nombre">{m.label}</div>
                        <div className="modulo-cell__desc">{m.desc}</div>
                      </div>
                    </div>
                  </td>

                  {/* Interruptor: VER */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="switch-container">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={cfg.ver}
                          disabled={esAdmin}
                          onChange={() => handleToggle(m.key, 'ver')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </td>

                  {/* Interruptor: CREAR */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="switch-container">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={cfg.crear}
                          disabled={esAdmin || !cfg.ver}
                          onChange={() => handleToggle(m.key, 'crear')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </td>

                  {/* Interruptor: EDITAR */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="switch-container">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={cfg.editar}
                          disabled={esAdmin || !cfg.ver}
                          onChange={() => handleToggle(m.key, 'editar')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </td>

                  {/* Selector de ALCANCE */}
                  <td>
                    {esAdmin ? (
                      <span className="scope-badge scope-badge--global">
                        🌐 GLOBAL (Todas las compañías)
                      </span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          className="scope-select"
                          value={cfg.alcance}
                          disabled={esAdmin}
                          onChange={(e) => handleChangeAlcance(m.key, e.target.value as any)}
                        >
                          <option value="GLOBAL">🌐 GLOBAL — Todas las compañías</option>
                          <option value="COMPANY">🏢 COMPANY — Solo su compañía</option>
                          {m.soportaParticipacion && (
                            <option value="PARTICIPATION">🚒 PARTICIPATION — Solo donde participó</option>
                          )}
                          <option value="NONE">🚫 NONE — Sin acceso</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Confirmar Guardar */}
      {modalGuardarAbierto && (
        <Modal
          title={`Confirmar actualización de permisos: ${rolSeleccionado?.nombre_rol}`}
          onClose={() => setModalGuardarAbierto(false)}
        >
          <div style={{ padding: 'var(--space-2)' }}>
            <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-ink-700)', lineHeight: 1.5 }}>
              Estás a punto de guardar <strong>{cambiosPendientes}</strong> cambios en la matriz del rol <strong>{rolSeleccionado?.nombre_rol}</strong>.
            </p>
            <p style={{ margin: '0 0 var(--space-5) 0', fontSize: '0.875rem', color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              ✓ Los cambios se aplicarán inmediatamente en el backend para todos los usuarios con este rol.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-restablecer"
                onClick={() => setModalGuardarAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-guardar-matriz"
                disabled={isSaving}
                onClick={handleConfirmarGuardar}
              >
                {isSaving ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmar Restablecer */}
      {modalRestablecerAbierto && (
        <Modal
          title={`Restablecer valores predeterminados: ${rolSeleccionado?.nombre_rol}`}
          onClose={() => setModalRestablecerAbierto(false)}
        >
          <div style={{ padding: 'var(--space-2)' }}>
            <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-ink-700)', lineHeight: 1.5 }}>
              ¿Estás seguro de restablecer los permisos y alcances del rol <strong>{rolSeleccionado?.nombre_rol}</strong> a sus valores iniciales recomendados del sistema?
            </p>
            <p style={{ margin: '0 0 var(--space-5) 0', fontSize: '0.875rem', color: '#b45309', background: '#fffbeb', padding: '10px 14px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
              ⚠️ Esta acción sobreescribirá las asignaciones personalizadas de este rol.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-restablecer"
                onClick={() => setModalRestablecerAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-guardar-matriz"
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                disabled={isSaving}
                onClick={handleConfirmarRestablecer}
              >
                {isSaving ? 'Restableciendo...' : 'Restablecer Ahora'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}