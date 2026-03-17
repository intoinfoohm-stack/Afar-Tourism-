import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, Calendar, Users, CreditCard } from 'lucide-react';
import { Booking } from '../types';
import { Language, translations } from '../translations';

interface BookingsListProps {
  bookings: Booking[];
  lang: Language;
}

export function BookingsList({ bookings, lang }: BookingsListProps) {
  const t = translations[lang];

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 border-4 border-dashed border-news-ink/10">
        <Clock className="w-12 h-12 text-news-ink/20 mx-auto mb-4" />
        <p className="text-news-ink/40 font-serif italic">No bookings found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {bookings.map((booking) => (
        <motion.div
          key={booking.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-news-bg border-4 border-news-ink p-8 shadow-[8px_8px_0_0_rgba(26,26,26,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-news-ink/60">Booking ID: {booking.id.slice(0, 8)}</p>
              <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter">{booking.attractionName}</h3>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm font-serif italic text-news-ink/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {booking.travelDate}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {booking.numberOfPeople} {t.people}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {booking.totalAmount} ETB ({booking.paymentMethod})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-6 py-2 border-2 border-news-ink font-serif font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${
              booking.status === 'paid' ? 'bg-news-ink text-news-bg' : 'bg-news-bg text-news-ink'
            }`}>
              {booking.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {t[booking.status as keyof typeof t] || booking.status}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
