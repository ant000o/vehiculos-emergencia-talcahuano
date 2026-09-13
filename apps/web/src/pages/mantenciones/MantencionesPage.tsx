import { useState } from 'react';
import { MantencionPreventivaForm } from './MantencionPreventivaForm';
import { RegistrarFallaForm } from './RegistrarFallaForm';
import './mantenciones.css';

type Pestana = 'falla' | 'preventiva';

export function MantencionesPage() {
  const [pestana, setPestana] = useState<Pestana>('falla');

  return (
    <div className="mantenciones-page">
      <h1 className="mantenciones-page__title">Mantenciones</h1>

      <div className="mantenciones-page__tabs">
        <button
          className={pestana === 'falla' ? 'is-active' : ''}
          onClick={() => setPestana('falla')}
        >
          Reportar falla
        </button>
        <button
          className={pestana === 'preventiva' ? 'is-active' : ''}
          onClick={() => setPestana('preventiva')}
        >
          Finalizar mantención preventiva
        </button>
      </div>

      {pestana === 'falla' ? <RegistrarFallaForm /> : <MantencionPreventivaForm />}
    </div>
  );
}
