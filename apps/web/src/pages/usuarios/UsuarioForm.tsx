import { useState, type FormEvent } from 'react';
import type { RolOption, CompaniaOption, Usuario } from '../../services/usuarios';

interface UsuarioFormValues {
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  id_rol: number;
  id_compania: number;
}

interface UsuarioFormProps {
  /** Si viene un usuario, el formulario opera en modo edición (sin campo password). */
  usuarioExistente?: Usuario;
  roles: RolOption[];
  companias: CompaniaOption[];
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (values: UsuarioFormValues) => void;
  onCancel: () => void;
}

interface FormErrors {
  rut?: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  password?: string;
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function UsuarioForm({
  usuarioExistente,
  roles,
  companias,
  isSaving,
  serverError,
  onSubmit,
  onCancel,
}: UsuarioFormProps) {
  const esEdicion = usuarioExistente !== undefined;

  const [rut, setRut] = useState(usuarioExistente?.rut ?? '');
  const [nombre, setNombre] = useState(usuarioExistente?.nombre ?? '');
  const [apellidos, setApellidos] = useState(usuarioExistente?.apellidos ?? '');
  const [email, setEmail] = useState(usuarioExistente?.email ?? '');
  const [password, setPassword] = useState('');
  const [idRol, setIdRol] = useState(usuarioExistente?.id_rol ?? roles[0]?.id_rol ?? 0);
  const [idCompania, setIdCompania] = useState(
    usuarioExistente?.id_compania ?? companias[0]?.id_compania ?? 0,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function validar(): boolean {
    const nuevosErrores: FormErrors = {};
    if (!rut.trim()) nuevosErrores.rut = 'Ingresa el RUT.';
    if (!nombre.trim()) nuevosErrores.nombre = 'Ingresa el nombre.';
    if (!apellidos.trim()) nuevosErrores.apellidos = 'Ingresa los apellidos.';
    if (!email.trim()) nuevosErrores.email = 'Ingresa el correo.';
    else if (!validarEmail(email)) nuevosErrores.email = 'Correo inválido.';
    if (!esEdicion && password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validar()) return;
    onSubmit({ rut, nombre, apellidos, email, password, id_rol: idRol, id_compania: idCompania });
  }

  return (
    <form className="usuarios-form" onSubmit={handleSubmit} noValidate>
      <h2 className="usuarios-form__title">
        {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
      </h2>

      {serverError && (
        <p className="usuarios-form__alert" role="alert">
          {serverError}
        </p>
      )}

      <div className="usuarios-form__row">
        <div className="usuarios-form__field">
          <label htmlFor="rut">RUT</label>
          <input
            id="rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12345678-9 (sin puntos)"
            maxLength={12}
            aria-invalid={Boolean(errors.rut)}
          />
          {errors.rut && <span className="usuarios-form__error">{errors.rut}</span>}
        </div>

        <div className="usuarios-form__field">
          <label htmlFor="email">Correo institucional</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="usuarios-form__error">{errors.email}</span>}
        </div>
      </div>

      <div className="usuarios-form__row">
        <div className="usuarios-form__field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={Boolean(errors.nombre)}
          />
          {errors.nombre && <span className="usuarios-form__error">{errors.nombre}</span>}
        </div>

        <div className="usuarios-form__field">
          <label htmlFor="apellidos">Apellidos</label>
          <input
            id="apellidos"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            aria-invalid={Boolean(errors.apellidos)}
          />
          {errors.apellidos && <span className="usuarios-form__error">{errors.apellidos}</span>}
        </div>
      </div>

      {!esEdicion && (
        <div className="usuarios-form__field">
          <label htmlFor="password">Contraseña inicial</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <span className="usuarios-form__error">{errors.password}</span>}
        </div>
      )}

      <div className="usuarios-form__row">
        <div className="usuarios-form__field">
          <label htmlFor="rol">Rol</label>
          <select id="rol" value={idRol} onChange={(e) => setIdRol(Number(e.target.value))}>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre_rol}
              </option>
            ))}
          </select>
        </div>

        <div className="usuarios-form__field">
          <label htmlFor="compania">Compañía</label>
          <select
            id="compania"
            value={idCompania}
            onChange={(e) => setIdCompania(Number(e.target.value))}
          >
            {companias.map((c) => (
              <option key={c.id_compania} value={c.id_compania}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="usuarios-form__actions">
        <button type="button" className="usuarios-form__cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="usuarios-form__submit" disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
