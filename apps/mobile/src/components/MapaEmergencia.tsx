import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  latitud: number;
  longitud: number;
  emoji: string;
  alto?: number;
}

// Mapa fijo (sin interacción) con Leaflet + OpenStreetMap y el emoji de la
// emergencia sobre el lugar. Es liviano para poder mostrar varios en una lista.
export default function MapaEmergencia({ latitud, longitud, emoji, alto = 150 }: Props) {
  const html = useMemo(
    () => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #m { height: 100%; margin: 0; padding: 0; background: #E5E7EB; }
  .e { width: 40px; height: 40px; border-radius: 50%; background: #fff; border: 3px solid #B91C1C;
       box-shadow: 0 2px 6px rgba(0,0,0,.4); display: flex; align-items: center;
       justify-content: center; font-size: 20px; }
  .leaflet-control-attribution { font-size: 8px; }
</style>
</head><body>
<div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var p = [${Number(latitud)}, ${Number(longitud)}];
  var m = L.map('m', {
    zoomControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
    scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false
  }).setView(p, 15);
  m.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
  L.marker(p, {
    icon: L.divIcon({ className: '', html: '<div class="e">${emoji}</div>', iconSize: [40, 40], iconAnchor: [20, 20] }),
    interactive: false
  }).addTo(m);
</script>
</body></html>`,
    [latitud, longitud, emoji],
  );

  return (
    <View style={[styles.caja, { height: alto }]} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://sigev.bomberos.local' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { width: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#E5E7EB' },
});
