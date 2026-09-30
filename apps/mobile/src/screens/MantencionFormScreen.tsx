import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { crearMantencion } from '../services/mantencion.service';
import { listarUsuarios } from '../services/usuario.service';
import { TipoMantencion } from '../types/mantencion';
import { Vehiculo } from '../types/vehiculo';
import { Usuario } from '../types/auth';

const OPCIONES_TIPO: { valor: TipoMantencion; label: string; descripcion: string }[] = [
  {
    valor: TipoMantencion.PREVENTIVA,
    label: 'Preventiva',
    descripcion: 'Mantención programada, sin falla reportada',
  },
  {
    valor: TipoMantencion.CORRECTIVA,
    label: 'Reactiva',
    descripcion: 'Se reporta y corrige una falla existente',
  },
];

type ModoResponsable = 'mecanico' | 'taller';

export default function MantencionFormScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;
  const { usuario } = useAuth();

  const [tipo, setTipo] = useState<TipoMantencion>(TipoMantencion.PREVENTIVA);
  const [descripcionFalla, setDescripcionFalla] = useState('');

  const [modoResponsable, setModoResponsable] = useState<ModoResponsable>('mecanico');
  const [mecanicos, setMecanicos] = useState<Usuario[]>([]);
  const [idMecanico, setIdMecanico] = useState<number | null>(null);
  const [tallerExterno, setTallerExterno] = useState('');
  const [cargandoMecanicos, setCargandoMecanicos] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: `Nueva mantención — ${vehiculo.patente}` });

    async function cargarMecanicos() {
      try {
        const todos = await listarUsuarios();
        const soloMecanicos = todos.filter(
          (u) => u.rol.nombre_rol === 'mecanico' && u.estado_activo,
        );
        setMecanicos(soloMecanicos);
        const yoMismo = soloMecanicos.find((m) => m.id_usuario === usuario?.id_usuario);
        setIdMecanico(yoMismo ? yoMismo.id_usuario : soloMecanicos[0]?.id_usuario ?? null);
      } catch {
        setError('No se pudo cargar el listado de mecánicos.');
      } finally {
        setCargandoMecanicos(false);
      }
    }
    cargarMecanicos();
  }, []);

  function validar(): string | null {
    if (tipo === TipoMantencion.CORRECTIVA && !descripcionFalla.trim()) {
      return 'Describe la falla detectada para una mantención reactiva.';
    }
    if (modoResponsable === 'mecanico' && !idMecanico) {
      return 'Selecciona el mecánico responsable.';
    }
    if (modoResponsable === 'taller' && !tallerExterno.trim()) {
      return 'Ingresa el nombre del taller externo.';
    }
    return null;
  }

  async function handleGuardar() {
    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      const nuevaMantencion = await crearMantencion({
        tipo_mantencion: tipo,
        id_vehiculo: vehiculo.id_vehiculo,
        ...(descripcionFalla.trim() !== '' && { descripcion_falla: descripcionFalla.trim() }),
        ...(modoResponsable === 'mecanico'
          ? { id_usuario_mecanico: idMecanico! }
          : { taller_externo: tallerExterno.trim() }),
      });
      navigation.replace('MantencionDetalle', { mantencion: nuevaMantencion, vehiculo });
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo registrar la mantención.';
      setError(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Text style={styles.label}>Tipo de mantención</Text>
          <View style={styles.opciones}>
            {OPCIONES_TIPO.map((op) => {
              const seleccionado = tipo === op.valor;
              return (
                <TouchableOpacity
                  key={op.valor}
                  style={[styles.opcionCard, seleccionado && styles.opcionCardSeleccionada]}
                  onPress={() => setTipo(op.valor)}
                >
                  <Text style={[styles.opcionLabel, seleccionado && styles.opcionLabelSeleccionado]}>
                    {op.label}
                  </Text>
                  <Text style={styles.opcionDescripcion}>{op.descripcion}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>
            Descripción de la falla {tipo === TipoMantencion.CORRECTIVA ? '(obligatoria)' : '(opcional)'}
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultilinea]}
            value={descripcionFalla}
            onChangeText={setDescripcionFalla}
            multiline
            numberOfLines={4}
            placeholder="Ej: fuga de aceite en motor, freno trasero desgastado..."
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Responsable de la mantención</Text>
          <View style={styles.opciones}>
            <TouchableOpacity
              style={[styles.opcionCard, modoResponsable === 'mecanico' && styles.opcionCardSeleccionada]}
              onPress={() => setModoResponsable('mecanico')}
            >
              <Text
                style={[
                  styles.opcionLabel,
                  modoResponsable === 'mecanico' && styles.opcionLabelSeleccionado,
                ]}
              >
                Mecánico
              </Text>
              <Text style={styles.opcionDescripcion}>Un mecánico de la compañía</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.opcionCard, modoResponsable === 'taller' && styles.opcionCardSeleccionada]}
              onPress={() => setModoResponsable('taller')}
            >
              <Text
                style={[
                  styles.opcionLabel,
                  modoResponsable === 'taller' && styles.opcionLabelSeleccionado,
                ]}
              >
                Taller externo
              </Text>
              <Text style={styles.opcionDescripcion}>Se deriva fuera de la compañía</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separadorInterno} />

          {modoResponsable === 'mecanico' ? (
            cargandoMecanicos ? (
              <ActivityIndicator color="#B91C1C" style={{ marginTop: 4 }} />
            ) : mecanicos.length === 0 ? (
              <Text style={styles.avisoTexto}>No hay mecánicos activos registrados.</Text>
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={idMecanico} onValueChange={(v) => setIdMecanico(v)}>
                  {mecanicos.map((m) => (
                    <Picker.Item
                      key={m.id_usuario}
                      label={`${m.nombre} ${m.apellidos}`}
                      value={m.id_usuario}
                    />
                  ))}
                </Picker>
              </View>
            )
          ) : (
            <TextInput
              style={styles.input}
              value={tallerExterno}
              onChangeText={setTallerExterno}
              placeholder="Nombre del taller externo"
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Registrar mantención</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { padding: 16, paddingBottom: 40 },
  error: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  opciones: { flexDirection: 'row', gap: 10 },
  opcionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  opcionCardSeleccionada: { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' },
  opcionLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  opcionLabelSeleccionado: { color: '#B91C1C' },
  opcionDescripcion: { fontSize: 11, color: '#666', marginTop: 4 },
  separadorInterno: { height: 16 },
  avisoTexto: { fontSize: 13, color: '#666' },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputMultilinea: { minHeight: 90, textAlignVertical: 'top' },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
