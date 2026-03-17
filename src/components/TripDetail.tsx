import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, deleteDoc, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Trip, ItineraryItem, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, MapPin, Sparkles, Plus, Trash2, Clock, Map as MapIcon, Share2, Globe, Lock, Copy, Check, Users, UserPlus, X, Mail } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { getTripInsights, generateItinerarySuggestion } from '../services/gemini';
import { cn } from '../lib/utils';
import { MapView } from './MapView';
import { Language, translations } from '../translations';

export function TripDetail({ tripId, onBack, lang = 'en' }: { tripId: string, onBack: () => void, lang?: Language }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<UserProfile[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [dateError, setDateError] = useState(false);

  const t = translations[lang];
  const currentUser = auth.currentUser;
  const isOwner = trip && currentUser && trip.ownerId === currentUser.uid;
  const isCollaborator = trip && currentUser && (trip.ownerId === currentUser.uid || trip.collaborators.includes(currentUser.uid));
  const canEdit = isCollaborator;

  useEffect(() => {
    const tripRef = doc(db, 'trips', tripId);
    const unsubscribeTrip = onSnapshot(tripRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Trip;
        setTrip({ id: doc.id, ...data } as Trip);
        setEditStartDate(data.startDate);
        setEditEndDate(data.endDate);
        setError(null);
      } else {
        setError('Trip not found');
      }
    }, (err) => {
      setError('You do not have permission to view this trip or it is private.');
      handleFirestoreError(err, OperationType.GET, `trips/${tripId}`);
    });

    const itineraryRef = collection(db, 'trips', tripId, 'itinerary');
    const q = query(itineraryRef, orderBy('startTime', 'asc'));
    const unsubscribeItinerary = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ItineraryItem[];
      setItinerary(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/itinerary`);
    });

    return () => {
      unsubscribeTrip();
      unsubscribeItinerary();
    };
  }, [tripId]);

  useEffect(() => {
    if (trip?.collaborators && trip.collaborators.length > 0) {
      const fetchCollaborators = async () => {
        try {
          const q = query(collection(db, 'users'), where('uid', 'in', trip.collaborators));
          const snapshot = await getDocs(q);
          const profiles = snapshot.docs.map(doc => doc.data() as UserProfile);
          setCollaboratorProfiles(profiles);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      };
      fetchCollaborators();
    } else {
      setCollaboratorProfiles([]);
    }
  }, [trip?.collaborators]);

  const handleGetInsights = async () => {
    if (!trip || !canEdit) return;
    setLoadingInsights(true);
    const insights = await getTripInsights(trip.destination, trip.startDate, trip.endDate);
    await updateDoc(doc(db, 'trips', tripId), { aiInsights: insights });
    setLoadingInsights(false);
  };

  const handleGenerateItinerary = async () => {
    if (!trip || !canEdit) return;
    setGeneratingItinerary(true);
    try {
      const days = Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1);
      const suggestions = await generateItinerarySuggestion(trip.destination, days);
      
      const itineraryRef = collection(db, 'trips', tripId, 'itinerary');
      
      for (const suggestion of suggestions) {
        const dayOffset = (suggestion.day || 1) - 1;
        const date = addDays(new Date(trip.startDate), dayOffset);
        // Set a default time (e.g., 10 AM for first activity, 2 PM for second)
        date.setHours(suggestion.activity.toLowerCase().includes('dinner') ? 19 : 10, 0, 0, 0);
        
        await addDoc(itineraryRef, {
          tripId,
          title: suggestion.activity,
          description: suggestion.description,
          startTime: date.toISOString(),
          location: trip.destination,
          type: 'activity'
        });
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
    } finally {
      setGeneratingItinerary(false);
    }
  };

  const togglePublic = async () => {
    if (!isOwner) return;
    await updateDoc(doc(db, 'trips', tripId), { isPublic: !trip?.isPublic });
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?tripId=${tripId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !inviteEmail.trim()) return;
    
    setIsInviting(true);
    setInviteError('');
    
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.trim().toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setInviteError(t.userNotFound);
        return;
      }
      
      const userToAdd = snapshot.docs[0].data() as UserProfile;
      
      if (userToAdd.uid === currentUser?.uid) {
        setInviteError(t.alreadyOwner);
        return;
      }
      
      if (trip?.collaborators.includes(userToAdd.uid)) {
        setInviteError(t.alreadyCollaborator);
        return;
      }
      
      await updateDoc(doc(db, 'trips', tripId), {
        collaborators: arrayUnion(userToAdd.uid)
      });
      
      setInviteEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trips/collaborators');
      setInviteError(t.failedToAdd);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (uid: string) => {
    if (!isOwner) return;
    await updateDoc(doc(db, 'trips', tripId), {
      collaborators: arrayRemove(uid)
    });
  };

  const handleUpdateDates = async () => {
    if (new Date(editEndDate) < new Date(editStartDate)) {
      setDateError(true);
      return;
    }
    setDateError(false);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        startDate: editStartDate,
        endDate: editEndDate
      });
      setIsEditingDates(false);
    } catch (error) {
      console.error("Error updating dates:", error);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className="w-20 h-20 bg-news-ink/5 flex items-center justify-center border-4 border-news-ink">
          <Lock className="w-10 h-10 text-news-ink" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter">{t.privateTrip}</h3>
          <p className="text-news-ink/60 font-mono text-xs uppercase tracking-widest max-w-md">
            {error === 'Trip not found' ? t.tripNotFoundDesc : t.privateTripDesc}
          </p>
        </div>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-news-ink text-news-bg font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90 transition-all"
        >
          {t.backToJourneys}
        </button>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="space-y-8 pb-20">
      {!canEdit && (
        <div className="bg-news-ink text-news-bg p-4 flex items-center justify-between border-2 border-news-ink">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              {t.viewingSharedTrip}
            </span>
          </div>
          {!currentUser && (
            <button 
              onClick={() => window.location.reload()} 
              className="text-[10px] font-mono font-bold uppercase tracking-widest underline hover:no-underline"
            >
              {t.signInToCollaborate}
            </button>
          )}
        </div>
      )}

      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t.backToJourneys}
      </button>

      <div className="relative h-[400px] overflow-hidden border-4 border-news-ink shadow-[16px_16px_0_0_rgba(26,26,26,1)]">
        <img 
          src={trip.coverPhotoUrl || `https://picsum.photos/seed/${encodeURIComponent(trip.destination)}/1200/600`} 
          alt={trip.title}
          className="w-full h-full object-cover grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-news-ink/20" />
        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 bg-news-bg/90 p-6 border-2 border-news-ink">
            <div className="flex items-center gap-3 text-news-ink font-mono font-bold uppercase tracking-[0.2em] text-xs">
              <MapPin className="w-4 h-4" />
              {trip.destination}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-news-ink leading-tight uppercase tracking-tighter">{trip.title}</h1>
            
            {isEditingDates ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-1">{t.startDate}</label>
                    <input 
                      type="date"
                      value={editStartDate}
                      onChange={e => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-news-ink bg-news-bg font-serif text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-1">{t.endDate}</label>
                    <input 
                      type="date"
                      value={editEndDate}
                      onChange={e => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-news-ink bg-news-bg font-serif text-sm focus:outline-none"
                    />
                  </div>
                </div>
                {dateError && (
                  <p className="text-red-600 text-[10px] font-mono font-bold uppercase tracking-widest bg-red-50 p-2 border border-red-200">
                    {t.invalidDates}
                  </p>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdateDates}
                    className="px-4 py-2 bg-news-ink text-news-bg border-2 border-news-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-news-ink/90 transition-all"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingDates(false);
                      setEditStartDate(trip.startDate);
                      setEditEndDate(trip.endDate);
                      setDateError(false);
                    }}
                    className="px-4 py-2 bg-news-bg text-news-ink border-2 border-news-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-news-ink/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-news-ink/70 font-mono text-xs font-bold uppercase tracking-widest group/dates">
                <Calendar className="w-5 h-5" />
                <span>
                  {format(new Date(trip.startDate), 'MMMM d')} — {format(new Date(trip.endDate), 'MMMM d, yyyy')}
                </span>
                {canEdit && (
                  <button 
                    onClick={() => setIsEditingDates(true)}
                    className="opacity-0 group-hover/dates:opacity-100 p-1 hover:bg-news-ink/5 transition-all"
                  >
                    <Plus className="w-3 h-3 rotate-45" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {isOwner && (
              <button 
                onClick={togglePublic}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-2 text-xs font-mono font-bold uppercase tracking-widest transition-all",
                  trip.isPublic 
                    ? "bg-news-ink text-news-bg border-news-ink" 
                    : "bg-news-bg text-news-ink/40 border-news-ink/20 hover:border-news-ink hover:text-news-ink"
                )}
              >
                {trip.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {trip.isPublic ? t.public : t.private}
              </button>
            )}

            {trip.isPublic && (
              <button 
                onClick={copyShareLink}
                className="flex items-center gap-2 bg-news-bg border-2 border-news-ink text-news-ink px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-news-ink hover:text-news-bg transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? t.copied : t.shareLink}
              </button>
            )}
            
            {canEdit && (
              <button 
                onClick={handleGetInsights}
                disabled={loadingInsights}
                className="flex items-center gap-3 bg-news-ink text-news-bg border-2 border-news-ink px-8 py-4 font-serif font-bold text-lg hover:bg-news-ink/90 transition-all group"
              >
                <Sparkles className={cn("w-5 h-5", loadingInsights && "animate-pulse")} />
                {loadingInsights ? t.generating : t.aiInsights}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b-4 border-news-ink pb-4">
            <div className="flex items-center gap-6">
              <h2 className="text-4xl font-serif font-bold uppercase tracking-tighter">{t.itinerary}</h2>
              <div className="flex bg-news-ink/5 p-1 border-2 border-news-ink">
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest transition-all",
                    viewMode === 'list' ? "bg-news-ink text-news-bg" : "text-news-ink/40 hover:text-news-ink"
                  )}
                >
                  {t.list}
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest transition-all",
                    viewMode === 'map' ? "bg-news-ink text-news-bg" : "text-news-ink/40 hover:text-news-ink"
                  )}
                >
                  {t.map}
                </button>
              </div>
            </div>
            {canEdit && (
              <button 
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 bg-news-ink text-news-bg px-6 py-2 border-2 border-news-ink font-serif font-bold uppercase tracking-widest text-xs hover:bg-news-ink/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                {t.addActivity}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {viewMode === 'map' ? (
              <MapView destination={trip.destination} items={itinerary} lang={lang} />
            ) : itinerary.length > 0 ? (
              itinerary.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-6 group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-news-ink bg-news-bg flex items-center justify-center group-hover:bg-news-ink group-hover:text-news-bg transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 w-px bg-news-ink/20 my-2" />
                  </div>
                  <div className="flex-1 bg-news-bg p-8 border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    <div className="flex items-start justify-between mb-4 border-b border-news-ink/10 pb-4">
                      <div>
                        <span className="text-xs font-mono font-bold text-news-ink uppercase tracking-widest">
                          {format(new Date(item.startTime), 'h:mm a')}
                        </span>
                        <h4 className="text-2xl font-serif font-bold text-news-ink uppercase tracking-tight">{item.title}</h4>
                      </div>
                      {canEdit && (
                        <button 
                          onClick={() => deleteDoc(doc(db, 'trips', tripId, 'itinerary', item.id))}
                          className="p-2 text-news-ink/20 hover:text-news-ink transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {item.description && <p className="text-news-ink/70 text-lg font-serif italic leading-relaxed">{item.description}</p>}
                    {item.location && (
                      <div className="mt-6 flex items-center gap-2 text-news-ink/40 text-xs font-mono uppercase tracking-widest">
                        <MapIcon className="w-3 h-3" />
                        {item.location}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center bg-stone-50 rounded-[40px] border border-stone-100 border-dashed flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                  <MapIcon className="w-8 h-8 text-stone-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-stone-900 font-medium">{t.emptyItinerary}</p>
                  <p className="text-stone-400 text-sm italic">{t.emptyItineraryDesc}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowAddItem(true)}
                      className="px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium shadow-lg hover:bg-stone-800 transition-all"
                    >
                      {t.addFirstActivity}
                    </button>
                    <button 
                      onClick={handleGenerateItinerary}
                      disabled={generatingItinerary}
                      className="px-6 py-3 bg-white border border-stone-200 text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2 group"
                    >
                      <Sparkles className={cn("w-4 h-4 text-emerald-500", generatingItinerary && "animate-pulse")} />
                      {generatingItinerary ? t.craftingPlan : t.generateItinerary}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-news-ink p-8 text-news-bg border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)]">
            <div className="flex items-center gap-3 mb-6 border-b border-news-bg/20 pb-4">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-2xl font-serif font-bold uppercase tracking-tighter">{t.aiInsights}</h3>
            </div>
            {trip.aiInsights ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-news-bg/80 leading-relaxed whitespace-pre-wrap font-serif italic">
                  {trip.aiInsights}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-news-bg/60 text-sm font-serif italic">Get personalized recommendations for your trip.</p>
                {canEdit && (
                  <button 
                    onClick={handleGetInsights}
                    disabled={loadingInsights}
                    className="w-full py-3 bg-news-bg text-news-ink border-2 border-news-ink font-serif font-bold text-sm hover:bg-news-bg/90 transition-all"
                  >
                    {loadingInsights ? 'Thinking...' : 'Generate Insights'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-news-bg p-8 border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)]">
            <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-4 border-b-2 border-news-ink pb-2">{t.tripDetails}</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-news-ink/10">
                <span className="text-news-ink/40 text-xs font-mono font-bold uppercase tracking-widest">{t.status}</span>
                <span className="text-news-ink font-mono font-bold text-sm uppercase">{t.planned}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-news-ink/10">
                <span className="text-news-ink/40 text-xs font-mono font-bold uppercase tracking-widest">{t.duration}</span>
                <span className="text-news-ink font-mono font-bold text-sm uppercase">
                  {Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1)} {t.days}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-news-ink/40 text-xs font-mono font-bold uppercase tracking-widest">{t.collaborators}</span>
                <span className="text-news-ink font-mono font-bold text-sm uppercase">
                  {trip.collaborators.length === 0 ? t.onlyYou : `${trip.collaborators.length + 1} ${t.people}`}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="bg-white rounded-[32px] p-8 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-stone-400" />
                <h3 className="text-lg font-serif italic">{t.manageCollaborators}</h3>
              </div>
              
              <form onSubmit={handleAddCollaborator} className="mb-6">
                <div className="relative">
                  <input 
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder={t.inviteByEmail}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <button 
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                {inviteError && <p className="mt-2 text-xs text-red-500">{inviteError}</p>}
              </form>

              <div className="space-y-4">
                {collaboratorProfiles.map(profile => (
                  <div key={profile.uid} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.displayName || ''} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-stone-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-900">{profile.displayName}</p>
                        <p className="text-xs text-stone-400">{profile.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveCollaborator(profile.uid)}
                      className="p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddItem && (
        <AddItemModal 
          tripId={tripId} 
          onClose={() => setShowAddItem(false)} 
          lang={lang}
        />
      )}
    </div>
  );
}

function AddItemModal({ tripId, onClose, lang = 'en' }: { tripId: string, onClose: () => void, lang?: Language }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'trips', tripId, 'itinerary'), {
        tripId,
        title,
        description,
        startTime,
        location,
        type: 'activity',
      });
      onClose();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-news-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-news-bg border-4 border-news-ink p-8 max-w-md w-full shadow-[16px_16px_0_0_rgba(26,26,26,1)]"
      >
        <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter mb-8 border-b-4 border-news-ink pb-4">{t.addActivity}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.activityName}</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.time}</label>
            <input 
              required
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.location}</label>
            <input 
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.notes}</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all h-24 resize-none"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-serif font-bold uppercase tracking-widest text-news-ink hover:underline border-2 border-transparent">{t.cancel}</button>
            <button type="submit" className="flex-1 py-3 bg-news-ink text-news-bg border-2 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90 transition-all">{t.addToTrip}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
