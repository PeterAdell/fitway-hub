import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { calculateStepsFromDistance, estimateCaloriesBurned, calculateCaloriesMET, UserMetrics } from '@/lib/stepCalculations';

interface Position { lat: number; lng: number; timestamp: number }

interface MapTrackerProps {
  onComplete?: (session: {
    startTime: string | null;
    endTime: string | null;
    totalSteps: number;
    totalDistanceKm: number;
    calories: number;
    path: Position[];
  }) => void;
  onUpdate?: (data: { distanceKm: number; steps: number; calories: number; speedKmh?: number; met?: number }) => void;
}

export default function MapTracker({ onComplete, onUpdate }: MapTrackerProps) {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [running, setRunning] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Check if user is premium
  if (!user?.isPremium) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
        <p className="text-white/60">Live GPS tracking is available for premium users only.</p>
      </div>
    );
  }

  // helper conversion: approximate steps per km
  const stepsPerKm = 1300; // approximation
  const kcalPerStep = 0.04; // approx 40 kcal per 1000 steps

  // Haversine formula to calculate distance between two points
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const createDefaultIcon = (L: any) => {
    try {
      return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
    } catch (e) {
      return undefined;
    }
  };

  useEffect(() => {
    console.debug('[MapTracker] mounting, L exists?', !!(window as any).L);
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.debug('[MapTracker] leaflet script loaded');
        setMapLoaded(true);
        try {
          initMap();
        } catch (err) {
          console.error('[MapTracker] initMap error', err);
          setMapError('Failed to initialize map');
        }
      };
      document.head.appendChild(script);
    } else {
      console.debug('[MapTracker] Leaflet already present');
      setMapLoaded(true);
      try {
        initMap();
      } catch (err) {
        console.error('[MapTracker] initMap error', err);
        setMapError('Failed to initialize map');
      }
    }

    return () => {
      stop();
      // Clean up map instance on unmount to avoid "Map container is already initialized" (HMR/dev)
      try {
        if (mapInstanceRef.current && (window as any).L) {
          mapInstanceRef.current.remove();
        }
      } catch (e) {}
      mapInstanceRef.current = null;
      markerRef.current = null;
      polylineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // If map already exists (HMR/re-render), avoid re-initializing
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.invalidateSize();
      } catch (e) {}
      return;
    }

    // Try to center on user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.debug('[MapTracker] getCurrentPosition success', pos.coords.latitude, pos.coords.longitude);
          mapInstanceRef.current = L.map(mapRef.current).setView([pos.coords.latitude, pos.coords.longitude], 16);
          addTilesAndPolyline(L);
          // add an initial marker at the current location so pin is visible immediately
          try {
            const icon = createDefaultIcon(L);
            if (!markerRef.current) {
              markerRef.current = L.marker([pos.coords.latitude, pos.coords.longitude], icon ? { icon } : undefined).addTo(mapInstanceRef.current);
              console.debug('[MapTracker] initial marker added');
            } else {
              markerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude]);
              console.debug('[MapTracker] initial marker updated');
            }
          } catch (e) {
            console.debug('[MapTracker] failed to add initial marker', e);
          }
        },
        () => {
          console.debug('[MapTracker] getCurrentPosition failed or denied');
          mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 13);
          addTilesAndPolyline(L);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 13);
      addTilesAndPolyline(L);
    }
  };

  const addTilesAndPolyline = (L: any) => {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 2,
    }).addTo(mapInstanceRef.current);

    setTimeout(() => {
      try {
        mapInstanceRef.current.invalidateSize();
      } catch (e) {}
    }, 200);

    polylineRef.current = L.polyline([], {
      color: '#8b5cf6',
      opacity: 0.8,
      weight: 4,
      dashArray: 'none',
    }).addTo(mapInstanceRef.current);
  };

  const start = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation not supported');
      return;
    }
    setRunning(true);
    setPositions([]);
    setDistanceKm(0);
    setSteps(0);
    setCalories(0);

    try {
      // Ensure map is ready before starting live updates
      if (!mapLoaded || !mapInstanceRef.current) {
        setMapError('Map is still loading. Please try again in a moment.');
        setRunning(false);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp };
        const L = (window as any).L;

        setPositions((prev) => {
          const next = [...prev, p];

          // Update polyline and marker on map
          if (mapInstanceRef.current && L && polylineRef.current) {
            const latLngs = next.map((pt) => [pt.lat, pt.lng]);
            polylineRef.current.setLatLngs(latLngs);

            // Add or update marker at current position using consistent icon
            if (markerRef.current) {
              markerRef.current.setLatLng([p.lat, p.lng]);
              console.debug('[MapTracker] marker moved to', p.lat, p.lng);
            } else {
              try {
                const icon = createDefaultIcon(L);
                markerRef.current = L.marker([p.lat, p.lng], icon ? { icon } : undefined).addTo(mapInstanceRef.current);
                console.debug('[MapTracker] marker created on watchPosition');
              } catch (e) {
                // fallback: create marker without custom icon
                markerRef.current = L.marker([p.lat, p.lng]).addTo(mapInstanceRef.current);
                console.debug('[MapTracker] marker created fallback on watchPosition');
              }
            }

            // Pan to current position
            mapInstanceRef.current.panTo([p.lat, p.lng]);
          }

          // compute total distance using haversine
          if (next.length > 1) {
            let totalDist = 0;
            for (let i = 1; i < next.length; i++) {
              totalDist += haversineDistance(next[i - 1].lat, next[i - 1].lng, next[i].lat, next[i].lng);
            }

            // Use proper calculations based on user metrics
            const userMetrics: UserMetrics = {
              height: user.height || 170,
              weight: user.weight || 70,
              gender: user.gender || 'other'
            };

            const estimatedSteps = calculateStepsFromDistance(totalDist, userMetrics);
            // Estimate current walking speed (km/h) using last few points
            let speedKmh = undefined;
            const windowSize = Math.min(5, next.length);
            if (windowSize >= 2) {
              let distSum = 0;
              let timeSum = 0;
              for (let i = next.length - windowSize; i < next.length - 1; i++) {
                const a = next[i];
                const b = next[i + 1];
                distSum += haversineDistance(a.lat, a.lng, b.lat, b.lng);
                timeSum += (b.timestamp - a.timestamp) / 1000; // seconds
              }
              if (timeSum > 0) {
                const hours = timeSum / 3600;
                speedKmh = distSum / hours; // km/h
              }
            }

            const metResult = calculateCaloriesMET({ weightKg: userMetrics.weight, heightCm: userMetrics.height, distanceKm: totalDist, gender: userMetrics.gender, speedKmh });
            const estimatedCalories = metResult.calories;

            setDistanceKm(totalDist);
            setSteps(estimatedSteps);
            setCalories(estimatedCalories);

            if (onUpdate) onUpdate({ distanceKm: totalDist, steps: estimatedSteps, calories: estimatedCalories, speedKmh, met: metResult.met });
          }

          return next;
        });
      },
      (err) => {
        console.error('geolocation error', err);
        try { setMapError('Geolocation failed: ' + err.message); } catch (e) { /* swallow */ }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    } catch (err: any) {
      console.error('[MapTracker] start error', err);
      setMapError(String(err?.message || err));
      setRunning(false);
    }
  };

  const stop = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setRunning(false);

    const startTime = positions[0]?.timestamp ? new Date(positions[0].timestamp).toISOString() : null;
    const endTime = positions[positions.length - 1]?.timestamp ? new Date(positions[positions.length - 1].timestamp).toISOString() : null;

    const session = {
      startTime,
      endTime,
      totalSteps: steps,
      totalDistanceKm: Number(distanceKm.toFixed(3)),
      calories,
      path: positions,
    };

    if (onComplete) onComplete(session);
  };

  return (
    <div className="space-y-3">
      <div ref={mapRef} className="border border-white/20 w-full max-w-full h-64 md:h-[32rem] rounded-xl overflow-hidden bg-gray-100 box-border" />
      <div>
        {!running ? (
          <button
            onClick={start}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition text-sm md:text-base"
          >
            Start Live Tracking (Premium)
          </button>
        ) : (
          <button
            onClick={stop}
            className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white font-semibold hover:from-red-600 hover:to-red-700 transition text-sm md:text-base"
          >
            Stop & Save Session
          </button>
        )}
      </div>
    </div>
  );
}
