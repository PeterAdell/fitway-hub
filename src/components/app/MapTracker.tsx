import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { calculateStepsFromDistance, estimateCaloriesBurned, calculateCaloriesMET, calculateStepLength, UserMetrics } from '@/lib/stepCalculations';

interface Position { lat: number; lng: number; timestamp: number }

interface MapTrackerProps {
  onComplete?: (session: {
    startTime: string | null;
    endTime: string | null;
    totalSteps: number;
    totalDistanceMeters: number;
    calories: number;
    path: Position[];
  }) => void;
  onUpdate?: (data: { distanceMeters: number; steps: number; calories: number; speedKmh?: number; met?: number }) => void;
}

const MapTracker = React.forwardRef<
  { start: () => void; stop: () => void; running: boolean },
  MapTrackerProps & { hideControls?: boolean }
>(({ onComplete, onUpdate, hideControls = false }, ref) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [running, setRunning] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [useMotion, setUseMotion] = useState(false);
  const [mode, setMode] = useState<'walking' | 'running'>('walking');
  const [sensitivity, setSensitivity] = useState<number>(() => {
    try {
      const v = localStorage.getItem('fitway_accel_sensitivity');
      return v ? Number(v) : 0.18;
    } catch (e) {
      return 0.18;
    }
  });

  // Refs for motion-based counting to keep synchronous counts
  const stepsRef = useRef<number>(0);
  const distanceMetersRef = useRef<number>(0);
  const lastAccelRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const accelThresholdRef = useRef<number>(0.2); // m/s^2 threshold for step detection
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { isDark } = useTheme();

  // MapTracker is now available to all users; premium gating has been
  // removed so that live tracking works for everyone.

  // helper conversion: approximate steps per km
  const stepsPerKm = 1300; // approximation
  const kcalPerStep = 0.04; // approx 40 kcal per 1000 steps

  // Haversine formula to calculate distance between two points
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns distance in meters
  };

  const startMotionSensors = async () => {
    try {
      const DM = (window as any).DeviceMotionEvent;
      if (DM && typeof DM.requestPermission === 'function') {
        const resp = await DM.requestPermission();
        if (resp !== 'granted') return;
      }
    } catch (e) {
      // ignore
    }

    const handler = (e: DeviceMotionEvent) => {
      const acc = (e as any).acceleration || (e as any).accelerationIncludingGravity;
      if (!acc) return;
      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 0;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      const last = lastAccelRef.current ?? mag;
      const delta = Math.abs(mag - last);
      lastAccelRef.current = mag;
      const now = Date.now();
      if (delta > accelThresholdRef.current && now - lastStepTimeRef.current > 300) {
        lastStepTimeRef.current = now;
        const userHeight = user?.height || 170;
        // adjust step length for running vs walking
        const baseStepLen = calculateStepLength(userHeight); // meters per step
        const stepLen = baseStepLen * (mode === 'running' ? 1.25 : 1);

        stepsRef.current = (stepsRef.current || 0) + 1;
        distanceMetersRef.current = (distanceMetersRef.current || 0) + stepLen;

        setSteps((s) => {
          const next = s + 1;
          stepsRef.current = next;
          return next;
        });
        setDistanceMeters((d) => {
          const next = d + stepLen;
          distanceMetersRef.current = next;
          return next;
        });

        const cal = estimateCaloriesBurned(stepsRef.current, user?.weight || 70, user?.height || 170);
        setCalories(cal);

        if (onUpdate) {
          onUpdate({ distanceMeters: distanceMetersRef.current, steps: stepsRef.current, calories: cal });
        }
      }
    };

    window.addEventListener('devicemotion', handler as EventListener);
    setUseMotion(true);
    (startMotionSensors as any)._handler = handler;
  };

  // adjust accel threshold when mode changes to better detect walking vs running
  useEffect(() => {
    // base threshold depends on mode, then apply user sensitivity offset
    const base = mode === 'running' ? 0.35 : 0.18;
    accelThresholdRef.current = Math.max(0.05, sensitivity || base);
    try { localStorage.setItem('fitway_accel_sensitivity', String(sensitivity)); } catch (e) {}
  }, [mode]);

  // keep accel threshold in sync when sensitivity changes
  useEffect(() => {
    accelThresholdRef.current = Math.max(0.05, sensitivity);
  }, [sensitivity]);

  const stopMotionSensors = () => {
    const h = (startMotionSensors as any)._handler;
    if (h) window.removeEventListener('devicemotion', h as EventListener);
    setUseMotion(false);
    lastAccelRef.current = null;
    lastStepTimeRef.current = 0;
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
    if (mapInstanceRef.current) return; // Already initialized
    
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
        setTimeout(() => initMap(), 100);
      };
      script.onerror = () => setMapError('Failed to load Leaflet');
      document.head.appendChild(script);
    } else {
      console.debug('[MapTracker] Leaflet already present');
      setMapLoaded(true);
      setTimeout(() => initMap(), 100);
    }

    return () => {
      stop();
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {}
      markerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // If map already exists, just refresh it instead of reinitializing
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.invalidateSize();
        console.debug('[MapTracker] Map already exists, just invalidated size');
      } catch (e) {
        console.debug('[MapTracker] Error invalidating size:', e);
      }
      return;
    }

    // Aggressively clean up any stale Leaflet state to prevent "already initialized" errors
    try {
      if (mapRef.current) {
        // Remove all Leaflet properties from the container
        if ((mapRef.current as any)._leaflet_id !== undefined) {
          delete (mapRef.current as any)._leaflet_id;
        }
        // Clear any child elements from previous map instances
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }
        console.debug('[MapTracker] Cleaned up stale Leaflet state from container');
      }
    } catch (e) {
      console.debug('[MapTracker] Error cleaning container:', e);
    }

    // Try to center on user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.debug('[MapTracker] getCurrentPosition success', pos.coords.latitude, pos.coords.longitude);
          try {
            // Safety check: if map somehow already exists on this container, remove it first
            if ((mapRef.current as any)._leaflet_id !== undefined && mapInstanceRef.current) {
              try {
                mapInstanceRef.current.remove();
              } catch (e) {}
            }
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
          } catch (err) {
            console.error('[MapTracker] Error setting up map:', err);
          }
        },
        () => {
          console.debug('[MapTracker] getCurrentPosition failed or denied, using default view');
          try {
            // Safety check: if map somehow already exists on this container, remove it first
            if ((mapRef.current as any)._leaflet_id !== undefined && mapInstanceRef.current) {
              try {
                mapInstanceRef.current.remove();
              } catch (e) {}
            }
            mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 13);
            addTilesAndPolyline(L);
          } catch (err) {
            console.error('[MapTracker] Error with default map view:', err);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      try {
        // Safety check: if map somehow already exists on this container, remove it first
        if ((mapRef.current as any)._leaflet_id !== undefined && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {}
        }
        mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 13);
        addTilesAndPolyline(L);
      } catch (err) {
        console.error('[MapTracker] Error creating map:', err);
      }
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
    setDistanceMeters(0);
    setSteps(0);
    setCalories(0);

    // initialize motion refs from current state
    stepsRef.current = 0;
    distanceMetersRef.current = 0;

    // start motion sensors when available to allow cm-level detection
    if ((window as any).DeviceMotionEvent) {
      startMotionSensors().catch(() => {});
    }

    try {
      // Ensure map is ready before starting live updates
      if (!mapLoaded || !mapInstanceRef.current) {
        setMapError('Map is still loading. Please try again in a moment.');
        setRunning(false);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const L = (window as any).L;
        console.log('[MapTracker] Position received - accuracy: ' + pos.coords.accuracy + 'm, lat: ' + pos.coords.latitude + ', lng: ' + pos.coords.longitude);
        
        // For testing/fallback: accept positions with accuracy up to 500m (real GPS: 5-50m)
        // This allows browser geolocation simulation to work
        if (pos.coords.accuracy > 500) {
          console.log('[MapTracker] Skipping position - accuracy too low: ' + pos.coords.accuracy + 'm');
          return;
        }

        const p: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp };

        setPositions((prev) => {
          // Skip if no significant movement from last point (less than 5 meters)
          if (prev.length > 0) {
            const lastPos = prev[prev.length - 1];
            const distMoved = haversineDistance(lastPos.lat, lastPos.lng, p.lat, p.lng);
            // Only skip if almost no movement
            if (distMoved < 0.01 && prev.length > 2) { // Less than 1cm (0.01 meters)
              return prev;
            }
          }

          const next = [...prev, p];
          console.log('[MapTracker] Position added. Total points: ' + next.length);

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

          // compute total distance using haversine (meters)
          let totalDist = 0;
          if (next.length > 1) {
            for (let i = 1; i < next.length; i++) {
              totalDist += haversineDistance(next[i - 1].lat, next[i - 1].lng, next[i].lat, next[i].lng);
            }
          }

          console.log('[MapTracker] Total distance: ' + totalDist.toFixed(2) + ' m, points: ' + next.length);

          // Only calculate GPS-derived steps when NOT using motion sensors
          if (next.length >= 2 && !useMotion) {
            // Use proper calculations based on user metrics
            const userMetrics: UserMetrics = {
              height: user.height || 170,
              weight: user.weight || 70,
              gender: user.gender || 'other'
            };

            const distanceKm = totalDist / 1000;
            const estimatedSteps = calculateStepsFromDistance(distanceKm, userMetrics);
            console.log('[MapTracker] Calculated steps: ' + estimatedSteps + ' from ' + distanceKm.toFixed(6) + ' km');

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
                speedKmh = (distSum / 1000) / hours; // km/h
              }
            }

            const metResult = calculateCaloriesMET({ weightKg: userMetrics.weight, heightCm: userMetrics.height, steps: estimatedSteps, distanceKm, gender: userMetrics.gender, speedKmh });
            const estimatedCalories = metResult.calories;

            setDistanceMeters(totalDist);
            setSteps(estimatedSteps);
            setCalories(estimatedCalories);

            console.log('[MapTracker] Distance: ' + totalDist.toFixed(2) + 'm, Steps: ' + estimatedSteps + ', Calories: ' + estimatedCalories);

            if (onUpdate) {
              onUpdate({ distanceMeters: totalDist, steps: estimatedSteps, calories: estimatedCalories, speedKmh, met: metResult.met });
              console.log('[MapTracker] onUpdate callback called');
            }
          } else if (next.length < 2) {
            console.log('[MapTracker] Waiting for 2+ positions... currently have ' + next.length);
          } else {
            console.log('[MapTracker] No distance yet (still collecting positions)');
          }

          return next;
        });
      },
      (err) => {
        console.error('geolocation error', err);
        try { setMapError('Geolocation failed: ' + err.message); } catch (e) { /* swallow */ }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    } catch (err: any) {
      console.error('[MapTracker] start error', err);
      setMapError(String(err?.message || err));
      setRunning(false);
    }
  };

  const stop = () => {
    // stop geolocation watch
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // stop motion sensors if they were started
    try {
      stopMotionSensors();
    } catch (e) {}
    setRunning(false);

    const startTime = positions[0]?.timestamp ? new Date(positions[0].timestamp).toISOString() : null;
    const endTime = positions[positions.length - 1]?.timestamp ? new Date(positions[positions.length - 1].timestamp).toISOString() : null;

    const session = {
      startTime,
      endTime,
      totalSteps: steps,
      totalDistanceMeters: Number(distanceMeters.toFixed(2)),
      calories,
      path: positions,
    };

    // Ensure a persistent marker stays at the last known position when stopped
    try {
      const lastPos = positions[positions.length - 1];
      const L = (window as any).L;
      if (lastPos && mapInstanceRef.current && L) {
        if (!markerRef.current) {
          try {
            const icon = createDefaultIcon(L);
            markerRef.current = L.marker([lastPos.lat, lastPos.lng], icon ? { icon } : undefined).addTo(mapInstanceRef.current);
          } catch (e) {
            markerRef.current = L.marker([lastPos.lat, lastPos.lng]).addTo(mapInstanceRef.current);
          }
        } else {
          try {
            markerRef.current.setLatLng([lastPos.lat, lastPos.lng]);
          } catch (e) {}
        }
        try { mapInstanceRef.current.panTo([lastPos.lat, lastPos.lng]); } catch (e) {}
      }
    } catch (e) {}

    if (onComplete) onComplete(session);
  };

  // expose imperative methods
  useImperativeHandle(ref, () => ({
    start,
    stop,
    running,
  }));

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className={
          "border w-full max-w-full h-64 md:h-[32rem] rounded-xl overflow-hidden box-border " +
          (isDark ? 'border-white/10 bg-slate-800' : 'border-white/20 bg-white')
        }
      />
      {/* Stats card: modern, simple display */}
      <div className="w-full flex flex-col md:flex-row items-stretch gap-3">
        <div className={
          "flex-1 p-3 rounded-xl shadow-sm flex items-center justify-between text-sm border " +
          (isDark ? 'bg-white/5 text-gray-200 border-white/6' : 'bg-white text-slate-900 border-gray-100')
        }>
          <div>
            <div className="text-xs text-gray-400">Distance</div>
            <div className="text-lg font-medium">{distanceMeters.toFixed(2)} m</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Steps</div>
            <div className="text-lg font-medium">{steps}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Calories</div>
            <div className="text-lg font-medium">{calories.toFixed(1)}</div>
          </div>
        </div>
          <div className="w-full md:w-64">
          {/* Mode toggle already exists above buttons; keep compact grouping */}
        </div>
      </div>
      {!hideControls && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className={"text-sm mr-2 " + (isDark ? 'text-gray-300' : 'text-gray-600')}>Mode:</span>
            <button
              onClick={() => setMode('walking')}
              className={"px-3 py-1 rounded-md text-sm border " +
                (mode === 'walking'
                  ? (isDark ? 'bg-purple-600 text-white border-transparent' : 'bg-emerald-500 text-white border-transparent')
                  : (isDark ? 'bg-white/5 text-gray-200 border-white/6' : 'bg-white text-slate-700 border-white/20'))}
            >
              Walking
            </button>
            <button
              onClick={() => setMode('running')}
              className={"px-3 py-1 rounded-md text-sm border " +
                (mode === 'running'
                  ? (isDark ? 'bg-purple-600 text-white border-transparent' : 'bg-emerald-500 text-white border-transparent')
                  : (isDark ? 'bg-white/5 text-gray-200 border-white/6' : 'bg-white text-slate-700 border-white/20'))}
            >
              Running
            </button>
            <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-2 sm:mt-0">
              <label className={"text-xs " + (isDark ? 'text-gray-300' : 'text-gray-600')}>Sensitivity</label>
              <input
                type="range"
                min={0.05}
                max={0.6}
                step={0.01}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="h-2 w-36"
                aria-label="acceleration sensitivity"
              />
              <div className={"text-xs ml-2 " + (isDark ? 'text-gray-300' : 'text-gray-600')}>{sensitivity.toFixed(2)}</div>
            </div>
          </div>
          {!running ? (
            <button
              onClick={start}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition text-sm md:text-base"
            >
              Start Live Tracking
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
      )}
    </div>
  );
});

export default MapTracker;

