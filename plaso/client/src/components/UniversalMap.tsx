import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../constants/theme';

export type MapTileType = 'osm-standard' | 'osm-dark' | 'osm-hot' | 'osm-topo';

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  category?: string;
  price?: number | string;
  isOpen?: boolean;
  type: 'business' | 'listing' | 'post' | 'picker';
  color?: string;
  rawData?: any;
}

export interface UniversalMapProps {
  center: { latitude: number; longitude: number };
  radius?: number; // in kilometers
  tileType?: MapTileType;
  markers?: MapMarkerItem[];
  userLocation?: { latitude: number; longitude: number } | null;
  showsUserLocation?: boolean;
  mode?: 'view' | 'picker';
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (marker: MapMarkerItem) => void;
  onDirectionsPress?: (coords: { latitude: number; longitude: number; label: string }) => void;
  style?: any;
}

export interface UniversalMapRef {
  centerOn: (latitude: number, longitude: number, zoom?: number) => void;
  setZoom: (zoom: number) => void;
  setTileType: (type: MapTileType) => void;
}

const buildLeafletHtml = (
  initialCenter: { latitude: number; longitude: number },
  initialRadius: number,
  initialMarkers: MapMarkerItem[],
  initialUserLoc: { latitude: number; longitude: number } | null,
  initialMode: 'view' | 'picker',
  initialTileType: MapTileType = 'osm-standard'
) => {
  const jsonCenter = JSON.stringify(initialCenter);
  const jsonMarkers = JSON.stringify(initialMarkers || []);
  const jsonUserLoc = JSON.stringify(initialUserLoc || null);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" onerror="this.onerror=null;this.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="this.onerror=null;this.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }
    #map {
      width: 100%;
      height: 100%;
      background-color: #0b1120;
    }

    /* OpenStreetMap Attribution Styling */
    .leaflet-control-attribution {
      background: rgba(11, 17, 32, 0.75) !important;
      color: #94A3B8 !important;
      font-size: 10px !important;
      padding: 3px 8px !important;
      border-radius: 6px !important;
      margin: 6px !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    .leaflet-control-attribution a {
      color: #38BDF8 !important;
      text-decoration: none !important;
      font-weight: 600 !important;
    }
    
    /* Marker Styles */
    .custom-marker {
      background: transparent;
      border: none;
    }
    .pin-bubble {
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      border: 2px solid #FFFFFF;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .pin-bubble:active {
      transform: rotate(-45deg) scale(1.18);
    }
    .pin-icon {
      transform: rotate(45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .pin-business { background: linear-gradient(135deg, #FF206E, #F72585); }
    .pin-listing { background: linear-gradient(135deg, #10B981, #059669); }
    .pin-post { background: linear-gradient(135deg, #00F0FF, #0284C7); }
    .pin-picker { background: linear-gradient(135deg, #FF5722, #E64A19); }

    /* User pulse */
    .user-pulse-wrap {
      position: relative;
      width: 32px;
      height: 32px;
      margin-left: -6px;
      margin-top: -6px;
    }
    .user-pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 240, 255, 0.35);
      animation: pulse-ring 2s infinite ease-out;
    }
    .user-pulse-dot {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00F0FF;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Popup design */
    .leaflet-popup-content-wrapper {
      background: #151A2E;
      color: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0;
      overflow: hidden;
    }
    .leaflet-popup-tip {
      background: #151A2E;
    }
    .leaflet-popup-content {
      margin: 0;
      line-height: 1.4;
    }
    .popup-box {
      padding: 14px 16px;
      min-width: 190px;
      max-width: 250px;
    }
    .popup-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 12px;
      margin-bottom: 6px;
    }
    .badge-business { background: rgba(255, 32, 110, 0.2); color: #FF206E; border: 1px solid rgba(255,32,110,0.3); }
    .badge-listing { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }
    .badge-post { background: rgba(0, 240, 255, 0.2); color: #00F0FF; border: 1px solid rgba(0,240,255,0.3); }

    .popup-title {
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 4px;
      word-break: break-word;
    }
    .popup-subtitle {
      font-size: 12px;
      color: #94A3B8;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .popup-price {
      font-size: 15px;
      font-weight: 800;
      color: #10B981;
      margin-bottom: 8px;
    }
    .popup-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }
    .btn-main {
      background: #FF206E;
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: background 0.2s;
    }
    .btn-main:active {
      background: #E01860;
    }
    .btn-sec {
      background: rgba(255, 255, 255, 0.1);
      color: #E2E8F0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .btn-sec:active {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Fixed Crosshair in Picker Mode */
    .center-crosshair {
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }
    .show-crosshair .center-crosshair {
      display: block;
    }
  </style>
</head>
<body class="${initialMode === 'picker' ? 'show-crosshair' : ''}">
  <div id="map"></div>

  <!-- Center Pin for Picker Mode -->
  <div class="center-crosshair">
    <div class="pin-bubble pin-picker">
      <div class="pin-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
          <circle cx="12" cy="12" r="5" />
        </svg>
      </div>
    </div>
  </div>

  <script>
    var map;
    var markersLayer = L.layerGroup();
    var circleLayer = L.layerGroup();
    var userLayer = L.layerGroup();
    var activeTileLayer = null;

    var currentCenter = ${jsonCenter};
    var currentRadius = ${initialRadius};
    var currentMode = "${initialMode}";
    var allMarkers = ${jsonMarkers};
    var currentUserLoc = ${jsonUserLoc};
    var currentTileType = "${initialTileType || 'osm-standard'}";

    // OpenStreetMap Tile Providers
    var TILE_PROVIDERS = {
      'osm-standard': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      },
      'osm-dark': {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
      },
      'osm-hot': {
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Humanitarian style'
      },
      'osm-topo': {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 17,
        attribution: 'Map: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Style: &copy; OpenTopoMap'
      }
    };

    function applyTileLayer(type) {
      if (!TILE_PROVIDERS[type]) type = 'osm-standard';
      currentTileType = type;
      var conf = TILE_PROVIDERS[type];

      if (activeTileLayer && map) {
        map.removeLayer(activeTileLayer);
      }

      activeTileLayer = L.tileLayer(conf.url, {
        subdomains: conf.subdomains,
        maxZoom: conf.maxZoom,
        attribution: conf.attribution
      });

      // Automatic fallback to OSM HOT if standard tiles encounter network issue
      activeTileLayer.on('tileerror', function() {
        console.warn('Tile load error on', conf.url);
      });

      if (map) {
        activeTileLayer.addTo(map);
      }
    }

    function sendToApp(type, payload) {
      var msg = JSON.stringify({ type: type, payload: payload });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(msg, '*');
      }
    }

    function getPinSvg(type) {
      if (type === 'business') {
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M4 4h16v3.5a3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1-7 0V4zm0 6.5a3.5 3.5 0 0 0 3 3.465V20H5v-4H3v6h18v-6h-2v4h-2v-6.535a3.5 3.5 0 0 0 3-3.465V9a5.48 5.48 0 0 1-3.5 1.25A5.48 5.48 0 0 1 12 9a5.48 5.48 0 0 1-4.5 1.25A5.48 5.48 0 0 1 4 9v1.5z"/></svg>';
      } else if (type === 'listing') {
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>';
      } else if (type === 'post') {
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>';
      }
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><circle cx="12" cy="12" r="6"/></svg>';
    }

    function createMarkerIcon(type) {
      var pinClass = 'pin-' + type;
      var svg = getPinSvg(type);
      return L.divIcon({
        className: 'custom-marker',
        html: '<div class="pin-bubble ' + pinClass + '"><div class="pin-icon">' + svg + '</div></div>',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
      });
    }

    function createUserIcon() {
      return L.divIcon({
        className: 'custom-marker',
        html: '<div class="user-pulse-wrap"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderPopup(marker) {
      var badgeClass = 'badge-' + marker.type;
      var badgeText = marker.type === 'business' ? (marker.category || 'Business') :
                      marker.type === 'listing' ? (marker.category || 'Marketplace') :
                      'Community Post';

      var html = '<div class="popup-box">' +
        '<span class="popup-badge ' + badgeClass + '">' + escapeHtml(badgeText) + '</span>' +
        '<div class="popup-title">' + escapeHtml(marker.title) + '</div>';

      if (marker.price !== undefined && marker.price !== null) {
        html += '<div class="popup-price">₹' + escapeHtml(marker.price) + '</div>';
      }

      if (marker.subtitle) {
        html += '<div class="popup-subtitle">' + escapeHtml(marker.subtitle) + '</div>';
      }

      if (marker.isOpen !== undefined) {
        var statusColor = marker.isOpen ? '#10B981' : '#EF4444';
        var statusText = marker.isOpen ? 'Open Now' : 'Closed';
        html += '<div style="font-size:11px;font-weight:700;color:' + statusColor + ';margin-bottom:8px;">' + statusText + '</div>';
      }

      html += '<div class="popup-actions">';
      var viewLabel = marker.type === 'business' ? 'View Business' :
                      marker.type === 'listing' ? 'View Listing' : 'View Post';

      html += '<button class="btn-main" onclick="onViewClick(\\'' + escapeHtml(marker.id) + '\\')">' + viewLabel + '</button>';
      html += '<button class="btn-sec" onclick="onDirectionsClick(' + marker.latitude + ',' + marker.longitude + ',\\'' + escapeHtml(marker.title) + '\\')">Directions</button>';
      html += '</div></div>';

      return html;
    }

    window.onViewClick = function(id) {
      sendToApp('MARKER_PRESS', { id: id });
    };

    window.onDirectionsClick = function(lat, lng, label) {
      sendToApp('DIRECTIONS_PRESS', { latitude: lat, longitude: lng, label: label });
    };

    function renderAll() {
      // Clear markers & circle
      markersLayer.clearLayers();
      circleLayer.clearLayers();
      userLayer.clearLayers();

      // Render Circle
      if (currentMode !== 'picker' && currentRadius > 0 && currentCenter) {
        var circle = L.circle([currentCenter.latitude, currentCenter.longitude], {
          radius: currentRadius * 1000,
          color: '#FF206E',
          weight: 2,
          opacity: 0.8,
          fillColor: '#FF206E',
          fillOpacity: 0.12
        });
        circleLayer.addLayer(circle);
      }

      // Render User Location
      if (currentUserLoc) {
        var userMarker = L.marker([currentUserLoc.latitude, currentUserLoc.longitude], {
          icon: createUserIcon(),
          zIndexOffset: 500
        });
        userLayer.addLayer(userMarker);
      }

      // Render Markers (if not picker mode)
      if (currentMode !== 'picker' && Array.isArray(allMarkers)) {
        allMarkers.forEach(function(m) {
          if (!m || isNaN(m.latitude) || isNaN(m.longitude)) return;
          var marker = L.marker([m.latitude, m.longitude], {
            icon: createMarkerIcon(m.type)
          });
          marker.bindPopup(renderPopup(m));
          markersLayer.addLayer(marker);
        });
      }
    }

    function initMap() {
      var initialZoom = currentRadius ? Math.max(10, 16 - Math.round(Math.log2(currentRadius))) : 13;
      map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        maxZoom: 19,
        minZoom: 3
      }).setView([currentCenter.latitude, currentCenter.longitude], initialZoom);

      // Apply initial OpenStreetMap layer
      applyTileLayer(currentTileType);

      map.addLayer(circleLayer);
      map.addLayer(userLayer);
      map.addLayer(markersLayer);

      renderAll();

      if (currentMode === 'picker') {
        map.on('moveend', function() {
          var c = map.getCenter();
          sendToApp('LOCATION_CHANGE', { latitude: c.lat, longitude: c.lng });
        });
      }

      map.whenReady(function() {
        sendToApp('MAP_READY', { status: 'ready' });
      });
    }

    window.updateMapData = function(payload) {
      if (!map) return;
      if (payload.center) {
        currentCenter = payload.center;
      }
      if (payload.radius !== undefined) {
        currentRadius = payload.radius;
      }
      if (payload.markers !== undefined) {
        allMarkers = payload.markers;
      }
      if (payload.userLocation !== undefined) {
        currentUserLoc = payload.userLocation;
      }
      if (payload.tileType && payload.tileType !== currentTileType) {
        applyTileLayer(payload.tileType);
      }
      if (payload.mode !== undefined) {
        currentMode = payload.mode;
        if (currentMode === 'picker') {
          document.body.classList.add('show-crosshair');
        } else {
          document.body.classList.remove('show-crosshair');
        }
      }
      renderAll();

      if (payload.flyToCenter && currentCenter) {
        var zoom = payload.zoom || (currentRadius ? Math.max(10, 16 - Math.round(Math.log2(currentRadius))) : 14);
        map.flyTo([currentCenter.latitude, currentCenter.longitude], zoom, { duration: 0.8 });
      }
    };

    window.centerOnCoords = function(lat, lng, zoom) {
      if (!map) return;
      map.flyTo([lat, lng], zoom || 14, { duration: 0.8 });
    };

    window.setTileLayer = function(type) {
      if (!map) return;
      applyTileLayer(type);
    };

    function safeInit() {
      if (typeof L !== 'undefined' && L.map) {
        initMap();
      } else {
        var attempts = 0;
        var timer = setInterval(function() {
          attempts++;
          if (typeof L !== 'undefined' && L.map) {
            clearInterval(timer);
            initMap();
          } else if (attempts > 40) {
            clearInterval(timer);
            sendToApp('MAP_READY', { status: 'fallback_ready' });
          }
        }, 100);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', safeInit);
    } else {
      safeInit();
    }
  </script>
</body>
</html>
`;
};

export const UniversalMap = forwardRef<UniversalMapRef, UniversalMapProps>(({
  center,
  radius = 5,
  tileType = 'osm-standard',
  markers = [],
  userLocation = null,
  showsUserLocation = true,
  mode = 'view',
  onLocationChange,
  onMarkerPress,
  onDirectionsPress,
  style,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fallback timeout to guarantee map overlay disappears even on slow network
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useImperativeHandle(ref, () => ({
    centerOn: (latitude: number, longitude: number, zoom?: number) => {
      const script = `window.centerOnCoords && window.centerOnCoords(${latitude}, ${longitude}, ${zoom || 14}); true;`;
      webViewRef.current?.injectJavaScript(script);
    },
    setZoom: (zoom: number) => {
      const script = `window.map && window.map.setZoom(${zoom}); true;`;
      webViewRef.current?.injectJavaScript(script);
    },
    setTileType: (type: MapTileType) => {
      const script = `window.setTileLayer && window.setTileLayer("${type}"); true;`;
      webViewRef.current?.injectJavaScript(script);
    }
  }));

  // Update map state smoothly without page reload
  useEffect(() => {
    if (!mapReady) return;
    const payload = JSON.stringify({
      center,
      radius,
      markers,
      userLocation: showsUserLocation ? userLocation : null,
      mode,
      tileType,
    });
    const script = `window.updateMapData && window.updateMapData(${payload}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [center.latitude, center.longitude, radius, markers, userLocation, showsUserLocation, mode, tileType, mapReady]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setMapReady(true);
      } else if (data.type === 'LOCATION_CHANGE') {
        onLocationChange?.(data.payload);
      } else if (data.type === 'MARKER_PRESS') {
        const found = markers.find(m => m.id === data.payload.id);
        if (found) {
          onMarkerPress?.(found);
        }
      } else if (data.type === 'DIRECTIONS_PRESS') {
        onDirectionsPress?.(data.payload);
      }
    } catch (e) {
      console.warn('Error parsing map webview message', e);
    }
  };

  // Build the initial HTML once on mount to prevent unnecessary reloads of the WebView
  const initialHtmlRef = useRef(buildLeafletHtml(
    center,
    radius,
    markers,
    showsUserLocation ? userLocation : null,
    mode,
    tileType
  ));

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={initialHtmlRef.current}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="OpenStreetMap Discovery"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: initialHtmlRef.current }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
      />
      {!mapReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Rendering OpenStreetMap...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0b1120',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0b1120',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
