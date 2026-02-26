import { User, Settings, Bell, LogOut, Globe, Camera, Ruler, Weight, Crown, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [height, setHeight] = useState(user?.height || 0);
  const [weight, setWeight] = useState(user?.weight || 0);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [language, setLanguage] = useState(localStorage.getItem('fithub_lang') || 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => JSON.parse(localStorage.getItem('fithub_notifications') || 'true'));
  const navigate = useNavigate();

  const { t, setLang } = useI18n();

  const handleSave = () => {
    updateUser({ height, weight });
    setIsEditing(false);
  };
  const handleUpgrade = () => {
    navigate("/app/pricing");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-4 md:p-8 ${
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    }`}>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>My Profile</h1>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? "bg-white/10 text-yellow-300 hover:bg-white/20" 
                : "bg-slate-900/10 text-slate-600 hover:bg-slate-900/20"
            }`}
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* User Info */}
        <div className={`backdrop-blur-md p-6 rounded-2xl border transition-colors ${
          isDark
            ? "bg-white/10 border-white/20"
            : "bg-white/40 border-white/30"
        } flex flex-col md:flex-row items-center gap-6`}>
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-sm ${
              isDark 
                ? "bg-slate-700 border-white/20" 
                : "bg-slate-300 border-white/40"
            }`}>
               <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors backdrop-blur-sm">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.name}</h2>
            <p className={isDark ? "text-white/60" : "text-slate-600"}>{user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
              {user?.isPremium ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-500/50">
                  <Crown className="w-3 h-3" /> Premium Member
                </span>
              ) : (
                <button onClick={handleUpgrade} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-500/30 hover:bg-white/20 hover:border-emerald-400 transition-all">
                  Upgrade to Premium
                </button>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/30 text-emerald-200 border border-emerald-500/50">
                {user?.points} Points
              </span>
            </div>
          </div>
        </div>

        {/* Stats / Edit */}
        <div className={`backdrop-blur-md p-6 rounded-2xl border transition-colors ${
          isDark
            ? "bg-white/10 border-white/20"
            : "bg-white/40 border-white/30"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Physical Stats</h3>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`text-sm font-medium ${isDark ? "text-emerald-300 hover:text-emerald-200" : "text-emerald-600 hover:text-emerald-700"}`}
            >
              {isEditing ? "Save Changes" : "Edit Stats"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-blue-100 text-blue-600"
              }`}>
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>Height</p>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={height} 
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className={`w-20 p-1 border rounded ${
                        isDark
                          ? "border-white/20 bg-white/5 text-white placeholder-white/40"
                          : "border-slate-300 bg-white/60 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                    <span className={`text-sm font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>cm</span>
                  </div>
                ) : (
                  <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.height} <span className={`text-sm font-normal ${isDark ? "text-white/60" : "text-slate-600"}`}>cm</span></p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-rose-100 text-rose-600"
              }`}>
                <Weight className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>Weight</p>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className={`w-20 p-1 border rounded ${
                        isDark
                          ? "border-white/20 bg-white/5 text-white placeholder-white/40"
                          : "border-slate-300 bg-white/60 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                    <span className={`text-sm font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>kg</span>
                  </div>
                ) : (
                  <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.weight} <span className={`text-sm font-normal ${isDark ? "text-white/60" : "text-slate-600"}`}>kg</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h3>
          
          <div className={`backdrop-blur-md rounded-xl border divide-y transition-colors ${
            isDark
              ? "bg-white/10 border-white/20 divide-white/10"
              : "bg-white/40 border-white/30 divide-white/20"
          }`}>
            <button onClick={() => setShowAccountDetails((s) => !s)} className={`w-full flex items-center justify-between p-4 transition-colors ${
              isDark ? "hover:bg-white/5" : "hover:bg-white/20"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark
                    ? "bg-white/10 text-white/80"
                    : "bg-slate-900/10 text-slate-600"
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Account Details</span>
              </div>
              <span className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>{showAccountDetails ? 'Hide' : 'Edit'}</span>
            </button>

            {showAccountDetails && (
              <div className="p-4 border-t transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-2 rounded mt-1 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white/60 border border-slate-200 text-slate-900'}`} />
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-2 rounded mt-1 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white/60 border border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { updateUser({ name, email }); setShowAccountDetails(false); }} className="px-4 py-2 bg-emerald-500 text-white rounded">Save</button>
                  <button onClick={() => setShowAccountDetails(false)} className="px-4 py-2 bg-white/10 text-white rounded">Cancel</button>
                </div>
              </div>
            )}
            
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark
                    ? "bg-white/10 text-white/80"
                    : "bg-slate-900/10 text-slate-600"
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationsEnabled} onChange={(e) => { setNotificationsEnabled(e.target.checked); localStorage.setItem('fithub_notifications', JSON.stringify(e.target.checked)); }} className="sr-only" />
                <div className={`w-11 h-6 rounded-full ${notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-300'} transition-colors`}></div>
              </label>
            </div>
            
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark
                    ? "bg-white/10 text-white/80"
                    : "bg-slate-900/10 text-slate-600"
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Language</span>
              </div>
              <select value={language} onChange={(e) => { setLanguage(e.target.value); localStorage.setItem('fithub_lang', e.target.value); setLang(e.target.value as any); }} className={`bg-transparent text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            
            <button 
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                isDark ? "hover:bg-white/5" : "hover:bg-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark
                    ? "bg-white/10 text-white/80"
                    : "bg-slate-900/10 text-slate-600"
                }`}>
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Theme</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>{isDark ? "Dark" : "Light"}</span>
                <button onClick={(e) => { e.stopPropagation(); setTheme(false); }} className="text-xs px-2 py-1 rounded bg-white/10">Light</button>
                <button onClick={(e) => { e.stopPropagation(); setTheme(true); }} className="text-xs px-2 py-1 rounded bg-white/10">Dark</button>
              </div>
            </button>
          </div>
        </div>

        <button onClick={logout} className={`w-full flex items-center justify-center gap-2 font-medium p-4 rounded-xl transition-colors border ${
          isDark
            ? "text-rose-300 hover:bg-rose-500/20 border-rose-500/30"
            : "text-rose-600 hover:bg-rose-500/20 border-rose-400/30"
        }`}>
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}
