/**
 * storageManager.ts
 * 
 * Utilities for persisting and retrieving step tracking data from AsyncStorage.
 * Provides a simple, offline-first data layer for sessions and metrics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredSession {
  id: string;
  startTime: number;
  endTime?: number;
  stepCount: number;
  distanceKm: number;
  caloriesBurned?: number;
  routePoints: Array<{ latitude: number; longitude: number; timestamp: number }>;
}

/**
 * Save a session to storage
 */
export async function saveSession(session: StoredSession): Promise<void> {
  try {
    const sessions = await getAllSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    await AsyncStorage.setItem('step_sessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
}

/**
 * Fetch all stored sessions
 */
export async function getAllSessions(): Promise<StoredSession[]> {
  try {
    const data = await AsyncStorage.getItem('step_sessions');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return [];
  }
}

/**
 * Delete a specific session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const sessions = await getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await AsyncStorage.setItem('step_sessions', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw error;
  }
}

/**
 * Clear all sessions
 */
export async function clearAllSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem('step_sessions');
    await AsyncStorage.removeItem('last_device_step_total');
  } catch (error) {
    console.error('Failed to clear sessions:', error);
    throw error;
  }
}

/**
 * Export all sessions as JSON string
 */
export async function exportSessionsAsJSON(): Promise<string> {
  try {
    const sessions = await getAllSessions();
    return JSON.stringify(sessions, null, 2);
  } catch (error) {
    console.error('Failed to export sessions:', error);
    return '[]';
  }
}

/**
 * Export all sessions as CSV (simple format)
 */
export async function exportSessionsAsCSV(): Promise<string> {
  try {
    const sessions = await getAllSessions();
    
    let csv = 'Date,Time,Steps,Distance (km),Duration,Calories\n';
    
    sessions.forEach(session => {
      const startDate = new Date(session.startTime);
      const endDate = session.endTime ? new Date(session.endTime) : new Date();
      const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      csv += `${startDate.toLocaleDateString()},`;
      csv += `${startDate.toLocaleTimeString()},`;
      csv += `${session.stepCount},`;
      csv += `${session.distanceKm.toFixed(2)},`;
      csv += `${durationMin},`;
      csv += `${Math.round(session.caloriesBurned || 0)}\n`;
    });
    
    return csv;
  } catch (error) {
    console.error('Failed to export as CSV:', error);
    return '';
  }
}

/**
 * Get summary statistics from all sessions
 */
export async function getStatistics(): Promise<{
  totalSessions: number;
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  averageStepsPerSession: number;
}> {
  try {
    const sessions = await getAllSessions();
    
    return {
      totalSessions: sessions.length,
      totalSteps: sessions.reduce((sum, s) => sum + s.stepCount, 0),
      totalDistance: sessions.reduce((sum, s) => sum + s.distanceKm, 0),
      totalCalories: sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
      averageStepsPerSession: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.stepCount, 0) / sessions.length
        : 0,
    };
  } catch (error) {
    console.error('Failed to get statistics:', error);
    return {
      totalSessions: 0,
      totalSteps: 0,
      totalDistance: 0,
      totalCalories: 0,
      averageStepsPerSession: 0,
    };
  }
}
