import { Link } from "react-router-dom";
import { Target, Eye, Heart, Shield, Globe, Users, BookOpen, Smartphone } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-4 md:p-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Fitway Hub</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              We are Egypt's leading digital fitness ecosystem, bridging the gap between physical wellness, digital support, and community empowerment.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="backdrop-blur-md bg-white/8 p-4 md:p-8 rounded-2xl border border-white/8">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 text-white">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-white/70 leading-relaxed">
                To empower individuals in Egypt with accessible, certified, and human-driven digital fitness services that foster healthy lifestyles and strong communities.
              </p>
            </div>
            <div className="backdrop-blur-md bg-white/8 p-4 md:p-8 rounded-2xl border border-white/8">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-white/70 leading-relaxed">
                To become Egypt & GCC's leading digital fitness ecosystem—bridging the gap between physical wellness, digital support, and community empowerment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Core Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Authenticity", desc: "No AI-generated training—real trainers, real support." },
              { icon: Globe, title: "Accessibility", desc: "Bilingual support and downloadable programs for all connectivity levels." },
              { icon: Users, title: "Community", desc: "Group challenges, chat groups, and forums." },
              { icon: BookOpen, title: "Knowledge", desc: "Courses to educate the public on fitness, nutrition, and wellness." },
              { icon: Heart, title: "Accountability", desc: "Follow-ups, milestones, and assessment features." },
            ].map((value, i) => (
              <div key={i} className="backdrop-blur-md bg-white/8 p-6 rounded-xl border border-white/8 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-white/70 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-12">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="p-4 md:p-8 rounded-2xl bg-white/8 text-slate-900 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-2xl font-bold mb-4 text-white">Community Subscription</h3>
                <p className="text-white/70 mb-6">Tailored for those willing to become part of a full community with a wide range of services.</p>
                <ul className="space-y-2 text-sm text-white/70 mb-8">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> General Programs (PPL, Full Body)</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Nutrition Facts Database</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Community Forums & Q&A</li>
                </ul>
                <Link to="/app/login" className="inline-block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors">
                  Join Community
                </Link>
              </div>

              <div className="p-4 md:p-8 rounded-2xl bg-white/8 border border-white/8 relative overflow-hidden group">
                <h3 className="text-2xl font-bold text-white mb-4">Fitness Subscription</h3>
                <p className="text-white/70 mb-6">Tailored for fitness gurus willing to create an unbreakable lifestyle.</p>
                <ul className="space-y-2 text-sm text-white/70 mb-8">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Personalized Fitness Program</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Custom Nutrition Plan</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Progress Follow-up</li>
                </ul>
                <Link to="/app/login" className="inline-block w-full text-center py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-colors">
                  Get Personalized Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-4 md:p-8">
            <Smartphone className="w-12 h-12 mx-auto mb-6 text-emerald-200" />
            <h2 className="text-3xl font-bold mb-4">Start Your Journey Today</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Download the Fitway Hub app and join thousands of others transforming their lives.
            </p>
            <div className="flex justify-center gap-4">
               <Link to="/app/login" className="bg-white text-emerald-700 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                 Sign Up Free
               </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
