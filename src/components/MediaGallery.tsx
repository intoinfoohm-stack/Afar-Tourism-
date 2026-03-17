import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Video, Plus, X, Trash2, Play, Image as ImageIcon } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Language, translations } from '../translations';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface MediaItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'image' | 'video';
  userId: string;
  userName: string;
  createdAt: any;
}

export function MediaGallery({ lang = 'en', isAdmin = false }: { lang?: Language, isAdmin?: boolean }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const t = translations[lang];
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MediaItem[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'media');
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !url) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'media'), {
        title,
        description,
        url,
        type,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setUrl('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      await deleteDoc(doc(db, 'media', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `media/${id}`);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-news-ink pb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-7xl md:text-9xl font-serif font-bold uppercase tracking-tighter leading-none">
              {t.gallery}
            </h2>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-news-ink/40">
              Visual stories from Afar
            </p>
          </div>
        </div>
        {user && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-news-ink text-news-bg px-8 py-4 border-2 border-news-ink font-serif font-bold uppercase tracking-widest text-lg hover:bg-news-ink/90 transition-all shadow-[8px_8px_0_0_rgba(26,26,26,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <Plus className="w-6 h-6" />
            {t.upload}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {media.length > 0 ? (
          media.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-news-bg border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)] overflow-hidden"
            >
              <div className="aspect-video relative overflow-hidden bg-news-ink/5">
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-news-ink/10 relative">
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-news-ink/20 group-hover:bg-transparent transition-all">
                      <Play className="w-12 h-12 text-news-bg fill-news-bg" />
                    </div>
                  </div>
                )}
                
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-news-ink text-news-bg font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    {item.type === 'image' ? <Camera className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    {t[item.type as keyof typeof t] || item.type}
                  </div>
                </div>

                {(isAdmin || (user && item.userId === user.uid)) && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-xl font-serif font-bold uppercase tracking-tight line-clamp-1">{item.title}</h3>
                {item.description && <p className="text-news-ink/60 text-sm font-serif italic line-clamp-2">{item.description}</p>}
                <div className="pt-4 flex items-center justify-between border-t border-news-ink/10">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-news-ink/40">
                    {item.userName}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-news-ink/40">
                    {item.createdAt ? format(item.createdAt.toDate(), 'MMM d, yyyy') : '...'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-news-ink/20">
            <ImageIcon className="w-12 h-12 text-news-ink/20 mx-auto mb-4" />
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-news-ink/40">{t.noMedia}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-news-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-news-bg border-4 border-news-ink p-8 max-w-md w-full shadow-[16px_16px_0_0_rgba(26,26,26,1)]"
            >
              <div className="flex items-center justify-between mb-8 border-b-4 border-news-ink pb-4">
                <h3 className="text-3xl font-serif font-bold uppercase tracking-tighter">{t.uploadMedia}</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-news-ink/5 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('image')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 border-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all",
                      type === 'image' ? "bg-news-ink text-news-bg border-news-ink" : "border-news-ink/20 text-news-ink/40 hover:border-news-ink"
                    )}
                  >
                    <Camera className="w-4 h-4" />
                    {t.photo}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('video')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 border-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all",
                      type === 'video' ? "bg-news-ink text-news-bg border-news-ink" : "border-news-ink/20 text-news-ink/40 hover:border-news-ink"
                    )}
                  >
                    <Video className="w-4 h-4" />
                    {t.video}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.mediaTitle}</label>
                  <input 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.mediaUrl}</label>
                  <input 
                    required
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest mb-2">{t.mediaDescription}</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-serif focus:outline-none focus:bg-news-ink/5 transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full py-4 bg-news-ink text-news-bg border-2 border-news-ink font-serif font-bold uppercase tracking-widest text-xl hover:bg-news-ink/90 transition-all disabled:opacity-50"
                >
                  {isUploading ? t.uploading : t.upload}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
