import './style.css';
import L from 'leaflet';
import { parseTLE, computeSatellitePosition } from './utils/orbit';
import type { SatelliteInfo } from './utils/orbit';
import { UIManager } from './ui/UIManager';

// Fix Leaflet's default icon path issues with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
  let trailHours = 18;

  const getSatIcon = (color: string) => {
    return L.divIcon({
      className: 'satellite-marker',
      html: `<div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color};"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  const renderList = () => {
    uiManager.updateSatelliteList(satellitesInfo, (id, visible) => {
      const sat = satellitesInfo.find(s => s.id === id);
      if (sat) {
        sat.visible = visible;
        updateLoop(); // Force redraw immediately
      }
    });
  };

  uiManager.onTrailLengthChange = (hours) => {
    trailHours = hours;
    updateLoop();
  };

  uiManager.onAddSatellite = (tle) => {
    try {
      const newSats = parseTLE(tle, 'Custom');
      if (newSats.length > 0) {
        satellitesInfo.push(...newSats);
        renderList();
        updateLoop();
      } else {
        alert("Could not parse TLE data. Please check format.");
      }
    } catch (e) {
      alert("Error parsing TLE data.");
    }
  };

  // Animation Loop Function
  const updateLoop = () => {
    if (satellitesInfo.length === 0) return;

    const now = new Date();

    // 1. Cleanup invisible markers
    satellitesInfo.forEach(sat => {
      if (!sat.visible && satelliteMarkers.has(sat.id)) {
        map.removeLayer(satelliteMarkers.get(sat.id)!);
        satelliteMarkers.delete(sat.id);
      }
    });

    const visibleSats = satellitesInfo.filter(s => s.visible);

    // 2. Update Map Markers and Popups
    visibleSats.forEach(sat => {
      const pos = computeSatellitePosition(sat, now);
      if (pos) {
        const popupText = `<div style="font-family: 'Inter', sans-serif;">
            <strong style="font-size: 1.1em; color: ${sat.color}">${sat.name}</strong><br/>
            <b>Lat / Lon:</b> ${pos.latitude.toFixed(4)}° / ${pos.longitude.toFixed(4)}°<br/>
            <b>Altitude:</b> ${pos.altitudeKm.toFixed(2)} km<br/>
            <b>Velocity:</b> ${pos.velocityKmS.toFixed(2)} km/s
        </div>`;

        // Update Map Marker
        if (satelliteMarkers.has(sat.id)) {
          const marker = satelliteMarkers.get(sat.id)!;
          marker.setLatLng([pos.latitude, pos.longitude]);
          
          // Only update popup if it is open, otherwise it forces DOM updates needlessly
          if (marker.isPopupOpen()) {
            marker.setPopupContent(popupText);
          } else {
            // Unbind and rebind to update the stored content quietly
            marker.getPopup()!.setContent(popupText);
          }
        } else {
          const marker = L.marker([pos.latitude, pos.longitude], {
            icon: getSatIcon(sat.color),
            title: sat.name
          }).bindPopup(popupText);

          marker.addTo(map);
          satelliteMarkers.set(sat.id, marker);
        }
      }
    });

    // 3. Update Orbit Trails
    orbitLayerGroup.clearLayers();
    
    // Total calculation points = Hours * 12 (since we use 5 min intervals)
    const pointsCount = Math.max(1, trailHours * 12);

    visibleSats.forEach(sat => {
      let currentSegment: L.LatLngTuple[] = [];
      const allSegments: L.LatLngTuple[][] = [currentSegment];

      for (let i = pointsCount; i >= 0; i--) {
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
            color: sat.color,
            weight: 2,
            dashArray: '4, 8',
            opacity: 0.6
          }).addTo(orbitLayerGroup);
        }
      });
    });
  };

  // Start the background data fetching process
  const startApp = async () => {
    try {
      uiManager.showLoading('Fetching Live Orbit Data...');
      // IMPORTANT: Changed to use fetchAllSatellites from the refactored tle.ts
      const { fetchAllSatellites } = await import('./api/tle');
      satellitesInfo = await fetchAllSatellites();
      uiManager.hideError();

      renderList();

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
