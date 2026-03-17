import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Smartphone, CheckCircle2, Calendar, Users, Calculator } from 'lucide-react';
import { Language, translations } from '../translations';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  attraction: {
    id: string;
    name: string;
    price?: number;
  };
  userId: string;
  lang: Language;
}

export function BookingModal({ isOpen, onClose, attraction, userId, lang }: BookingModalProps) {
  const t = translations[lang];
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [travelDate, setTravelDate] = useState('');
  const [people, setPeople] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe'>('telebirr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pricePerPerson = attraction.price || 2500; // Default price if not specified
  const totalAmount = pricePerPerson * people;

  const handleSubmitBooking = async () => {
    setStep('payment');
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId,
        attractionId: attraction.id,
        attractionName: attraction.name,
        travelDate,
        numberOfPeople: people,
        totalAmount,
        status: 'paid',
        paymentMethod,
        createdAt: serverTimestamp(),
      });
      setStep('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-news-ink/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-news-bg border-4 border-news-ink shadow-[16px_16px_0_0_rgba(26,26,26,1)] w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="border-b-4 border-news-ink p-6 flex justify-between items-center bg-news-ink text-news-bg">
            <h2 className="text-2xl font-serif font-bold uppercase tracking-tighter">
              {step === 'success' ? t.bookingSuccess : t.bookingForm}
            </h2>
            <button onClick={onClose} className="hover:rotate-90 transition-transform">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            {step === 'form' && (
              <div className="space-y-6">
                <div className="border-2 border-news-ink p-4 bg-news-ink/5">
                  <p className="font-mono text-xs uppercase tracking-widest text-news-ink/60 mb-1">Attraction</p>
                  <p className="text-2xl font-serif font-bold uppercase">{attraction.name}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-serif font-bold uppercase text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {t.travelDate}
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full p-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-serif font-bold uppercase text-sm mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> {t.numberOfPeople}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={people}
                      onChange={(e) => setPeople(parseInt(e.target.value))}
                      className="w-full p-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-news-ink pt-6 flex justify-between items-center">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-news-ink/60">{t.totalAmount}</p>
                    <p className="text-3xl font-serif font-bold">{totalAmount} ETB</p>
                  </div>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={!travelDate}
                    className="px-8 py-3 bg-news-ink text-news-bg font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90 disabled:opacity-50"
                  >
                    {t.confirmBooking}
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-8">
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-news-ink" />
                  <h3 className="text-2xl font-serif font-bold uppercase">{t.paymentMethod}</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setPaymentMethod('telebirr')}
                    className={`p-6 border-4 flex items-center gap-4 transition-all ${
                      paymentMethod === 'telebirr' ? 'border-news-ink bg-news-ink text-news-bg' : 'border-news-ink/20 hover:border-news-ink'
                    }`}
                  >
                    <Smartphone className="w-8 h-8" />
                    <div className="text-left">
                      <p className="font-serif font-bold uppercase">{t.payWithTelebirr}</p>
                      <p className="text-xs font-mono opacity-60">Mobile Payment</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cbe')}
                    className={`p-6 border-4 flex items-center gap-4 transition-all ${
                      paymentMethod === 'cbe' ? 'border-news-ink bg-news-ink text-news-bg' : 'border-news-ink/20 hover:border-news-ink'
                    }`}
                  >
                    <CreditCard className="w-8 h-8" />
                    <div className="text-left">
                      <p className="font-serif font-bold uppercase">{t.payWithCBE}</p>
                      <p className="text-xs font-mono opacity-60">Bank Transfer</p>
                    </div>
                  </button>
                </div>

                <div className="border-t-2 border-news-ink pt-6">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-news-ink text-news-bg font-serif font-bold text-xl uppercase tracking-widest hover:bg-news-ink/90 disabled:opacity-50 flex justify-center items-center gap-3"
                  >
                    {isSubmitting ? 'Processing...' : t.confirmBooking}
                  </button>
                  <button
                    onClick={() => setStep('form')}
                    className="w-full mt-4 py-2 text-news-ink font-serif font-bold uppercase tracking-widest hover:underline"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-12 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-news-ink text-news-bg rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter">{t.bookingSuccess}</h3>
                  <p className="font-serif italic text-news-ink/70">Your journey to {attraction.name} has been confirmed.</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-12 py-4 bg-news-ink text-news-bg font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
