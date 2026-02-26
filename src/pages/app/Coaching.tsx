import { Calendar, MessageSquare, Video, Clock, Star, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';

const coaches = [
  {
    id: 1,
    name: "Sarah Miller",
    specialty: "Strength & Conditioning",
    rating: 4.9,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    available: true
  },
  {
    id: 2,
    name: "Mike Ross",
    specialty: "HIIT & Weight Loss",
    rating: 4.8,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    available: true
  },
  {
    id: 3,
    name: "Emma Wilson",
    specialty: "Yoga & Mobility",
    rating: 5.0,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    available: false
  }
];

export default function Coaching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingCoach, setBookingCoach] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const { t } = useI18n();

  if (!user?.isPremium) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 backdrop-blur-md bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
          <Lock className="w-10 h-10 text-white/60" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t('premium_coaching_title')}</h1>
        <p className="text-white/60 max-w-md mb-8">{t('premium_coaching_desc')}</p>
        <Link to="/app/pricing" className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 backdrop-blur-sm">{t('upgrade_premium')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t('personal_coaching')}</h1>
          <button onClick={() => navigate('/app/profile')} className="backdrop-blur-sm bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('my_sessions')}</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {coaches.map((coach) => (
            <div key={coach.id} className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 flex gap-6">
              <div className="w-20 h-20 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                <img src={coach.image} alt={coach.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">{coach.name}</h3>
                    <p className="text-sm text-emerald-300 font-medium">{coach.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" /> {coach.rating}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button onClick={() => navigate(`/app/chat?coach=${coach.id}`)} className="flex-1 backdrop-blur-sm bg-emerald-500/30 text-emerald-200 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/50 transition-colors flex items-center justify-center gap-2 border border-emerald-500/30">
                    <MessageSquare className="w-4 h-4" /> {t('chat')}
                  </button>
                  <button onClick={() => { setBookingCoach(coach); setBookingDate(''); setBookingTime(''); setBookingNote(''); }} className="flex-1 backdrop-blur-sm bg-white/10 text-white py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/20">
                    <Calendar className="w-4 h-4" /> {t('book')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        {bookingCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setBookingCoach(null)} />
            <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white">{t('book_with').replace('{coach}', bookingCoach.name)}</h4>
                <button onClick={() => setBookingCoach(null)} className="text-white/60"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/70">{t('date_label')}</label>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full p-2 rounded mt-1 bg-white/10 text-white border border-white/20" />
                </div>
                <div>
                  <label className="text-sm text-white/70">{t('time_label')}</label>
                  <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full p-2 rounded mt-1 bg-white/10 text-white border border-white/20" />
                </div>
                <div>
                  <label className="text-sm text-white/70">{t('note_label')}</label>
                  <input type="text" value={bookingNote} onChange={(e) => setBookingNote(e.target.value)} className="w-full p-2 rounded mt-1 bg-white/10 text-white border border-white/20" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setBookingCoach(null)} className="px-4 py-2 rounded bg-white/10 text-white">{t('cancel')}</button>
                  <button onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/coaching/book', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ coachId: bookingCoach.id, date: bookingDate, time: bookingTime, note: bookingNote })
                      });
                      if (!res.ok) throw new Error('Booking failed');
                      alert(t('booking_requested'));
                      setBookingCoach(null);
                    } catch (e) {
                      console.error(e);
                      alert(t('booking_failed'));
                    }
                  }} className="px-4 py-2 rounded bg-emerald-500 text-white">Request Booking</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20">
          <h3 className="text-lg font-bold text-white mb-6">{t('upcoming_sessions')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 backdrop-blur-sm bg-white/5 rounded-xl border border-white/10">
              <div className="p-3 backdrop-blur-sm bg-emerald-500/30 rounded-lg text-emerald-300">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{t('form_check_review')}</h4>
                <p className="text-sm text-white/60">{t('with_coach').replace('{coach}', 'Coach Sarah')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{t('tomorrow_label')}</p>
                <div className="flex items-center gap-1 text-xs text-white/60 justify-end">
                  <Clock className="w-3 h-3" /> 10:00 AM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
