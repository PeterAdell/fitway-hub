import React, { useState, useEffect, useRef } from 'react';
import { Activity, TrendingUp, Calendar, Plus, Trash2, Zap, MapPin, Keyboard, Play, Square, AlertCircle, Loader, Wifi, WifiOff } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { calculateStepsFromDistance, calculateDistanceFromSteps, estimateCaloriesBurned, calculateCaloriesMET, UserMetrics } from '@/lib/stepCalculations';
// old location-tracking helpers are no longer required; MapTracker
// now performs geolocation, distance/step estimation, and polyline
// rendering. we keep the import commented out for reference.
// // Google Fit removed — using device geolocation + OpenStreetMap for live tracking
import MapTracker from '@/components/app/MapTracker';

interface StepsEntry {
  id: number;
  date: string;
  steps: number;
  calories_burned?: number;
  distance_km?: number;
  notes?: string;
  tracking_mode?: 'manual' | 'live' | 'live-premium';
  created_at: string;
}

interface WeeklyStats {
  totalSteps: number;
  avgSteps: number;
  maxSteps: number;
  totalCalories: number;
  daysTracked: number;
  entries: StepsEntry[];
}

export default function Steps() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [trackingMode, setTrackingMode] = useState<'manual' | 'live'>('manual');
  const [entries, setEntries] = useState<StepsEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<WeeklyStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Manual mode
  const [steps, setSteps] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  
  // Live tracking values (updated via MapTracker's onUpdate)
  const [autoDistance, setAutoDistance] = useState(0);
  const [autoSteps, setAutoSteps] = useState(0);
  const [autoSpeed, setAutoSpeed] = useState<number | null>(null);
  const [autoMet, setAutoMet] = useState<number | null>(null);
  const [trackedDuration, setTrackedDuration] = useState(0);
  
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Distance unit preference
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'm' | 'cm'>(() => {
    const saved = localStorage.getItem('fithub_distance_unit');
    return (saved as 'km' | 'm' | 'cm') || 'km';
  });

  // Convert internal distance (meters) to display value based on selected unit
  const getDisplayDistance = (distanceMeters: number): { value: number; unit: string } => {
    switch (distanceUnit) {
      case 'm':
        return { value: distanceMeters, unit: 'm' };
      case 'cm':
        return { value: Math.round(distanceMeters * 100), unit: 'cm' };
      case 'km':
      default:
        return { value: distanceMeters / 1000, unit: 'km' };
    }
  };

  const handleDistanceUnitChange = (unit: 'km' | 'm' | 'cm') => {
    setDistanceUnit(unit);
    localStorage.setItem('fithub_distance_unit', unit);
  };

  // Offline tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
    
    // Check offline steps on mount
    const offlineSteps = JSON.parse(localStorage.getItem('offline_steps') || '[]');
    setOfflineCount(offlineSteps.length);
    
    // Set up online/offline listeners
    const handleOnline = async () => {
      setIsOnline(true);
      setMessage(t('back_online_sync'));
      await syncOfflineSteps();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setMessage(t('offline_saved'));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const historyRes = await axios.get('/api/steps/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(historyRes.data.entries);

      const weekRes = await axios.get('/api/steps/stats/weekly', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyStats(weekRes.data.weeklyStats);

      const monthRes = await axios.get('/api/steps/stats/monthly', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonthlyStats(monthRes.data.monthlyStats);

      const todayRes = await axios.get(`/api/steps/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (todayRes.data.entry) {
        setSteps(todayRes.data.entry.steps.toString());
        setDistanceKm(todayRes.data.entry.distance_km?.toString() || '');
        setCalories(todayRes.data.entry.calories_burned?.toString() || '');
        setNotes(todayRes.data.entry.notes || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual mode: calculate steps from distance or vice versa
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const distance = parseFloat(e.target.value) || 0;
    setDistanceKm(e.target.value);
    
    if (distance > 0 && user?.height && user?.weight) {
      const userMetrics: UserMetrics = {
        height: user.height,
        weight: user.weight,
        gender: (user.gender as 'male' | 'female' | 'other') || 'other'
      };
      const calculatedSteps = calculateStepsFromDistance(distance, userMetrics);
      setSteps(calculatedSteps.toString());
      
      const met = calculateCaloriesMET({ weightKg: user.weight, heightCm: user.height, distanceKm: distance, gender: (user.gender as 'male'|'female'|'other') });
      setCalories(met.calories.toString());
    }
  };

  const handleStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stepsValue = parseInt(e.target.value) || 0;
    setSteps(e.target.value);
    
    if (stepsValue > 0 && user?.height && user?.weight) {
      const userMetrics: UserMetrics = {
        height: user.height,
        weight: user.weight,
        gender: (user.gender as 'male' | 'female' | 'other') || 'other'
      };
      const calculatedDistance = calculateDistanceFromSteps(stepsValue, userMetrics);
      setDistanceKm(calculatedDistance.toString());
      
      const met = calculateCaloriesMET({ weightKg: user.weight, heightCm: user.height, distanceKm: calculatedDistance, gender: (user.gender as 'male'|'female'|'other') });
      setCalories(met.calories.toString());
    }
  };

  // tracker state – values updated via MapTracker onUpdate callback
  const mapTrackerRef = useRef<any>(null);
  const [countMode, setCountMode] = useState<'perMeter' | 'stride'>(() => (localStorage.getItem('fithub_count_mode') as 'perMeter' | 'stride') || 'perMeter');

  // Helper: provide user metrics or sensible defaults for live estimation
  const getUserMetricsOrDefaults = (): UserMetrics => {
    return {
      height: user?.height || 170,
      weight: user?.weight || 70,
      gender: (user?.gender as 'male' | 'female' | 'other') || 'other'
    };
  };

  // live tracking updates come via MapTracker's onUpdate callback
  const handleMapUpdate = (data: { distanceMeters: number; steps: number; calories: number; speedKmh?: number; met?: number }) => {
    setAutoDistance(data.distanceMeters);
    setAutoSteps(data.steps);
    setCalories(data.calories.toString());
    setAutoSpeed(typeof data.speedKmh === 'number' ? data.speedKmh : null);
    setAutoMet(typeof data.met === 'number' ? data.met : null);
  };


  const saveOfflineSteps = (data: any) => {
    const offlineSteps = JSON.parse(localStorage.getItem('offline_steps') || '[]');
    offlineSteps.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('offline_steps', JSON.stringify(offlineSteps));
    setOfflineCount(offlineSteps.length);
  };

  const syncOfflineSteps = async () => {
    const offlineSteps = JSON.parse(localStorage.getItem('offline_steps') || '[]');
    if (offlineSteps.length === 0) return;
    
    setIsSyncing(true);
    let synced = 0;
    
    try {
      const token = localStorage.getItem('token');
      for (const data of offlineSteps) {
        try {
          const { timestamp, ...stepData } = data;
          await axios.post('/api/auth/offline-steps', stepData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          synced++;
        } catch (error) {
          console.error('Failed to sync offline step:', error);
        }
      }
      
      if (synced > 0) {
        localStorage.removeItem('offline_steps');
        setOfflineCount(0);
        setMessage(`✅ Synced ${synced} offline step(s)!`);
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      }
    } finally {
      setIsSyncing(false);
    }
  };


  const handleAddSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!steps || parseInt(steps) < 0) {
      setMessage('Please enter valid steps');
      return;
    }

    if (!user?.height || !user?.weight) {
      setMessage('Please update your height and weight in your profile');
      return;
    }

    const stepData = {
      date: selectedDate,
      steps: parseInt(steps),
      caloriesBurned: calories ? parseInt(calories) : undefined,
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      trackingMode: trackingMode,
      notes: notes || undefined
    };

    try {
      // If offline, save locally
      if (!isOnline) {
        saveOfflineSteps(stepData);
        setMessage('📱 Steps saved locally. Will sync when online.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const token = localStorage.getItem('token');
        await axios.post('/api/steps/add', stepData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('☁️ Steps recorded successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
      
      // Reset form on success
      setSteps('');
      setDistanceKm('');
      setCalories('');
      setNotes('');
      setAutoDistance(0);
      setAutoSteps(0);
      setTrackedDuration(0);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error adding steps:', error);
      if (!isOnline) {
        saveOfflineSteps(stepData);
        setMessage('📱 Saved offline (connection issue). Will sync when online.');
      } else {
        setMessage(error.response?.data?.message || 'Error adding steps');
      }
    }
  };

    const handleSaveSession = async (session: any) => {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/track/sessions', session, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Live tracking session saved.');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } catch (err: any) {
        console.error('Failed to save tracking session', err);
        setMessage('Failed to save tracking session.');
      }
    };



  const handleDeleteEntry = async (date: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/steps/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Entry deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error deleting entry');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Glassmorphism */}
        <div className="mb-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 backdrop-blur-md bg-blue-500/30 border border-blue-400/30 rounded-2xl">
              <Activity className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('activity_tracker') || 'Activity Tracker'}</h1>
              <p className="text-blue-200/80">{t('activity_sub') || 'Track your daily activity with precision'}</p>
            </div>
          </div>
        </div>


        {/* Offline Status & Sync */}
        <div className="mb-6 flex gap-4">
          {!isOnline && (
            <div className="flex-1 backdrop-blur-md bg-orange-500/20 border border-orange-400/30 text-orange-100 rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <WifiOff className="w-5 h-5" />
              <span>You are offline. {offlineCount > 0 ? `${offlineCount} steps pending sync.` : ''}</span>
            </div>
          )}
          {offlineCount > 0 && isOnline && (
            <button
              onClick={syncOfflineSteps}
              disabled={isSyncing}
              className="backdrop-blur-md bg-purple-500/20 border border-purple-400/30 text-purple-100 rounded-2xl p-4 shadow-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 font-medium flex items-center gap-2"
            >
              {isSyncing ? <Loader className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              Sync {offlineCount} Offline Step(s)
            </button>
          )}
        </div>
        
        {/* Message Alert */}
        {message && (
          <div className="mb-6 backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 rounded-2xl p-4 shadow-lg">
            {message}
          </div>
        )}

        {/* Quick Stats (Today's Summary) will be rendered inside the main grid so it appears before Record Activity on narrow screens */}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Summary (horizontal single-line scroll) */}
          {weeklyStats && (
            <div className="lg:col-span-3 order-1">
                  <div className="mb-6 overflow-x-auto whitespace-nowrap no-scrollbar px-1">
                    <div className="flex gap-4 items-stretch flex-nowrap">
                  {[
                    { label: 'Week Total', value: weeklyStats.totalSteps.toLocaleString(), subtext: `${weeklyStats.daysTracked} days`, color: 'from-blue-400 to-blue-600' },
                    { label: 'Daily Avg', value: weeklyStats.avgSteps.toLocaleString(), subtext: 'steps/day', color: 'from-purple-400 to-purple-600' },
                    { label: 'Peak Day', value: weeklyStats.maxSteps.toLocaleString(), subtext: 'highest', color: 'from-pink-400 to-pink-600' },
                    { label: 'Calories', value: weeklyStats.totalCalories.toLocaleString(), subtext: 'burned', color: 'from-orange-400 to-orange-600' }
                  ].map((stat, idx) => (
                        <div
                          key={idx}
                          className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition hover:bg-white/15 flex-shrink-0 min-w-[220px]"
                        >
                      <p className="text-sm font-medium text-white/70 mb-1">{stat.label}</p>
                          <p className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                      <p className="text-xs text-white/50 mt-2">{stat.subtext}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="lg:col-span-1 order-3 lg:order-2 min-w-0">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-blue-300" />
                Record Activity
              </h2>

              {/* Mode Toggle */}
              <div className="mb-6 p-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl flex gap-1">
                <button
                  onClick={() => setTrackingMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    trackingMode === 'manual'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <Keyboard className="w-4 h-4 inline mr-2" />
                  Manual
                </button>
                <button
                  onClick={() => setTrackingMode('live')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    trackingMode === 'live'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Live Tracking
                </button>
              </div>

              {trackingMode === 'manual' ? (
                <form onSubmit={handleAddSteps} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      value={distanceKm}
                      onChange={handleDistanceChange}
                      placeholder="0.0"
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                    <p className="text-xs text-white/50 mt-1">Auto-calculates steps</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Steps
                    </label>
                    <input
                      type="number"
                      value={steps}
                      onChange={handleStepsChange}
                      placeholder="0"
                      min="0"
                      max="100000"
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                    <p className="text-xs text-white/50 mt-1">Auto-calculates distance</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes..."
                      rows={2}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 backdrop-blur-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold text-white transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Activity'}
                  </button>
                </form>
              ) : (
                <div className="mb-4 space-y-4">
                  <div className="w-full box-border">
                    <MapTracker
                      ref={mapTrackerRef}
                      onUpdate={handleMapUpdate}
                      onComplete={(session) => handleSaveSession(session)}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <span className="text-white/70 text-sm">Distance Unit:</span>
                    <div className="inline-flex rounded-md bg-white/5 p-1">
                      <button onClick={() => handleDistanceUnitChange('km')} className={`px-2 py-1 text-xs rounded ${distanceUnit==='km' ? 'bg-emerald-500 text-white' : 'text-white/70'}`}>km</button>
                      <button onClick={() => handleDistanceUnitChange('m')} className={`px-2 py-1 text-xs rounded ${distanceUnit==='m' ? 'bg-emerald-500 text-white' : 'text-white/70'}`}>m</button>
                      <button onClick={() => handleDistanceUnitChange('cm')} className={`px-2 py-1 text-xs rounded ${distanceUnit==='cm' ? 'bg-emerald-500 text-white' : 'text-white/70'}`}>cm</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="backdrop-blur-md bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/50 text-xs" style={{fontSize:'0.7rem'}}>Distance</p>
                      <p className="text-base md:text-lg font-bold text-white">{getDisplayDistance(autoDistance).value.toFixed(distanceUnit === 'km' ? 2 : 0)} {getDisplayDistance(autoDistance).unit}</p>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/50 text-xs" style={{fontSize:'0.7rem'}}>Steps</p>
                      <p className="text-base md:text-lg font-bold text-white">{autoSteps.toLocaleString()}</p>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/50 text-xs" style={{fontSize:'0.7rem'}}>Calories</p>
                      <p className="text-base md:text-lg font-bold text-white">{calories || '0'}</p>
                    </div>
                  </div>
                </div>
              )}
          </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {['today', 'weekly', 'monthly'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-6 rounded-xl font-medium transition backdrop-blur-md border ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400/50 text-white shadow-lg'
                      : 'bg-white/10 border-white/20 text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'today' && (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">{t('todays_summary')}</h3>
                {steps ? (
                  <div className="space-y-4">
                    <div className="backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-2xl p-6">
                      <p className="text-white/70 text-sm mb-2">Steps</p>
                      <p className="text-4xl font-bold text-blue-300">{parseInt(steps).toLocaleString()}</p>
                    </div>
                    {distanceKm && (
                      <div className="backdrop-blur-md bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 rounded-2xl p-6">
                        <p className="text-white/70 text-sm mb-2">Distance</p>
                        <p className="text-4xl font-bold text-green-300">{distanceKm} km</p>
                      </div>
                    )}
                    {calories && (
                      <div className="backdrop-blur-md bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 rounded-2xl p-6">
                        <p className="text-white/70 text-sm mb-2">Calories Burned</p>
                        <p className="text-4xl font-bold text-orange-300">{calories}</p>
                      </div>
                    )}
                    {notes && (
                      <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-4">
                        <p className="text-white/70 text-sm"><strong>Notes:</strong> {notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-center py-12">{t('no_data_today_start')}</p>
                )}
              </div>
            )}

            {activeTab === 'weekly' && weeklyStats && (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">Weekly Breakdown</h3>
                <div className="space-y-3">
                  {weeklyStats.entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition group flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-white">{new Date(entry.date).toLocaleDateString()}</p>
                        <p className="text-sm text-white/60">{entry.steps.toLocaleString()} steps</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(entry.date)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'monthly' && monthlyStats && (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">Monthly History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {monthlyStats.entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition group flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-white">{new Date(entry.date).toLocaleDateString()}</p>
                        <p className="text-sm text-white/60">{entry.steps.toLocaleString()} steps</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(entry.date)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
