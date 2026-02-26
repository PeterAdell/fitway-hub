import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Smartphone, Play, Users, Award } from "lucide-react";
import { CalorieCalculator } from "@/components/website/CalorieCalculator";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative text-white py-14 md:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        
        <div className="container mx-auto px-2 sm:px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-3 sm:p-4 md:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              #1 Digital Fitness Ecosystem in Egypt
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-white">
              Transform Your Body, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Empower Your Mind
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Join Fitway Hub for accessible, certified, and human-driven fitness programs. 
              Whether you're a beginner or a pro, we have a plan for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link to="/app/login" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                Start Your Journey <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/about" className="w-full sm:w-auto px-8 py-4 bg-white/8 hover:bg-white/12 text-white border border-white/10 rounded-xl font-semibold transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Digital Fitness? */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-3 sm:p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">What is Digital Fitness?</h2>
                <p className="text-lg text-white/70 leading-relaxed">
                  Digital fitness bridges the gap between physical wellness and technology. 
                  At Fitway Hub, we bring the gym to you—providing certified training plans, 
                  nutrition guides, and community support right on your phone.
                </p>
                <ul className="space-y-4">
                  {[
                    "Access workouts anytime, anywhere",
                    "Track your progress with smart tools",
                    "Connect with a supportive community",
                    "Get expert advice from certified trainers"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/about" className="inline-flex items-center text-emerald-300 font-semibold hover:text-emerald-200 mt-4">
                  Read more about our mission <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-400/6 rounded-full blur-3xl opacity-30"></div>
                <img 
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
                  alt="Digital Fitness" 
                  className="relative rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-3 sm:p-4 md:p-8">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <CalorieCalculator />
              </div>
              <div className="order-1 lg:order-2 space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 text-white/80 text-sm font-medium">
                  <Award className="w-4 h-4" /> Smart Tools
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Know Your Numbers</h2>
                <p className="text-lg text-white/70">
                  Understanding your body is the first step to transformation. 
                  Use our free calorie calculator to estimate your daily energy needs based on your 
                  activity level and goals.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-6 pt-4">
                  <div className="backdrop-blur-md bg-white/8 p-4 rounded-xl border border-white/8">
                    <h4 className="font-semibold text-white mb-2">Scientific Formula</h4>
                    <p className="text-sm text-white/70">Based on the Mifflin-St Jeor equation for accuracy.</p>
                  </div>
                  <div className="backdrop-blur-md bg-white/8 p-4 rounded-xl border border-white/8">
                    <h4 className="font-semibold text-white mb-2">Personalized</h4>
                    <p className="text-sm text-white/70">Tailored to your specific body metrics and lifestyle.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Walkthrough / Features */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-2 sm:px-4 text-center mb-16">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-3 sm:p-4 md:p-8 inline-block">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need in One App</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              From workout tracking to nutrition planning, Fitway Hub is your pocket personal trainer.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-2 sm:px-4 grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Play,
              title: "Video Workouts",
              desc: "Follow along with high-quality video guides for every exercise.",
              img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop"
            },
            {
              icon: Users,
              title: "Community Support",
              desc: "Join challenges, share progress, and stay motivated with friends.",
              img: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"
            },
            {
              icon: Award,
              title: "Certified Programs",
              desc: "Plans designed by expert trainers for real, sustainable results.",
              img: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop"
            }
          ].map((feature, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl shadow-lg aspect-[4/5]">
              <img 
                src={feature.img} 
                alt={feature.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-800/10 skew-x-12 transform translate-x-20"></div>
        <div className="container mx-auto px-2 sm:px-4 relative z-10">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-3 sm:p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
                  Ready to Start Your <br /> Transformation?
                </h2>
                <p className="text-white/70 text-lg max-w-md">
                  Download the Fitway Hub app today and get access to your first workout plan for free.
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4">
                  <button className="flex items-center gap-3 bg-white text-slate-900 px-5 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors active:scale-95 transition-transform">
                    <Smartphone className="w-5 h-5" /> Download App
                  </button>
                  <Link to="/app/login" className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-colors border border-emerald-500 active:scale-95 transition-transform">
                    Sign Up Now
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative w-64 h-[500px] rounded-[3rem] border-8 border-white/6 shadow-2xl overflow-hidden bg-white/6 backdrop-blur-md">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-white/8 rounded-b-xl z-20"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2085&auto=format&fit=crop" 
                    alt="App Interface" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <p className="font-bold text-xl text-white">Fitway Hub</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
