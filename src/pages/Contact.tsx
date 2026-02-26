import { Mail, MessageCircle, Phone, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is the app available in Arabic?",
      a: "Yes! Fitway Hub is entirely bilingual, offering full support in both Arabic and English."
    },
    {
      q: "Do I need gym equipment?",
      a: "Not necessarily. We offer programs for gym, home (with equipment), and home (bodyweight only)."
    },
    {
      q: "Are the trainers certified?",
      a: "Absolutely. We pride ourselves on 'Authenticity' - all our trainers are certified professionals, not AI bots."
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes, you can cancel your subscription at any time from your account settings."
    }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-6">
            <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Have questions? We're here to help. Reach out to our team or check our FAQs below.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2 backdrop-blur-md bg-white/6 p-8 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
                  <input type="text" className="w-full rounded-lg bg-white/8 border border-white/10 p-3 text-sm text-white placeholder-white/40 focus:ring-emerald-400 focus:border-emerald-400" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input type="email" className="w-full rounded-lg bg-white/8 border border-white/10 p-3 text-sm text-white placeholder-white/40 focus:ring-emerald-400 focus:border-emerald-400" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Subject</label>
                <select className="w-full rounded-lg bg-white/8 border border-white/10 p-3 text-sm text-white placeholder-white/40 focus:ring-emerald-400 focus:border-emerald-400">
                  <option>General Inquiry</option>
                  <option>Support</option>
                  <option>Partnership</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Message</label>
                <textarea rows={5} className="w-full rounded-lg bg-white/8 border border-white/10 p-3 text-sm text-white placeholder-white/40 focus:ring-emerald-400 focus:border-emerald-400" placeholder="How can we help you?"></textarea>
              </div>
              <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-8">
            {/* Quick Contact */}
            <div className="backdrop-blur-md bg-white/8 p-8 rounded-2xl border border-white/8">
              <h3 className="text-xl font-bold text-white mb-6">Quick Contact</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Live Chat</p>
                    <p className="text-sm text-white/70">Available 9am - 5pm EST</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">WhatsApp</p>
                    <p className="text-sm text-white/70">+20 123 456 7890</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-sm text-white/70">support@fitwayhub.com</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* FAQ Accordion */}
            <div className="backdrop-blur-md bg-white/8 p-6 rounded-2xl border border-white/8">
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-bold text-white">FAQ</h3>
              </div>
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-white/8 last:border-0">
                    <button 
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-white/80 hover:text-emerald-300 transition-colors"
                    >
                      {faq.q}
                      {openFaq === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openFaq === index && (
                      <div className="pb-3 text-sm text-white/70 animate-in fade-in slide-in-from-top-1">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
