import { useEffect, useRef, useState } from 'react';
import { Wildfire, Language, Severity, FireStatus } from '../types';
import { getWilayaCoords, ALGERIA_WILAYAS } from '../lib/translations';
import { MapPin, Flame, Radio, AlertTriangle, CloudSun, Eye, Layers } from 'lucide-react';

interface MapComponentProps {
  wildfires: Wildfire[];
  satelliteHotspots: any[];
  onSelectCoordinates?: (lat: number, lng: number) => void;
  lang: Language;
  selectedFire?: Wildfire | null;
  onSelectFire?: (fire: Wildfire) => void;
  t: Record<string, string>;
}

export default function MapComponent({
  wildfires,
  satelliteHotspots,
  onSelectCoordinates,
  lang,
  selectedFire,
  onSelectFire,
  t
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'regions'>('map');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [selectedPinType, setSelectedPinType] = useState<'all' | 'fires' | 'satellites'>('all');
  const leafletInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const tileLayerRef = useRef<any>(null);

  // Leaflet CDN Dynamic Loading
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      // Check if Leaflet is already loaded on window
      if ((window as any).L) {
        if (isMounted) setMapLoaded(true);
        return;
      }

      // Append Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Append Leaflet JS
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) setMapLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load Leaflet script from CDN.');
        };
        document.body.appendChild(script);
      } else {
        // Script already appended but not loaded yet
        const checkL = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkL);
            if (isMounted) setMapLoaded(true);
          }
        }, 100);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || activeTab !== 'map') return;

    const L = (window as any).L;
    if (!L) return;

    // Destroy existing map instance if any
    if (leafletInstance.current) {
      leafletInstance.current.remove();
      leafletInstance.current = null;
    }

    // Default center of Algeria (Tizi Ouzou area or slightly south)
    const defaultCenter = [36.20, 3.80];
    const defaultZoom = 7;

    // Instantiate Map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(
      selectedFire ? [selectedFire.lat, selectedFire.lng] : defaultCenter,
      selectedFire ? 10 : defaultZoom
    );

    leafletInstance.current = map;

    // Define tile layers
    const layerUrls = {
      streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    };
    
    const layerAttributions = {
      streets: '&copy; OpenStreetMap &copy; CARTO',
      satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      terrain: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    };

    const initialTile = L.tileLayer(layerUrls[mapLayer], {
      attribution: layerAttributions[mapLayer],
      maxZoom: 19,
      subdomains: mapLayer === 'streets' ? 'abcd' : []
    }).addTo(map);

    tileLayerRef.current = initialTile;

    // Click handler to capture new coordinates
    if (onSelectCoordinates) {
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        // Bind coordinates within Algeria approximate box
        if (lat >= 19 && lat <= 38 && lng >= -9 && lng <= 12) {
          onSelectCoordinates(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
          
          // Temporary marker for creation
          L.popup()
            .setLatLng(e.latlng)
            .setContent(`<div class="text-xs font-sans text-center">
              <p class="font-bold text-emerald-600">${t.reportFormTitle}</p>
              <p class="text-gray-500 font-mono mt-1">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            </div>`)
            .openOn(map);
        }
      });
    }

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [mapLoaded, activeTab]);

  // Dynamic Tile Layer Swapping when layer selection changes
  useEffect(() => {
    if (!leafletInstance.current || !mapLoaded || activeTab !== 'map') return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const layerUrls = {
      streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    };
    
    const layerAttributions = {
      streets: '&copy; OpenStreetMap &copy; CARTO',
      satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      terrain: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    };

    const tileLayer = L.tileLayer(layerUrls[mapLayer], {
      attribution: layerAttributions[mapLayer],
      maxZoom: 19,
      subdomains: mapLayer === 'streets' ? 'abcd' : []
    }).addTo(leafletInstance.current);

    tileLayerRef.current = tileLayer;
  }, [mapLayer, mapLoaded, activeTab]);

  // Update Markers when fires/hotspots change
  useEffect(() => {
    if (!leafletInstance.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = leafletInstance.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filtered data based on toggle selection
    const showFires = selectedPinType === 'all' || selectedPinType === 'fires';
    const showSatellites = selectedPinType === 'all' || selectedPinType === 'satellites';

    // 1. Plot Wildfire Markers
    if (showFires) {
      wildfires.forEach(fire => {
        // Color coding for markers
        let color = '#ef4444'; // Active - Red
        let statusText = t.active;
        if (fire.status === 'Controlled') {
          color = '#f97316'; // Controlled - Orange
          statusText = t.controlled;
        } else if (fire.status === 'Extinguished') {
          color = '#10b981'; // Extinguished - Green
          statusText = t.extinguished;
        }

        // Create HTML marker icon
        const customIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-8 w-8 rounded-full opacity-30 animate-ping" style="background-color: ${color};"></span>
              <div class="relative flex items-center justify-center h-6 w-6 rounded-full text-white shadow-lg border border-white" style="background-color: ${color};">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              </div>
            </div>
          `,
          className: 'custom-leaflet-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const popupContent = `
          <div class="font-sans p-1 max-w-[200px]">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="h-2.5 w-2.5 rounded-full" style="background-color: ${color};"></span>
              <span class="font-bold text-sm text-gray-800">${fire.wilaya} (${fire.commune})</span>
            </div>
            <p class="text-[11px] text-gray-500 mb-1 font-mono">${fire.lat.toFixed(4)}, ${fire.lng.toFixed(4)}</p>
            <div class="flex flex-wrap gap-1 mb-1.5">
              <span class="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white bg-slate-700">${statusText}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white bg-red-600">${fire.severity}</span>
            </div>
            <p class="text-xs text-gray-600 line-clamp-2 mb-2">${fire.description || ''}</p>
            <button id="view-fire-${fire.id}" class="w-full text-center py-1 text-[11px] bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition">
              ${t.verified}
            </button>
          </div>
        `;

        const marker = L.marker([fire.lat, fire.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        // Track click on popup button
        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-fire-${fire.id}`);
          if (btn && onSelectFire) {
            btn.onclick = () => {
              onSelectFire(fire);
              map.closePopup();
            };
          }
        });

        markersRef.current.push(marker);

        // Add boundary circle if enabled
        if (showBoundaries) {
          const area = fire.burnedArea || 1;
          const calculatedRadius = Math.min(10000, Math.max(250, Math.sqrt(area) * 150));

          const boundaryCircle = L.circle([fire.lat, fire.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '5, 5',
            radius: calculatedRadius
          }).addTo(map);

          // Tooltip showing estimated area and approximate radius
          boundaryCircle.bindTooltip(
            `<strong>${fire.wilaya} (${fire.commune})</strong><br/>` +
            `${t.burnedArea || 'Burned Area'}: ${area} ha<br/>` +
            `${isRTL ? 'نطاق الخطر' : 'Rayon de danger'}: ~${Math.round(calculatedRadius)}m`,
            { sticky: true, opacity: 0.85 }
          );

          markersRef.current.push(boundaryCircle);
        }
      });
    }

    // 2. Plot Satellite Thermal Hotspots (NASA FIRMS)
    if (showSatellites) {
      satelliteHotspots.forEach(spot => {
        const customIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-10 w-10 rounded-full bg-yellow-500 opacity-20 animate-ping"></span>
              <div class="relative flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500 text-black shadow-md border border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-radio"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/></svg>
              </div>
            </div>
          `,
          className: 'custom-leaflet-icon-satellite',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
          <div class="font-sans p-1 max-w-[200px]">
            <div class="flex items-center gap-1.5 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="text-amber-500 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/></svg>
              <span class="font-bold text-xs text-amber-700">${t.satelliteActive}</span>
            </div>
            <p class="text-[10px] text-gray-500 font-mono">${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}</p>
            <div class="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-gray-700 bg-slate-50 p-1.5 rounded">
              <div>Wilaya:</div><div class="font-bold">${spot.wilaya}</div>
              <div>Confidence:</div><div class="font-bold text-red-600">${spot.confidence}%</div>
              <div>Temp:</div><div class="font-bold">${Math.round(spot.brightness - 273.15)}°C</div>
              <div>Sensor:</div><div class="font-bold font-mono">${spot.sensor}</div>
            </div>
          </div>
        `;

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        markersRef.current.push(marker);
      });
    }

    // Pan to selected fire if requested
    if (selectedFire) {
      map.setView([selectedFire.lat, selectedFire.lng], 11);
    }
  }, [wildfires, satelliteHotspots, selectedPinType, mapLoaded, activeTab, selectedFire, showBoundaries]);

  // Generate mock regional risk level for each Wilaya to render in table or SVG fallback
  const getRegionalRisk = (wilayaName: string) => {
    // Generate static deterministic risks for Wilayas based on fire counts or heat levels
    const fireCount = wildfires.filter(w => w.wilaya === wilayaName && w.status === 'Active').length;
    const baseHash = wilayaName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dangerIndex = Math.min(100, Math.max(15, (fireCount * 25) + (baseHash % 60)));
    
    let label = t.dangerLow;
    let color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
    let rawColor = '#10b981';
    
    if (dangerIndex > 80) {
      label = t.dangerExtreme;
      color = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      rawColor = '#f43f5e';
    } else if (dangerIndex > 60) {
      label = t.dangerHighRisk;
      color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
      rawColor = '#f97316';
    } else if (dangerIndex > 35) {
      label = t.dangerModerate;
      color = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      rawColor = '#eab308';
    }
    
    return { index: dangerIndex, label, style: color, rawColor };
  };

  const isRTL = lang === 'ar';

  return (
    <div id="map_section_wrapper" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Map Toggle Bar */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-lg text-red-600 dark:text-red-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t.activeFiresMap}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {onSelectCoordinates ? t.captureGps : "Interactive Realtime GIS Data"}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'map'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🛰️ Leaflet WebGIS
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'regions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🗺️ {t.dangerIndexTitle} (Wilayas)
          </button>
        </div>
      </div>

      {/* Map Main Panels */}
      <div className="relative flex-1 min-h-[500px] flex flex-col">
        {activeTab === 'map' ? (
          <>
            {/* Map Filter Badges floating on top of Leaflet Map */}
            <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[90%] pointer-events-auto">
              <button
                onClick={() => setSelectedPinType('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md transition border flex items-center gap-1.5 ${
                  selectedPinType === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🌍</span> {isRTL ? "الكل" : "Tout"}
              </button>
              <button
                onClick={() => setSelectedPinType('fires')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md transition border flex items-center gap-1.5 ${
                  selectedPinType === 'fires'
                    ? 'bg-red-600 text-white border-transparent'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>{t.activeFires} ({wildfires.length})</span>
              </button>
              <button
                onClick={() => setSelectedPinType('satellites')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md transition border flex items-center gap-1.5 ${
                  selectedPinType === 'satellites'
                    ? 'bg-amber-500 text-slate-900 border-transparent'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-slate-900 animate-pulse" />
                <span>NASA FIRMS ({satelliteHotspots.length})</span>
              </button>
            </div>

            {/* Map Custom Controls floating on the top-right of Leaflet Map */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto items-end">
              {/* Layer Selector panel */}
              <div className="bg-white/95 dark:bg-slate-900/95 p-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 min-w-[130px]">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 px-1.5 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.mapLayers}</span>
                </span>
                
                {(['streets', 'satellite', 'terrain'] as const).map((layer) => {
                  let emoji = '🗺️';
                  if (layer === 'satellite') emoji = '🛰️';
                  if (layer === 'terrain') emoji = '⛰️';
                  
                  return (
                    <button
                      key={layer}
                      onClick={() => setMapLayer(layer)}
                      className={`w-full text-right px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition ${
                        mapLayer === layer
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100/50 dark:border-red-900/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <span className="shrink-0">{emoji}</span>
                      <span className="flex-1 text-start">{t[layer]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Boundary circles toggle button */}
              <button
                onClick={() => setShowBoundaries(!showBoundaries)}
                className={`px-3 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 transition text-[11px] font-bold ${
                  showBoundaries
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                  showBoundaries 
                    ? 'border-red-400 bg-red-500' 
                    : 'border-slate-400 dark:border-slate-600'
                }`}>
                  {showBoundaries && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                </div>
                <span>{t.toggleBoundaries}</span>
              </button>
            </div>

            {/* Hint message when report mode is active */}
            {onSelectCoordinates && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-[1000] bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400 pointer-events-none flex items-center gap-2">
                <MapPin className="w-4 h-4 animate-bounce" />
                <span>{isRTL ? "انقر على الخريطة لتحديد مكان الحريق بدقة" : "Cliquez sur la carte pour placer le foyer de feu"}</span>
              </div>
            )}

            {/* Leaflet DOM container */}
            <div ref={mapRef} id="leaflet-map-element" className="w-full h-full flex-1 min-h-[500px]" />
          </>
        ) : (
          /* Regional Risk Matrix Panel with full-fidelity SVG/Interactive Table of Algeria Wilayas */
          <div className="p-6 overflow-y-auto max-h-[580px] bg-slate-50 dark:bg-slate-950/40 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Regional Legend & Map Insight */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">{t.dangerRiskLegend}</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                        <span className="text-slate-700 dark:text-slate-300">{t.dangerExtreme}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-bold">&gt; 80</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                        <span className="text-slate-700 dark:text-slate-300">{t.dangerHighRisk}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-bold">61 - 80</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                        <span className="text-slate-700 dark:text-slate-300">{t.dangerModerate}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-bold">36 - 60</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-700 dark:text-slate-300">{t.dangerLow}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-bold">15 - 35</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100/50 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>{isRTL ? "تحليل مخاطر الأرصاد الجوية" : "Analyse du risque météo"}</span>
                  </p>
                  <p className="leading-relaxed opacity-90">
                    {isRTL 
                      ? "يتم حساب مؤشر الخطر إقليمياً بناءً على درجات الحرارة الاستثنائية، الرطوبة النسبية المنخفضة وسرعة هبوب الرياح الصيفية الحارة (السيروكو)."
                      : "L'indice de danger régional est calculé en fonction des vagues de chaleur, de l'humidité du combustible forestier et de la force du Sirocco."}
                  </p>
                </div>
              </div>

              {/* Interactive Wilayas grid with search */}
              <div className="md:col-span-2 space-y-3">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-slate-100"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                  {ALGERIA_WILAYAS.filter(w => w.toLowerCase().includes(regionFilter.toLowerCase()))
                    .map(wilaya => {
                      const risk = getRegionalRisk(wilaya);
                      return (
                        <div
                          key={wilaya}
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">📍</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{wilaya}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500 font-bold">{risk.index}%</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${risk.style}`}>
                              {risk.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
