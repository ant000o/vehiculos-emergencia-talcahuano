import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { listarGrifos } from '../services/grifo.service';
import { Grifo, EstadoGrifo } from '../types/grifo';

const ESTADO_COLOR_PIN: Record<EstadoGrifo, string> = {
  [EstadoGrifo.OPERATIVO]: '#16A34A',
  [EstadoGrifo.EN_MANTENCION]: '#D97706',
  [EstadoGrifo.FUERA_DE_SERVICIO]: '#DC2626',
};

const ESTADO_LABEL: Record<EstadoGrifo, string> = {
  [EstadoGrifo.OPERATIVO]: 'Operativo',
  [EstadoGrifo.EN_MANTENCION]: 'En mantención',
  [EstadoGrifo.FUERA_DE_SERVICIO]: 'Fuera de servicio',
};

// Centro por defecto: Talcahuano, Chile (solo si no hay grifos ni ubicación).
const CENTRO_DEFECTO: [number, number] = [-36.7196, -73.1168];

// El mapa se dibuja con Leaflet dentro de un WebView: es la misma tecnología
// que usa la web (Leaflet + OpenStreetMap), no requiere API key de Google y
// funciona igual en Expo Go.
function construirHtml(
  grifos: Grifo[],
  yo: [number, number] | null,
): string {
  const puntos = grifos
    .filter((g) => g.coordenadas)
    .map((g) => {
      const [lat, lng] = g.coordenadas.coordinates;
      return {
        id: g.id_grifo,
        lat,
        lng,
        titulo: g.direccion ?? `Grifo #${g.id_grifo}`,
        estado: ESTADO_LABEL[g.estado_operativo],
        color: ESTADO_COLOR_PIN[g.estado_operativo],
      };
    });

  const datos = JSON.stringify({ puntos, yo, centro: CENTRO_DEFECTO }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #mapa { height: 100%; margin: 0; padding: 0; }
  .pin { width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 1px 5px rgba(0,0,0,.45); }
  .yo { width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,.25); }
  .popup-titulo { font: 600 14px sans-serif; margin-bottom: 2px; }
  .popup-estado { font: 12px sans-serif; color: #555; margin-bottom: 8px; }
  .popup-boton { background: #B91C1C; color: #fff; border: 0; border-radius: 8px; padding: 7px 12px; font: 600 13px sans-serif; width: 100%; }
  #btnUbicacion { position: absolute; top: 12px; right: 12px; z-index: 1000; background: #fff; border: 0; border-radius: 8px; padding: 10px 12px; font: 600 12px sans-serif; box-shadow: 0 1px 5px rgba(0,0,0,.3); display: none; }
</style>
</head>
<body>
<div id="mapa"></div>
<button id="btnUbicacion">Mi ubicación</button>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var D = ${datos};
  var mapa = L.map('mapa', { zoomControl: true }).setView(D.centro, 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);

  function enviar(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  window.abrirDetalle = function (id) { enviar({ tipo: 'detalle', id: id }); };

  var limites = [];
  D.puntos.forEach(function (p) {
    var icono = L.divIcon({
      className: '',
      html: '<div class="pin" style="background:' + p.color + '"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    L.marker([p.lat, p.lng], { icon: icono }).addTo(mapa).bindPopup(
      '<div class="popup-titulo">' + p.titulo + '</div>' +
      '<div class="popup-estado">' + p.estado + '</div>' +
      '<button class="popup-boton" onclick="abrirDetalle(' + p.id + ')">Ver detalle</button>'
    );
    limites.push([p.lat, p.lng]);
  });

  if (D.yo) {
    L.marker(D.yo, {
      icon: L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
      interactive: false
    }).addTo(mapa);
    limites.push(D.yo);
    var btn = document.getElementById('btnUbicacion');
    btn.style.display = 'block';
    btn.onclick = function () { mapa.setView(D.yo, 16); };
  }

  if (limites.length > 0) {
    mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 });
  }
</script>
</body>
</html>`;
}

export default function GrifosListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [yo, setYo] = useState<[number, number] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargarGrifos() {
    try {
      const data = await listarGrifos();
      setGrifos(data);
      setError(null);
    } catch {
      setError('No se pudo cargar el listado de grifos.');
      return;
    }

    // La ubicación es opcional: si falla o se rechaza, el mapa igual se muestra.
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setYo([pos.coords.latitude, pos.coords.longitude]);
      } else {
        setYo(null);
      }
    } catch {
      setYo(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      cargarGrifos().finally(() => setCargando(false));
    }, []),
  );

  const html = useMemo(() => construirHtml(grifos, yo), [grifos, yo]);

  function onMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.tipo === 'detalle') {
        const grifo = grifos.find((g) => g.id_grifo === msg.id);
        if (grifo) navigation.navigate('GrifoDetalle', { grifo });
      }
    } catch {
      // mensaje inválido: se ignora
    }
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.contenedor}>
      {error && <Text style={styles.error}>{error}</Text>}

      <WebView
        style={styles.mapa}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://sigev.bomberos.local' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#B91C1C" />
          </View>
        )}
      />

      <View style={[styles.leyenda, { bottom: insets.bottom + 16 }]}>
        {(Object.keys(ESTADO_COLOR_PIN) as EstadoGrifo[]).map((estado) => (
          <View key={estado} style={styles.leyendaItem}>
            <View style={[styles.leyendaPunto, { backgroundColor: ESTADO_COLOR_PIN[estado] }]} />
            <Text style={styles.leyendaTexto}>{ESTADO_LABEL[estado]}</Text>
          </View>
        ))}
      </View>

      {!yo && (
        <View style={styles.avisoUbicacion}>
          <Text style={styles.avisoTexto}>
            Sin acceso a tu ubicación: el mapa no muestra dónde estás.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  mapa: { flex: 1 },
  leyenda: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  leyendaPunto: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  leyendaTexto: { fontSize: 11, color: '#333' },
  avisoUbicacion: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    padding: 8,
  },
  avisoTexto: { fontSize: 11, color: '#854D0E', textAlign: 'center' },
});
