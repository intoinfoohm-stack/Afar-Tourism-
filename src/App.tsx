import React, { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDocFromServer } from 'firebase/firestore';

import { Trip, UserProfile, Booking } from './types';
import { TripList } from './components/TripList';
import { TripDetail } from './components/TripDetail';
import { AfarTourism } from './components/AfarTourism';
import { BookingsList } from './components/BookingsList';
import { AIChatbot } from './components/AIChatbot';
import { Blog } from './components/Blog';
import { MediaGallery } from './components/MediaGallery';
import { Navbar } from './components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Map, Calendar, Plus, LogIn } from 'lucide-react';
import { Language, translations } from './translations';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [view, setView] = useState<string>('afar');
  const [lang, setLang] = useState<Language>('en');
  const [isAdmin, setIsAdmin] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('tripId');
    if (tripId) {
      setSelectedTripId(tripId);
    }
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (user) {
      // Sync user profile
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Check if admin
      const checkAdmin = async () => {
        const docSnap = await getDocFromServer(userRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile & { role?: string };
          setIsAdmin(profile.role === 'admin' || user.email === 'intoinfoohm@gmail.com');
        }
      };
      checkAdmin();

      // Listen for trips
      const q = query(
        collection(db, 'trips'),
        where('ownerId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tripData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trip[];
        setTrips(tripData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'trips');
      });

      // Listen for bookings
      const bq = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );

      const bUnsubscribe = onSnapshot(bq, (snapshot) => {
        const bookingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        setBookings(bookingData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      });

      return () => {
        unsubscribe();
        bUnsubscribe();
      };
    } else {
      setTrips([]);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-news-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Plane className="w-8 h-8 text-news-ink" />
        </motion.div>
      </div>
    );
  }

  // Allow viewing a shared trip even if not logged in
  if (!user && !selectedTripId) {
    if (view === 'afar') {
      return <AfarTourism onExplore={() => setView('app')} onBlogClick={() => setView('blog')} lang={lang} />;
    }

    const renderAuthView = () => (
      <div className="min-h-screen bg-news-bg flex flex-col items-center justify-center p-4 newspaper-grid">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 bg-news-bg p-12 border-4 border-news-ink shadow-[12px_12px_0_0_rgba(26,26,26,1)]"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-serif font-bold text-news-ink uppercase tracking-tighter">Arhot Aba</h1>
            <div className="h-1 bg-news-ink w-full" />
            <p className="text-news-ink font-mono tracking-widest uppercase text-[10px] font-bold">Your AI-Powered Travel Companion • Est. 2026</p>
            <div className="h-px bg-news-ink w-full" />
          </div>
          
          <div className="aspect-video overflow-hidden border-2 border-news-ink grayscale contrast-125">
            <img 
              src="https://picsum.photos/seed/travel/800/450" 
              alt="Travel" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-news-ink text-news-bg py-4 rounded-none font-serif text-xl font-bold hover:bg-news-ink/90 transition-all border-2 border-news-ink"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );

    const renderNavView = (content: React.ReactNode) => (
      <div className="min-h-screen bg-news-bg text-news-ink font-sans">
        <Navbar 
          user={{} as any} 
          onLogout={() => {}} 
          onViewChange={setView}
          currentView={view}
          lang={lang}
          onLangChange={setLang}
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {content}
        </main>
      </div>
    );

    if (view === 'about') return renderNavView(
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <h2 className="text-4xl font-serif italic">{t.about}</h2>
        <div className="prose prose-stone lg:prose-xl">
          <p>{t.aboutText}</p>
        </div>
      </div>
    );
    if (view === 'contact') return renderNavView(
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <h2 className="text-4xl font-serif italic">{t.contactUs}</h2>
        <div className="space-y-4">
          <p><strong>{t.email}:</strong> {t.contactEmail}</p>
          <p><strong>{t.phone}:</strong> {t.contactPhone}</p>
          <p><strong>{t.address}:</strong> {t.contactAddress}</p>
          <p><strong>{t.socialMedia}:</strong> {t.contactSocial}</p>
        </div>
      </div>
    );
    if (view === 'help') return renderNavView(
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <h2 className="text-4xl font-serif italic">{t.helpCenter}</h2>
        <p>Sign in to access our full help center.</p>
      </div>
    );
    if (view === 'vision') return renderNavView(
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <h2 className="text-4xl font-serif italic">{t.ourVision}</h2>
        <p>{t.visionText}</p>
      </div>
    );
    if (view === 'blog') return renderNavView(
      <Blog lang={lang} isAdmin={false} />
    );
    if (view === 'media') return renderNavView(
      <MediaGallery lang={lang} isAdmin={false} />
    );

    return renderAuthView();
  }

  return (
    <div className="min-h-screen bg-news-bg text-news-ink font-sans">
      <Navbar 
        user={user} 
        onLogout={logout} 
        onViewChange={setView}
        currentView={view}
        lang={lang}
        onLangChange={setLang}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'afar' ? (
            <motion.div
              key="afar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AfarTourism 
                onExplore={() => setView('app')} 
                onBlogClick={() => setView('blog')}
                lang={lang} 
                userId={user?.uid}
              />
            </motion.div>
          ) : view === 'bookings' ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b-4 border-news-ink pb-4 mb-8">
                <div>
                  <h2 className="text-4xl font-serif font-bold uppercase tracking-tighter">{t.myBookings}</h2>
                  <p className="text-news-ink font-mono text-[10px] uppercase tracking-widest font-bold">Manage your travel applications • {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <BookingsList bookings={bookings} lang={lang} />
            </motion.div>
          ) : view === 'blog' ? (
            <motion.div
              key="blog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Blog lang={lang} isAdmin={isAdmin} />
            </motion.div>
          ) : view === 'media' ? (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MediaGallery lang={lang} isAdmin={isAdmin} />
            </motion.div>
          ) : view === 'about' ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto py-12 space-y-8"
            >
              <h2 className="text-4xl font-serif italic">{t.about}</h2>
              <div className="prose prose-stone lg:prose-xl">
                <p>{t.aboutText}</p>
                <p>{t.missionText}</p>
              </div>
            </motion.div>
          ) : view === 'contact' ? (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto py-12 space-y-8"
            >
              <h2 className="text-4xl font-serif italic">{t.contactUs}</h2>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                <p className="text-stone-600">Have questions or feedback? We'd love to hear from you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t.email}</p>
                    <p className="text-emerald-600 font-medium">{t.contactEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t.phone}</p>
                    <p className="text-stone-900 font-medium">{t.contactPhone}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t.address}</p>
                    <p className="text-stone-900 font-medium">{t.contactAddress}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t.socialMedia}</p>
                    <p className="text-stone-900 font-medium">{t.contactSocial}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'help' ? (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto py-12 space-y-8"
            >
              <h2 className="text-4xl font-serif italic">{t.helpCenter}</h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-100">
                  <h4 className="font-bold mb-2">How to create a trip?</h4>
                  <p className="text-stone-500">Click the "New Trip" button on your dashboard, enter the details, and you're ready to go!</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-stone-100">
                  <h4 className="font-bold mb-2">How to invite collaborators?</h4>
                  <p className="text-stone-500">Open your trip details and use the "Manage Collaborators" section in the sidebar.</p>
                </div>
              </div>
            </motion.div>
          ) : view === 'vision' ? (
            <motion.div
              key="vision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto py-12 space-y-8"
            >
              <h2 className="text-4xl font-serif italic">{t.ourVision}</h2>
              <div className="prose prose-stone lg:prose-xl">
                <p>{t.visionText}</p>
              </div>
            </motion.div>
          ) : selectedTripId ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TripDetail 
                tripId={selectedTripId} 
                onBack={() => {
                  setSelectedTripId(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('tripId');
                  window.history.pushState({}, '', url);
                }}
                lang={lang}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b-4 border-news-ink pb-4 mb-8">
                <div>
                  <h2 className="text-4xl font-serif font-bold uppercase tracking-tighter">{t.myTrips}</h2>
                  <p className="text-news-ink font-mono text-[10px] uppercase tracking-widest font-bold">Plan your next adventure • {new Date().toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setShowNewTripModal(true)}
                  className="flex items-center gap-2 bg-news-ink text-news-bg px-6 py-3 rounded-none font-serif font-bold text-lg hover:bg-news-ink/90 transition-all border-2 border-news-ink"
                >
                  <Plus className="w-5 h-5" />
                  {t.newTrip}
                </button>
              </div>

              {trips.length > 0 ? (
                <TripList trips={trips} onSelectTrip={setSelectedTripId} />
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-3xl">
                  <Map className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-400">No trips planned yet. Start your journey today!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AIChatbot lang={lang} />

      {showNewTripModal && (
        <NewTripModal 
          onClose={() => setShowNewTripModal(false)} 
          userId={user.uid}
          onSuccess={(id) => {
            setShowNewTripModal(false);
            setSelectedTripId(id);
          }}
          lang={lang}
        />
      )}
    </div>
  );
}

function NewTripModal({ onClose, userId, onSuccess, lang = 'en' }: { onClose: () => void, userId: string, onSuccess: (id: string) => void, lang?: Language }) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(endDate) < new Date(startDate)) {
      setDateError(true);
      return;
    }
    
    setDateError(false);
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        title,
        destination,
        startDate,
        endDate,
        ownerId: userId,
        collaborators: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
      });
      onSuccess(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trips');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-news-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-news-bg border-4 border-news-ink p-8 max-w-md w-full shadow-[16px_16px_0_0_rgba(26,26,26,1)]"
      >
        <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter mb-8 border-b-4 border-news-ink pb-4">{t.startNewJourney}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.tripTitle}</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.newTripPlaceholder}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.destination}</label>
            <input 
              required
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder={t.destinationPlaceholder}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.startDate}</label>
              <input 
                required
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.endDate}</label>
              <input 
                required
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
              />
            </div>
          </div>
          {dateError && (
            <p className="text-red-600 text-xs font-mono font-bold uppercase tracking-widest bg-red-50 p-2 border border-red-200">
              {t.invalidDates}
            </p>
          )}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-serif font-bold uppercase tracking-widest text-news-ink hover:underline border-2 border-transparent">{t.cancel}</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-news-ink text-news-bg border-2 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '...' : t.createTrip}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
