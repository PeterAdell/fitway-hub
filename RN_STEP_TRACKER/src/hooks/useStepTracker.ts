/**
 * useStepTracker.ts
 * 
 * Main React hook for offline step tracking with GPS route mapping.
 * 
 * FEATURES:
 * - Reads device step counter (Android: TYPE_STEP_COUNTER, iOS: CMPedometer)
 * - Tracks GPS route points (AsyncStorage persisted)
 * - Handles device reboot by computing delta from previous counter total
 * - Batches writes to minimize AsyncStorage I/O
 * - Offline-first: all data stored locally, no cloud dependency
 * 
 * LIMITATIONS:
 * - Android step counter resets on device reboot; we detect this and compute delta
 * - iOS background step tracking limited by OS; best-effort using CMPedometer on resume
 * - Emulators rarely have working step sensors; test on real devices
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { PERMISSIONS, request, check } from 'react-native-permissions';
import { Platform } from 'react-native';

const { StepCounterModule } = NativeModules;

/**
 * Session data: one tracking period (start → stop)
 * Persisted to disk for offline resilience
 */
interface StepSession {
  id: string;
  startTime: number;
  endTime?: number;
  stepCount: number;
  distanceKm: number;
  routePoints: Array<{ latitude: number; longitude: number; timestamp: number }>;
  caloriesBurned?: number;
}

/**
 * Configuration for step tracking behavior
 */
interface StepTrackerConfig {
  // GPS sampling interval (ms) — balance accuracy vs battery
  gpsIntervalMs?: number;
  // Min distance (m) before recording a new GPS point; filters noise
  gpsMinDistanceM?: number;
  // Steps batch write interval (ms) — how often to persist step progress
  batchWriteIntervalMs?: number;
  // Fallback to accelerometer if step counter unavailable
  useFallbackAccelerometer?: boolean;
}

/**
 * Return type of the hook
 */
interface UseStepTrackerReturn {
  // Current session ID (null if not tracking)
  currentSessionId: string | null;
  // Steps accumulated in current session
  stepsSinceStart: number;
  // Total device steps (best-effort from native layer)
  totalDeviceSteps: number;
  // Route points for current session
  routePoints: Array<{ latitude: number; longitude: number; timestamp: number }>;
  // Estimated distance traveled (km)
  distanceKm: number;
  // Tracking active state
  isTracking: boolean;
  // Start tracking session
  startTracking: () => Promise<void>;
  // Stop and save current session
  stopTracking: () => Promise<StepSession | null>;
  // Fetch all past sessions from storage
  getSessions: () => Promise<StepSession[]>;
  // Manual sync on app resume (reconcile step counter after reboot)
  syncOnResume: () => Promise<void>;
  // Export all sessions as JSON
  exportData: () => Promise<string>;
  // Delete all stored sessions
  clearAllSessions: () => Promise<void>;
}

/**
 * Main step tracking hook
 */
