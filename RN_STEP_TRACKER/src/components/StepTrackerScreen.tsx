/**
 * StepTrackerScreen.tsx
 * 
 * React Native UI component for offline step tracking with map visualization.
 * 
 * FEATURES:
 * - Start/Stop tracking buttons
 * - Live step counter and distance display
 * - MapView with polyline showing route trace
 * - Session history list
 * - Export button (JSON/CSV)
 * - Fully offline-first: works without network
 * 
 * DEPENDENCIES:
 * - react-native-maps for map visualization
 * - Custom useStepTracker hook for logic
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import useStepTracker, { useStepTracker as StepTrackerType } from '../hooks/useStepTracker';
import { PERMISSIONS, check } from 'react-native-permissions';

interface ScreenState {
  loading: boolean;
  error: string | null;
  sessions: any[];
}

/**
 * Main step tracker screen component
 */
export const StepTrackerScreen: React.FC = () => {
  // Get step tracking state and methods
  const tracker = useStepTracker({
    gpsIntervalMs: 5000, // 5 second GPS updates
    gpsMinDistanceM: 5, // Filter GPS noise at 5m
    batchWriteIntervalMs: 10000, // Write progress every 10s
    useFallbackAccelerometer: true,
  });

  // Local UI state
  const [screenState, setScreenState] = useState<ScreenState>({
    loading: false,
    error: null,
    sessions: [],
  });

  const [mapInitialRegion, setMapInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  /**
   * Load saved sessions on mount
   */
  useEffect(() => {
    loadSessions();
  }, []);

  /**
   * Update map region when we get first GPS point
   */
  useEffect(() => {
    if (tracker.routePoints.length > 0) {
      const lastPoint = tracker.routePoints[tracker.routePoints.length - 1];
      setMapInitialRegion(prev => ({
        ...prev,
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
      }));
    }
  }, [tracker.routePoints]);

  /**
   * Fetch and display all saved sessions
   */
  const loadSessions = useCallback(async () => {
    try {
      setScreenState(prev => ({ ...prev, loading: true }));
      const sessions = await tracker.getSessions();
      setScreenState(prev => ({
        ...prev,
        sessions,
        loading: false,
      }));
    } catch (error) {
      setScreenState(prev => ({
        ...prev,
        error: `Failed to load sessions: ${error}`,
        loading: false,
      }));
    }
  }, [tracker]);

  /**
   * Start tracking with permission checks
   */
  const handleStartTracking = useCallback(async () => {
    try {
      setScreenState(prev => ({ ...prev, error: null }));
      await tracker.startTracking();
      Alert.alert('Success', 'Step tracking started');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setScreenState(prev => ({ ...prev, error: errorMsg }));
      Alert.alert('Error', errorMsg);
    }
  }, [tracker]);

  /**
   * Stop tracking and save session
   */
  const handleStopTracking = useCallback(async () => {
    try {
      setScreenState(prev => ({ ...prev, error: null }));
      const session = await tracker.stopTracking();
      if (session) {
        Alert.alert(
          'Session Saved',
          `Tracked ${session.stepCount} steps over ${(session.distanceKm).toFixed(2)} km`
        );
        loadSessions(); // Refresh list
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setScreenState(prev => ({ ...prev, error: errorMsg }));
      Alert.alert('Error', errorMsg);
    }
  }, [tracker, loadSessions]);

  /**
   * Export all data as JSON and show share dialog
   * (In a real app, you'd use react-native-share or file system)
   */
  const handleExport = useCallback(async () => {
    try {
      const data = await tracker.exportData();
      console.log('Exported data:', data);
      Alert.alert(
        'Export Success',
        'Data exported as JSON. Check console or logs for the data.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Failed', String(error));
    }
  }, [tracker]);

  /**
   * Clear all sessions with confirmation
   */
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Sessions?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await tracker.clearAllSessions();
              loadSessions();
              Alert.alert('Success', 'All sessions cleared');
            } catch (error) {
              Alert.alert('Error', `Failed to clear: ${error}`);
            }
          },
        },
      ]
    );
  }, [tracker, loadSessions]);

  /**
   * Format session duration
   */
  const formatDuration = (startTime: number, endTime?: number): string => {
    const end = endTime || Date.now();
    const durationMs = end - startTime;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Step Tracker</Text>
          <Text style={styles.subtitle}>Offline tracking • Real device sensors</Text>
        </View>

        {/* Error banner */}
        {screenState.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{screenState.error}</Text>
          </View>
        )}

        {/* Live Stats (always visible) */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tracker.stepsSinceStart}</Text>
            <Text style={styles.statLabel}>Steps This Session</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tracker.distanceKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Distance (km)</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(tracker.stepsSinceStart * 0.04)}</Text>
            <Text style={styles.statLabel}>Est. Calories</Text>
          </View>
        </View>

        {/* Map View (if we have route points) */}
        {tracker.routePoints.length > 0 && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={mapInitialRegion}
              showsUserLocation={true}
              followsUserLocation={true}
            >
              {/* Draw route polyline */}
              {tracker.routePoints.length > 1 && (
                <Polyline
                  coordinates={tracker.routePoints}
                  strokeColor="#FF6B6B"
                  strokeWidth={3}
                  lineDashPattern={[0]}
                />
              )}

              {/* Mark start point */}
              {tracker.routePoints.length > 0 && (
                <Marker
                  coordinate={tracker.routePoints[0]}
                  title="Start"
                  pinColor="green"
                />
              )}

              {/* Mark end point */}
              {tracker.routePoints.length > 0 && (
                <Marker
                  coordinate={tracker.routePoints[tracker.routePoints.length - 1]}
                  title="Current"
                  pinColor="red"
                />
              )}
            </MapView>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.buttonContainer}>
          {!tracker.isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonStart]}
              onPress={handleStartTracking}
            >
              <Text style={styles.buttonText}>▶ Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonStop]}
              onPress={handleStopTracking}
            >
              <Text style={styles.buttonText}>⏹ Stop Tracking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleExport}
          >
            <Text style={styles.buttonText}>📊 Export Data</Text>
          </TouchableOpacity>
        </View>

        {/* Session History */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Session History</Text>
            {screenState.sessions.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {screenState.loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : screenState.sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions recorded yet</Text>
          ) : (
            screenState.sessions.map((session, index) => (
              <View key={session.id || index} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.startTime).toLocaleDateString()} at{' '}
                    {new Date(session.startTime).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.sessionStats}>
                    {session.stepCount} steps • {session.distanceKm.toFixed(2)} km •{' '}
                    {formatDuration(session.startTime, session.endTime)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Footer with info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Make sure GPS and motion permissions are granted for best tracking accuracy.
          </Text>
          <Text style={styles.footerText}>
            All data is stored locally on your device. No cloud sync.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Stylesheet for consistent theming
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 5,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 10,
    marginVertical: 15,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginVertical: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonStart: {
    backgroundColor: '#34C759',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonSecondary: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    marginHorizontal: 10,
    marginVertical: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottomm: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionInfo: {
    gap: 5,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionStats: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  footer: {
    marginHorizontal: 10,
    marginVertical: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#444',
  },
});

export default StepTrackerScreen;
