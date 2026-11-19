import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './LoginPage.css';
import escudoBombero from '../../public/escudo_bombero.png';

interface FormErrors {
  email?: string;
  password?: string;
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginPage() {
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validar(): boolean {
    const errors: FormErrors = {};
    if (!email.trim()) errors.email = 'Ingresa tu correo institucional.';
    else if (!validarEmail(email)) errors.email = 'Ingresa un correo válido.';
    if (!password) errors.password = 'Ingresa tu contraseña.';
    else if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validar()) return;
    try {
      await login({ email, password });
      navigate('/');
    } catch {
      // El mensaje ya queda expuesto vía authError.
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-screen__brand" aria-hidden="true">
        <div className="login-screen__brand-content">
          <div className="login-screen__brand-lockup">
            <img
              src={escudoBombero}
              alt="Escudo Cuerpo de Bomberos de Talcahuano"
              className="login-screen__logo"
            />
            <div className="login-screen__brand-titles">
              <span className="login-screen__eyebrow">Cuerpo de Bomberos</span>
              <h1 className="login-screen__wordmark">TALCAHUANO</h1>
            </div>
          </div>
          <p className="login-screen__tagline">
            Sistema institucional de control, seguimiento y administración de vehículos de emergencia.
          </p>
          <div className="login-screen__brand-badge">
            🛡️ Central de Operaciones y Comandancia
          </div>
        </div>
      </aside>
      <main className="login-screen__form-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate aria-labelledby="login-heading">
          <h2 id="login-heading" className="login-form__title">Iniciar sesión</h2>
          <p className="login-form__subtitle">Ingresa con tu cuenta institucional para acceder al sistema.</p>
          {authError && <p className="login-form__alert" role="alert">{authError}</p>}
          <div className="login-form__field">
            <label htmlFor="email">Correo institucional</label>
            <input id="email" name="email" type="email" autoComplete="username" placeholder='juan.lopez@bomberos-talcahuano.cl' value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(formErrors.email)}
              aria-describedby={formErrors.email ? 'email-error' : undefined} />
            {formErrors.email && <span className="login-form__field-error" id="email-error">{formErrors.email}</span>}
          </div>
          <div className="login-form__field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(formErrors.password)}
              aria-describedby={formErrors.password ? 'password-error' : undefined} />
            {formErrors.password && <span className="login-form__field-error" id="password-error">{formErrors.password}</span>}
          </div>
          <button type="submit" className="login-form__submit" disabled={isLoading}>
            {isLoading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </main>
    </div>
  );
}
