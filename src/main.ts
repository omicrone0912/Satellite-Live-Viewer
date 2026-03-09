import './style.css';
import L from 'leaflet';
import { fetchQZSSTLE } from './api/tle';
import { parseTLE, computeSatellitePosition } from './utils/orbit';
import type { SatelliteInfo, SatellitePosition } from './utils/orbit';
import { UIManager } from './ui/UIManager';

// Fix Leaflet's default icon path issues with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon for Satellite
const satIcon = L.divIcon({
  className: 'satellite-marker',
  html: `<div style="width: 16px; height: 16px; background-color: #00f2fe; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #00f2fe;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const initMap = () => {
  // Center map on Japan Region
  const mapCenter: L.LatLngTuple = [36.2048, 138.2529];
  const zoomLevel = 4;

  const map = L.map('map', {
    zoomControl: false,
  }).setView(mapCenter, zoomLevel);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  return map;
};

const initializeApp = () => {
  const map = initMap();
  const uiManager = new UIManager();
  let satellitesInfo: SatelliteInfo[] = [];
  const satelliteMarkers = new Map<string, L.Marker>();

  // Ensure map renders correctly, fixing Leaflet grey tile bugs on load
  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  const orbitLayerGroup = L.layerGroup().addTo(map);

  // Animation Loop Function
  const updateLoop = () => {
    if (satellitesInfo.length === 0) return;

    const now = new Date();
    const positions: SatellitePosition[] = [];

    // 1. Update Map Markers and Popups
    satellitesInfo.forEach(sat => {
      const pos = computeSatellitePosition(sat, now);
      if (pos) {
        positions.push(pos);
        const popupText = `<b>${sat.name}</b><br/>Alt: ${pos.altitudeKm.toFixed(1)} km<br/>Spd: ${pos.velocityKmS.toFixed(2)} km/s`;

        // Update Map Marker
        if (satelliteMarkers.has(sat.name)) {
          const marker = satelliteMarkers.get(sat.name)!;
          marker.setLatLng([pos.latitude, pos.longitude]);
          marker.setPopupContent(popupText);
        } else {
          const marker = L.marker([pos.latitude, pos.longitude], {
            icon: satIcon,
            title: sat.name
          }).bindPopup(popupText);

          marker.addTo(map);
          satelliteMarkers.set(sat.name, marker);
        }
      }
    });

    // 2. Update Orbit Trails (Past 18 Hours)
    orbitLayerGroup.clearLayers();
    satellitesInfo.forEach(sat => {
      let currentSegment: L.LatLngTuple[] = [];
      const allSegments: L.LatLngTuple[][] = [currentSegment];

      // Calculate positions for the past 18 hours at 5 minute intervals (higher resolution)
      for (let i = 216; i >= 0; i--) {
        const pastTime = new Date(now.getTime() - i * 5 * 60 * 1000);
        const pos = computeSatellitePosition(sat, pastTime);

        if (pos && !isNaN(pos.latitude) && !isNaN(pos.longitude)) {
          // Check for large longitude jumps (crossing date line)
          if (currentSegment.length > 0) {
            const lastPoint = currentSegment[currentSegment.length - 1];
            // If distance is greater than ~100 degrees, split line to avoid spanning map
            if (Math.abs(pos.longitude - lastPoint[1]) > 100) {
              currentSegment = [];
              allSegments.push(currentSegment);
            }
          }
          currentSegment.push([pos.latitude, pos.longitude]);
        }
      }

      allSegments.forEach(segment => {
        if (segment.length > 1) {
          L.polyline(segment, {
            color: 'rgba(0, 242, 254, 0.4)',
            weight: 3,
            dashArray: '5, 10'
          }).addTo(orbitLayerGroup);
        }
      });
    });

    // 3. Update UI Status Panel
    uiManager.updateSatellites(positions);
  };

  // Start the background data fetching process
  const startApp = async () => {
    try {
      uiManager.showLoading('Fetching Michibiki (QZSS) orbit data...');
      let tleData = await fetchQZSSTLE();

      // Basic sanity check for valid TLE string
      if (!tleData || !tleData.includes('QZS')) {
        throw new Error("Invalid TLE data received. CelesTrak might be returning an error page.");
      }

      satellitesInfo = parseTLE(tleData);
      uiManager.hideError();

      // Start loop only after data is fetched successfully
      updateLoop();
      // Update every second
      setInterval(updateLoop, 1000);

    } catch (error: any) {
      console.error(error);
      uiManager.showError(error.message || 'Failed to initialize satellite data.');
    }
  };

  startApp();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
