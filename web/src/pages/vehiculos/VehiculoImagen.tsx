import { useState } from 'react';

interface VehiculoImagenProps {
  /** URL de la foto del vehículo (cuando el backend la entregue). */
  src?: string | null;
  alt: string;
}

/**
 * Foto del vehículo. Mientras no haya imagen cargada en la BD (o si falla la
 * carga), muestra una ilustración de carro bomba para que la tarjeta no quede vacía.
 */
export function VehiculoImagen({ src, alt }: VehiculoImagenProps) {
  const [falla, setFalla] = useState(false);

  if (src && !falla) {
    return <img className="vehiculo-card__img" src={src} alt={alt} loading="lazy" onError={() => setFalla(true)} />;
  }

  return (
    <svg
      className="vehiculo-card__img vehiculo-card__img--placeholder"
      viewBox="0 0 320 180"
      role="img"
      aria-label={`${alt} (imagen referencial)`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="vc-fondo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f3a63" />
          <stop offset="1" stopColor="#0f1f38" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#vc-fondo)" />
      <rect y="142" width="320" height="38" fill="#0a1628" />
      {/* carrocería */}
      <rect x="52" y="78" width="150" height="62" rx="4" fill="#c1272d" />
      <path d="M202 96h34l22 22v22h-56z" fill="#9e1f24" />
      <path d="M212 102h20l14 14h-34z" fill="#bcd2ea" opacity="0.85" />
      {/* franja y compartimentos */}
      <rect x="52" y="116" width="150" height="6" fill="#f3f5f8" opacity="0.9" />
      <rect x="62" y="86" width="32" height="24" rx="2" fill="#7f1a1f" />
      <rect x="100" y="86" width="32" height="24" rx="2" fill="#7f1a1f" />
      <rect x="138" y="86" width="32" height="24" rx="2" fill="#7f1a1f" />
      {/* escala */}
      <rect x="58" y="66" width="138" height="5" rx="2" fill="#cbd5e1" />
      <path d="M70 66v12M90 66v12M110 66v12M130 66v12M150 66v12M170 66v12M190 66v12" stroke="#94a3b8" strokeWidth="2" />
      {/* barra de luces */}
      <rect x="208" y="90" width="22" height="6" rx="2" fill="#f87171" />
      {/* ruedas */}
      <circle cx="94" cy="142" r="17" fill="#111827" />
      <circle cx="94" cy="142" r="7" fill="#9aa3af" />
      <circle cx="226" cy="142" r="17" fill="#111827" />
      <circle cx="226" cy="142" r="7" fill="#9aa3af" />
    </svg>
  );
}
