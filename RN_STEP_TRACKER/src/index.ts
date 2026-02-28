/**
 * index.ts
 * 
 * Main export file for the step tracker module.
 * Users import from this single entry point.
 */

// Hooks
export { useStepTracker, type UseStepTrackerReturn } from './hooks/useStepTracker';

// Components
export { StepTrackerScreen } from './components/StepTrackerScreen';

// Storage utilities
export {
  saveSession,
  getAllSessions,
  deleteSession,
  clearAllSessions,
  exportSessionsAsJSON,
  exportSessionsAsCSV,
  getStatistics,
  type StoredSession,
} from './utils/storageManager';
