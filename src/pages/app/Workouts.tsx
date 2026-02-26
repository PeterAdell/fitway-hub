import { Dumbbell, Lock, PlayCircle, Clock, BarChart, Crown, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';

const programs = [
  {
    id: 1,
    title: "Push Pull Legs (PPL)",
    desc: "Classic 3-day split for muscle growth.",
    level: "Intermediate",
    duration: "60 min",
    isFree: true,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Upper / Lower Split",
    desc: "Balanced 4-day routine for strength.",
    level: "Beginner",
    duration: "45 min",
    isFree: true,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Pro Split",
    desc: "Advanced 5-day isolation training.",
    level: "Advanced",
    duration: "75 min",
    isFree: false,
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Personalized Plan",
    desc: "Custom plan tailored to your goals.",
    level: "All Levels",
    duration: "Custom",
    isFree: false,
    image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "HIIT Shred",
    desc: "High intensity interval training for fat loss.",
    level: "Intermediate",
    duration: "30 min",
    isFree: false,
    image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=2025&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Yoga Flow",
    desc: "Relaxing yoga for flexibility and mind.",
    level: "Beginner",
    duration: "45 min",
    isFree: false,
    image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 7,
    title: "Powerlifting 101",
    desc: "Master the big three lifts.",
    level: "Advanced",
    duration: "90 min",
    isFree: false,
    image: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 8,
    title: "Home Bodyweight",
    desc: "No equipment needed. Train anywhere.",
    level: "Beginner",
    duration: "20 min",
    isFree: true,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function Workouts() {
  const { user, updateUser } = useAuth() as any;
  const { t } = useI18n();
  const [view, setView] = useState<'browse'|'my-plan'>('browse');
  const [myTab, setMyTab] = useState<'workout'|'nutrition'>('workout');
  const [myPlan, setMyPlan] = useState<any>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerMinutes, setPlayerMinutes] = useState<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    // attempt to fetch user's plan (backend may not provide it yet)
    const token = localStorage.getItem('token');
    fetch('/api/workouts/my-plan', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMyPlan(data || null))
      .catch(() => setMyPlan(null));
    // check url for auto-start query
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('startWorkout') === 'true') {
        setView('my-plan');
        // if plan has today.duration parse later after myPlan loads
        // fallback to 60 minutes
        const m = parseInt(params.get('minutes') || '0', 10);
        if (m > 0) {
          openPlayerForMinutes(m);
        } else {
          // will open after myPlan fetched if available
          setTimeout(() => {
            const d = parseDuration(myPlan?.today?.duration || '') || 60;
            openPlayerForMinutes(d);
          }, 500);
        }
      }
    } catch (e) {}
  }, []);

  // parse human duration like '45 min' or '1h 30m'
  const parseDuration = (s: string) => {
    if (!s) return 60;
    s = s.toLowerCase();
    let minutes = 0;
    const hMatch = s.match(/(\d+)\s*h/);
    const mMatch = s.match(/(\d+)\s*min/);
    if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
    if (mMatch) minutes += parseInt(mMatch[1], 10);
    if (minutes === 0) {
      const n = parseInt(s.match(/(\d+)/)?.[1] || '60', 10);
      minutes = n;
    }
    return minutes;
  };

  const openPlayerForMinutes = (minutes: number) => {
    setPlayerMinutes(minutes);
    setTimeLeftSec(minutes * 60);
    setPlayerOpen(true);
  };

  // timer effect
  useEffect(() => {
    if (!playerOpen) return;
    if (timeLeftSec <= 0) return;
    const t = setInterval(() => setTimeLeftSec(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [playerOpen, timeLeftSec]);

  // award points when timer reaches 0
  const formatTime = (s:number) => {
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  useEffect(() => {
    if (!playerOpen) return;
    if (timeLeftSec === 0) {
      const pts = Math.max(1, Math.round((playerMinutes / 60) * 2));
      try {
        if (user && updateUser) {
          updateUser({ points: (user.points || 0) + pts });
          // attempt to sync with backend
          try {
            const token = localStorage.getItem('token');
            fetch('/api/user/points', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ points: pts }) });
          } catch (e) { console.warn('Points sync failed', e); }
        }
      } catch (e) {}
      const msg = t('workout_complete').replace('{pts}', String(pts));
      alert(msg);
      setPlayerOpen(false);
    }
  }, [timeLeftSec, playerOpen, playerMinutes, user, updateUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t('workouts_title')}</h1>
          <div className="flex gap-2">
            <button onClick={() => setView('browse')} className={`px-3 py-1 rounded-lg text-sm font-medium ${view==='browse'?'bg-emerald-500/80 text-white':'backdrop-blur-md bg-white/10 text-white border border-white/20'}`}>{t('browse')}</button>
            <button onClick={() => setView('my-plan')} className={`px-3 py-1 rounded-lg text-sm font-medium ${view==='my-plan'?'bg-purple-500/80 text-white':'backdrop-blur-md bg-white/10 text-white border border-white/20'}`}>{t('my_plan')}</button>
          </div>
        </div>

        {view === 'browse' && (
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="group relative backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 overflow-hidden hover:border-white/40 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{program.title}</h3>
                    <p className="text-white/60 text-sm">{program.desc}</p>
                  </div>
                  {!program.isFree && (
                    <div className="absolute top-4 right-4 bg-amber-500/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
                      <Crown className="w-3 h-3" /> {t('premium')}
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex items-center justify-between border-t border-white/10">
                  <div className="flex gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-1">
                      <BarChart className="w-4 h-4 text-emerald-400" />
                      {program.level}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      {program.duration}
                    </div>
                  </div>
                  
                  <button 
                    className={`p-2 rounded-full transition-colors ${
                      program.isFree || user?.isPremium 
                        ? 'backdrop-blur-sm bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50' 
                        : 'bg-white/5 text-white/40 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!program.isFree && !user?.isPremium) {
                        alert("This is a premium program. Please upgrade to access.");
                      }
                    }}
                  >
                      {program.isFree || user?.isPremium ? <PlayCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'my-plan' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setMyTab('workout')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${myTab==='workout'?'bg-emerald-500 text-white shadow':'bg-white/5 text-white/70'}`}>My Workout Plan</button>
              <button onClick={() => setMyTab('nutrition')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${myTab==='nutrition'?'bg-emerald-500 text-white shadow':'bg-white/5 text-white/70'}`}>My Nutrition Plan</button>
            </div>

            {/* Today's Plan */}
            <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                <div>
                  <div className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-2">{t('today_label')}</div>
                  <h3 className="text-xl font-bold">{myPlan?.today?.title || t('default_upper_body')}</h3>
                  <p className="text-slate-400 text-sm">{myPlan?.today?.notes || t('default_today_notes')}</p>
                </div>
                <button onClick={() => { navigate('/app/workouts?startWorkout=true'); }} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold active:scale-95 transition-transform">{t('start')}</button>
              </div>
            </div>

            {/* Tab content */}
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4">
              {myTab === 'workout' ? (
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('my_workout_plan')}</h4>
                  <p className="text-white/70 text-sm mb-4">{myPlan?.workout?.description || t('my_workout_plan_placeholder')}</p>
                  {/* detailed list */}
                  <ul className="space-y-4">
                    {(myPlan?.workout?.sessions || [{
                      name:'Day 1 - Push',
                      duration:'45 min',
                      exercises:[{name:'Bench Press', sets:4, reps:'8-10', notes:'Controlled tempo'}, {name:'Shoulder Press', sets:3, reps:'10', notes:'Seated'}],
                      notes:'Focus on form and tempo.'
                    }]).map((s:any, i:number) => (
                      <li key={i} className="p-4 rounded-xl bg-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-base">{s.name}</div>
                            <div className="text-xs text-white/60">{s.duration}</div>
                          </div>
                          <span className="text-xs text-emerald-300 font-bold">{s.date || ''}</span>
                        </div>
                        {s.exercises && (
                          <div className="mt-2">
                            <table className="w-full text-xs text-white/80">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-1">Exercise</th>
                                  <th>Sets</th>
                                  <th>Reps</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.exercises.map((ex:any, j:number) => (
                                  <tr key={j} className="border-b border-white/5">
                                    <td className="py-1">{ex.name}</td>
                                    <td className="text-center">{ex.sets}</td>
                                    <td className="text-center">{ex.reps}</td>
                                    <td className="text-center">{ex.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {s.notes && <div className="text-xs text-white/60 mt-2">Notes: {s.notes}</div>}
                        {myPlan?.coach && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={myPlan.coach.avatar} alt="Coach" className="w-6 h-6 rounded-full" />
                            <span className="text-xs text-white/70">Assigned by <span className="font-bold text-emerald-300">{myPlan.coach.name}</span></span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('my_nutrition_plan')}</h4>
                  <p className="text-white/70 text-sm mb-4">{myPlan?.nutrition?.notes || t('my_nutrition_placeholder')}</p>
                  <div className="p-3 rounded-lg bg-white/5">
                    <strong className="text-white">Breakfast:</strong> Oats, banana, whey
                    <div className="text-white/60 text-sm">Calories: 450 • Protein: 35g</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {playerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-4 md:p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{myPlan?.today?.title || 'Workout Session'}</h3>
                  <div className="text-sm text-white/70">{myPlan?.today?.notes || 'Follow along with the video and finish the timer to earn points.'}</div>
                </div>
                <button onClick={() => setPlayerOpen(false)} className="p-2 rounded-md bg-white/5 hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-black/40 rounded-lg flex items-center justify-center p-2">
                  {myPlan?.today?.videoUrl ? (
                    <video className="w-full h-full max-h-96 rounded-md" controls autoPlay src={myPlan.today.videoUrl} />
                  ) : (
                    <div className="w-full h-56 bg-white/5 rounded-md flex flex-col items-center justify-center">
                      <div className="text-sm text-white/60">No video provided.</div>
                      <div className="text-xs text-white/40">Timer will still track your session.</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center gap-4 p-4">
                  <div className="text-5xl font-mono">{formatTime(timeLeftSec)}</div>
                  <div className="text-sm text-white/70">Remaining</div>
                  <div className="w-full">
                    <button onClick={() => setTimeLeftSec(0)} className="w-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold">Finish Now</button>
                    <button onClick={() => setPlayerOpen(false)} className="w-full mt-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">Stop</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