export function useStepTracker(config: StepTrackerConfig = {}): UseStepTrackerReturn {
  const {
    gpsIntervalMs = 5000, // 5s GPS sampling
    gpsMinDistanceM = 5, // only log GPS if moved 5m+
    batchWriteIntervalMs = 10000, // write every 10s
    useFallbackAccelerometer = true,
  } = config;

  // State management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [stepsSinceStart, setStepsSinceStart] = useState(0);
  const [totalDeviceSteps, setTotalDeviceSteps] = useState(0);
  const [routePoints, setRoutePoints] = useState<Array<{ latitude: number; longitude: number; timestamp: number }>>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [appState, setAppState] = useState('active');

  // Refs for persistent tracking state
  const sessionRef = useRef<StepSession | null>(null);
  const lastGpsLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const batchWriteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gpsSubscriptionRef = useRef<any>(null);
  const stepEventSubscriptionRef = useRef<any>(null);

  /**
   * Calculate distance between two GPS points using Haversine formula
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Request all necessary permissions for step tracking + GPS
   */
  const requestPermissions = useCallback(async () => {
    try {
      let permissions: string[] = [];
      if (Platform.OS === 'android') {
        permissions = [
          PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ];
      } else {
        permissions = [
          PERMISSIONS.IOS.MOTION, // for CMPedometer
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        ];
      }

      const results = await Promise.all(permissions.map(perm => request(perm)));
      const allGranted = results.every(r => r === 'granted');
      if (!allGranted) {
        console.warn('Some permissions denied. Step tracking may not work properly.');
      }
      return allGranted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  /**
   * Initialize step counter listener from native module
   */
  const startStepListener = useCallback(() => {
    try {
      // Check if native step module exists
      if (!StepCounterModule) {
        console.warn('StepCounterModule not available. Step tracking may not work.');
        return;
      }

      // Create event emitter for step updates
      const eventEmitter = new NativeEventEmitter(StepCounterModule);

      // Listen for step count updates from native layer
      // Native layer should emit events like { steps: number, totalSteps: number }
      stepEventSubscriptionRef.current = eventEmitter.addListener(
        'onStepCountUpdate',
        (event: { steps: number; totalSteps: number }) => {
          if (!sessionRef.current) return;

          setStepsSinceStart(prev => prev + event.steps);
          setTotalDeviceSteps(event.totalSteps);
          sessionRef.current.stepCount += event.steps;

          // Estimate calories: ~0.04 kcal per step (varies by weight/intensity)
          const caloriesEstimate = sessionRef.current.stepCount * 0.04;
          sessionRef.current.caloriesBurned = caloriesEstimate;
        }
      );

      // Tell native layer to start listening to step sensor
      StepCounterModule.startStepCounter?.();
    } catch (error) {
      console.error('Failed to start step listener:', error);
    }
  }, []);

  /**
   * Stop listening to step events
   */
  const stopStepListener = useCallback(() => {
    stepEventSubscriptionRef.current?.remove();
    StepCounterModule.stopStepCounter?.();
  }, []);

  /**
   * Start GPS location tracking
   */
  const startGpsTracking = useCallback(() => {
    try {
      // Request updated position every 5s or if moved 5m+
      gpsSubscriptionRef.current = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const newPoint = { latitude, longitude, timestamp: Date.now() };

          // Only record if moved significantly (GPS noise filtering)
          if (
            !lastGpsLocationRef.current ||
            calculateDistance(
              lastGpsLocationRef.current.latitude,
              lastGpsLocationRef.current.longitude,
              latitude,
              longitude
            ) * 1000 >= gpsMinDistanceM
          ) {
            lastGpsLocationRef.current = { latitude, longitude };

            if (sessionRef.current) {
              sessionRef.current.routePoints.push(newPoint);
              setRoutePoints(prev => [...prev, newPoint]);

              // Update distance estimate
              if (sessionRef.current.routePoints.length > 1) {
                const prev = sessionRef.current.routePoints[sessionRef.current.routePoints.length - 2];
                const dist = calculateDistance(prev.latitude, prev.longitude, latitude, longitude);
                sessionRef.current.distanceKm += dist;
                setDistanceKm(prev => prev + dist);
              }
            }
          }
        },
        error => {
          console.warn('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          distanceFilter: gpsMinDistanceM, // Only trigger callback if moved N meters
        }
      );
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
    }
  }, [gpsMinDistanceM]);

  /**
   * Stop GPS location tracking
   */
  const stopGpsTracking = useCallback(() => {
    if (gpsSubscriptionRef.current !== null && typeof gpsSubscriptionRef.current === 'number') {
      Geolocation.clearWatch(gpsSubscriptionRef.current);
    }
  }, []);

  /**
   * Persist session progress to AsyncStorage (batched writes)
   */
  const persistSessionProgress = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      const sessions = JSON.parse(await AsyncStorage.getItem('step_sessions') || '[]');
      const index = sessions.findIndex((s: StepSession) => s.id === sessionRef.current!.id);
      if (index >= 0) {
        sessions[index] = sessionRef.current;
      } else {
        sessions.push(sessionRef.current);
      }
      await AsyncStorage.setItem('step_sessions', JSON.stringify(sessions));

      // Also persist total device steps for reboot reconciliation
      await AsyncStorage.setItem('last_device_step_total', String(totalDeviceSteps));
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }, [totalDeviceSteps]);

  /**
   * Start a new tracking session
   */
  const startTracking = useCallback(async () => {
    try {
      // Request permissions first
      const permGranted = await requestPermissions();
      if (!permGranted) {
        throw new Error('Required permissions not granted');
      }

      // Create new session
      const sessionId = `session_${Date.now()}`;
      sessionRef.current = {
        id: sessionId,
        startTime: Date.now(),
        stepCount: 0,
        distanceKm: 0,
        routePoints: [],
        caloriesBurned: 0,
      };

      setCurrentSessionId(sessionId);
      setStepsSinceStart(0);
      setRoutePoints([]);
      setDistanceKm(0);
      setIsTracking(true);

      // Start native step listening
      startStepListener();

      // Start GPS tracking
      startGpsTracking();

      // Set up batched writes to storage
      batchWriteTimerRef.current = setInterval(() => {
        persistSessionProgress();
      }, batchWriteIntervalMs);

      console.log('Step tracking started:', sessionId);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setIsTracking(false);
      throw error;
    }
  }, [requestPermissions, startStepListener, startGpsTracking, persistSessionProgress, batchWriteIntervalMs]);

  /**
   * Stop tracking and save session
   */
  const stopTracking = useCallback(async (): Promise<StepSession | null> => {
    try {
      if (!sessionRef.current) {
        console.warn('No active session to stop');
        return null;
      }

      // Stop listeners
      stopStepListener();
      stopGpsTracking();

      // Clear batch timer
      if (batchWriteTimerRef.current) {
        clearInterval(batchWriteTimerRef.current);
        batchWriteTimerRef.current = null;
      }

      // Mark session as complete
      sessionRef.current.endTime = Date.now();
      const completedSession = sessionRef.current;

      // Persist final state
      await persistSessionProgress();

      // Reset state
      setIsTracking(false);
      setCurrentSessionId(null);
      sessionRef.current = null;

      console.log('Step tracking stopped:', completedSession.id);
      return completedSession;
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      return null;
    }
  }, [stopStepListener, stopGpsTracking, persistSessionProgress]);

  /**
   * Fetch all saved sessions from storage
   */
  const getSessions = useCallback(async (): Promise<StepSession[]> => {
    try {
      const data = await AsyncStorage.getItem('step_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }, []);

  /**
   * Handle app resume: reconcile step counter after potential reboot
   * 
   * CRITICAL ISSUE: Android step counter resets on device reboot.
   * We solve this by:
   * 1. Storing the last-known device step total
   * 2. When resuming, if native reports lower than stored, we assume reboot happened
   * 3. Add the delta (previous total + steps since reboot) to the running session
   */
  const syncOnResume = useCallback(async () => {
    try {
      if (!isTracking || !sessionRef.current) return;

      const lastStoredSteps = parseInt(await AsyncStorage.getItem('last_device_step_total') || '0');

      // Request fresh step total from native layer
      if (StepCounterModule.getDeviceStepTotal) {
        StepCounterModule.getDeviceStepTotal((steps: number) => {
          if (steps < lastStoredSteps) {
            // Likely reboot detected
            console.warn('Device reboot detected. Reconciling step count.');
            const delta = lastStoredSteps + (steps - lastStoredSteps);
            // Add the delta to current session
            if (sessionRef.current) {
              sessionRef.current.stepCount += delta;
              setStepsSinceStart(prev => prev + delta);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync on resume:', error);
    }
  }, [isTracking]);

  /**
   * Export all sessions as JSON string
   */
  const exportData = useCallback(async (): Promise<string> => {
    try {
      const sessions = await getSessions();
      return JSON.stringify(sessions, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '[]';
    }
  }, [getSessions]);

  /**
   * Clear all stored sessions
   */
  const clearAllSessions = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('step_sessions');
      await AsyncStorage.removeItem('last_device_step_total');
      console.log('All sessions cleared');
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  }, []);

  /**
   * AppState listener: handle resume/background transitions
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isTracking]);

  const handleAppStateChange = (state: string) => {
    setAppState(state);
    if (state === 'active') {
      // App resumed: reconcile step counter
      syncOnResume();
    } else if (state === 'background') {
      // App backgrounded: persist current state
      if (sessionRef.current) {
        persistSessionProgress();
      }
    }
  };

  return {
    currentSessionId,
    stepsSinceStart,
    totalDeviceSteps,
    routePoints,
    distanceKm,
    isTracking,
    startTracking,
    stopTracking,
    getSessions,
    syncOnResume,
    exportData,
    clearAllSessions,
  };
}

export default useStepTracker;
