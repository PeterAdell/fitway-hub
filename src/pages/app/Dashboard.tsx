import { StatCard } from "@/components/app/StatCard";
import { Activity, Flame, Droplets, Footprints, ChevronRight, PlayCircle, Plus, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useI18n } from '@/context/I18nContext';

export default function Dashboard() {
  const { user, token, updateUser } = useAuth();
  const [steps, setSteps] = useState(0);
  const [simulatedSteps, setSimulatedSteps] = useState(1000);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [myPlan, setMyPlan] = useState<any>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (token) {
      fetchSteps();
    }
    // fetch today's plan if available
    const tkn = token;
    if (tkn) {
      fetch('/api/workouts/my-plan', { headers: { Authorization: `Bearer ${tkn}` } })
        .then(r => r.json())
        .then(data => setMyPlan(data))
        .catch(() => setMyPlan(null));
    }
  }, [token]);

  const fetchSteps = async () => {
    try {
      const response = await fetch('/api/health/steps/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSteps(data.steps || 0);
      
      // If we have steps, update user context too
      if (data.steps > 0) {
        updateUser({ steps: data.steps });
      }
    } catch (error) {
      console.error("Failed to fetch steps:", error);
    }
  };

  const handleSyncSteps = async () => {
    setIsSyncing(true);
    try {
      // Sync steps to backend
      const response = await fetch('/api/health/steps/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ steps: steps + simulatedSteps })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSteps(prev => prev + simulatedSteps);
        updateUser({ steps: steps + simulatedSteps });
        alert(`Synced! Total steps: ${steps + simulatedSteps}`);
        
        // Trigger AI analysis
        analyzeSteps(steps + simulatedSteps);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync steps");
    } finally {
      setIsSyncing(false);
    }
  };

  const analyzeSteps = async (currentSteps: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-steps', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ steps: currentSteps })
      });
      
      const data = await response.json();
      setAiAnalysis(data);
    } catch (error) {
      console.error("AI Analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('greeting_hello').replace('{name}', user?.name.split(" ")[0] || '')}</h1>
            <p className="text-white/60">{t('ready_goals')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-emerald-400">{user?.points} Points</p>
              <p className="text-xs text-white/50">Level 5</p>
            </div>
            <div className="h-10 w-10 bg-slate-600 rounded-full overflow-hidden border border-white/20">
               <img src={user?.avatar} alt="Avatar" />
            </div>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('stat_steps')} 
          value={steps.toLocaleString()} 
          unit="/ 10k" 
          icon={Footprints} 
          color="emerald" 
          trend="+12% vs yesterday"
        />
        <StatCard 
          title={t('stat_calories')} 
          value={Math.floor(steps * 0.04).toLocaleString()} 
          unit="kcal" 
          icon={Flame} 
          color="rose" 
        />
        <StatCard 
          title={t('stat_water')} 
          value="1.2" 
          unit="L" 
          icon={Droplets} 
          color="blue" 
        />
        <StatCard 
          title={t('stat_activity')} 
          value={Math.floor(steps / 100).toString()} 
          unit="min" 
          icon={Activity} 
          color="amber" 
        />
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6" />
              <h3 className="font-bold text-lg">{t('ai_performance_analysis')}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-indigo-100 text-sm mb-1">{t('performance_rating')}</p>
                <p className="text-2xl font-bold mb-4">{aiAnalysis.performance_rating}</p>
                
                <p className="text-indigo-100 text-sm mb-1">{t('health_advice')}</p>
                <p className="font-medium">{aiAnalysis.health_advice}</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm font-bold text-indigo-100 mb-2">{t('motivational_message')}</p>
                <p className="italic mb-4">"{aiAnalysis.motivational_message}"</p>
                
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <span className="text-sm">{t('tomorrows_goal')}</span>
                  <span className="font-bold text-lg">{aiAnalysis.tomorrow_goal.toLocaleString()} steps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Activity Log removed — replaced by Quick Tools and Today's Plan */}

        {/* Today's Plan */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{t('todays_plan_title')}</h2>
            <Link to="/app/workouts" className="text-sm text-emerald-300 font-medium hover:text-emerald-200">{t('view_calendar')}</Link>
          </div>
        
        <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
            <div>
                <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-2">
                  {myPlan?.today?.label || t('default_day_label')}
                </div>
                <h3 className="text-2xl font-bold mb-2">{myPlan?.today?.title || t('default_upper_body')}</h3>
                <p className="text-slate-400 text-sm mb-4">{myPlan?.today?.notes || t('default_today_notes')}</p>
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700"></div>
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">+120</div>
              </div>
            </div>
            
            <button className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <PlayCircle className="w-5 h-5" /> Start Workout
            </button>
          </div>
        </div>
      </section>

        {/* Quick Tools */}
        <section>
            <h2 className="text-lg font-bold text-white mb-4">{t('quick_tools')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { name: t('tool_bmi_calc'), icon: Activity, color: "bg-blue-500/20 text-blue-300" },
               { name: t('tool_macros'), icon: Flame, color: "bg-rose-500/20 text-rose-300" },
               { name: t('tool_steps'), icon: Footprints, color: "bg-emerald-500/20 text-emerald-300" },
               { name: t('tool_water'), icon: Droplets, color: "bg-cyan-500/20 text-cyan-300" },
             ].map((tool, i) => (
               <Link to="/app/tools" key={i} className="backdrop-blur-md bg-white/10 p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all text-left group">
                 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", tool.color)}>
                   <tool.icon className="w-5 h-5" />
                 </div>
                 <span className="font-medium text-white group-hover:text-white/90">{tool.name}</span>
               </Link>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
