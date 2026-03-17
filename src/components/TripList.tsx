import React, { useRef, useState } from 'react';
import { Trip } from '../types';
import { motion } from 'motion/react';
import { MapPin, Calendar, ChevronRight, Camera, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function TripList({ trips, onSelectTrip }: { trips: Trip[], onSelectTrip: (id: string) => void }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(tripId);
    try {
      const storageRef = ref(storage, `trips/${tripId}/cover_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'trips', tripId), {
        coverPhotoUrl: downloadURL
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => activeTripId && handleFileChange(e, activeTripId)}
      />
      {trips.map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group bg-news-bg overflow-hidden border-2 border-news-ink hover:shadow-[8px_8px_0_0_rgba(26,26,26,1)] transition-all cursor-pointer"
        >
          <div className="aspect-[16/10] relative overflow-hidden border-b-2 border-news-ink">
            <div 
              onClick={() => onSelectTrip(trip.id)}
              className="w-full h-full grayscale contrast-125"
            >
              <img 
                src={trip.coverPhotoUrl || `https://picsum.photos/seed/${encodeURIComponent(trip.destination)}/600/400`} 
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-news-ink/10" />
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTripId(trip.id);
                fileInputRef.current?.click();
              }}
              disabled={uploadingId === trip.id}
              className="absolute top-4 right-4 p-2 bg-news-bg border-2 border-news-ink text-news-ink hover:bg-news-ink hover:text-news-bg transition-all z-10"
              title="Change Cover Photo"
            >
              {uploadingId === trip.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>

            <div 
              onClick={() => onSelectTrip(trip.id)}
              className="absolute bottom-4 left-4 right-4 bg-news-bg/90 p-2 border border-news-ink"
            >
              <div className="flex items-center gap-2 text-news-ink text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
                <MapPin className="w-3 h-3" />
                {trip.destination}
              </div>
              <h3 className="text-news-ink text-xl font-serif font-bold uppercase tracking-tighter">{trip.title}</h3>
            </div>
          </div>
          
          <div 
            onClick={() => onSelectTrip(trip.id)}
            className="p-6 flex items-center justify-between bg-news-bg"
          >
            <div className="flex items-center gap-3 text-news-ink">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest">
                {format(new Date(trip.startDate), 'MMM d')} — {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="w-8 h-8 border-2 border-news-ink flex items-center justify-center group-hover:bg-news-ink group-hover:text-news-bg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
