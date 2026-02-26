import { Check, X, Crown, Star, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    // Mock payment processing
    setTimeout(() => {
      updateUser({ isPremium: true });
      alert("Welcome to Premium! You now have access to all features.");
      navigate("/app/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Unlock Your Full Potential</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Get personalized coaching, advanced analytics, and exclusive workout programs with Fitway Premium.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-3xl border border-white/20 relative">
            <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
            <p className="text-white/60 mb-6">Essential tools to get you moving.</p>
            <div className="text-4xl font-bold text-white mb-8">$0<span className="text-lg font-normal text-white/60">/mo</span></div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-white/80">
                <Check className="w-5 h-5 text-emerald-400" /> Basic Workout Programs
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <Check className="w-5 h-5 text-emerald-400" /> Community Access
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <Check className="w-5 h-5 text-emerald-400" /> Basic Progress Tracking
              </li>
              <li className="flex items-center gap-3 text-white/40">
                <X className="w-5 h-5" /> Advanced Analytics
              </li>
              <li className="flex items-center gap-3 text-white/40">
                <X className="w-5 h-5" /> 1-on-1 Coaching
              </li>
              <li className="flex items-center gap-3 text-white/40">
                <X className="w-5 h-5" /> Custom Meal Plans
              </li>
            </ul>

            <button 
              className="w-full py-3 rounded-xl font-bold border border-white/20 text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
              disabled={!user?.isPremium}
            >
              {user?.isPremium ? "Switch to Free" : "Current Plan"}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="backdrop-blur-md bg-gradient-to-br from-emerald-500/20 to-purple-500/20 text-white p-8 rounded-3xl border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl">
              RECOMMENDED
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Crown className="w-5 h-5 text-emerald-300" /> Premium
            </h3>
            <p className="text-white/70 mb-6">Everything you need for serious results.</p>
            <div className="text-4xl font-bold mb-8">$19.99<span className="text-lg font-normal text-white/60">/mo</span></div>
            
            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/30 rounded-full"><Check className="w-3 h-3 text-emerald-300" /></div>
                All Workout Programs
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/30 rounded-full"><Check className="w-3 h-3 text-emerald-300" /></div>
                Advanced Analytics & Insights
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/30 rounded-full"><Check className="w-3 h-3 text-emerald-300" /></div>
                1-on-1 Coaching Chat
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/30 rounded-full"><Check className="w-3 h-3 text-emerald-300" /></div>
                Personalized Nutrition Plans
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-emerald-400/30 rounded-full"><Check className="w-3 h-3 text-emerald-300" /></div>
                Priority Support
              </li>
            </ul>

            <button 
              onClick={handleUpgrade}
              disabled={user?.isPremium}
              className="w-full py-3 rounded-xl font-bold bg-emerald-500/80 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {user?.isPremium ? "Active Plan" : "Upgrade Now"}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 text-center">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white mb-2">Faster Results</h4>
            <p className="text-sm text-white/60">Premium members reach their goals 2x faster on average.</p>
          </div>
          <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 text-center">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white mb-2">Expert Guidance</h4>
            <p className="text-sm text-white/60">Direct access to certified trainers for form checks and advice.</p>
          </div>
          <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 text-center">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white mb-2">Exclusive Content</h4>
            <p className="text-sm text-white/60">New premium-only programs added every month.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
