import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Compass, Camera, Info, ArrowRight, CreditCard } from 'lucide-react';
import { Language, translations } from '../translations';
import { BookingModal } from './BookingModal';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { BlogPost } from '../types';
import { format } from 'date-fns';

const attractions = [
  {
    id: 'erta-ale',
    name: {
      en: 'Erta Ale',
      aa: 'Erta Ale',
      am: 'ኤርታ አሌ'
    },
    description: {
      en: 'An active volcano with one of the few permanent lava lakes in the world.',
      aa: 'Qalam-at raddi abah yan gubne, addunya-l meqe-l yan.',
      am: 'በዓለም ላይ ካሉ ጥቂት ቋሚ የላቫ ሐይቆች አንዱ የሚገኝበት ንቁ እሳተ ገሞራ።'
    },
    image: 'https://picsum.photos/seed/volcano/800/600',
    tags: {
      en: ['Volcano', 'Adventure'],
      aa: ['Gubne', 'Meqe'],
      am: ['እሳተ ገሞራ', 'ጀብዱ']
    }
  },
  {
    id: 'dallol',
    name: {
      en: 'Dallol',
      aa: 'Dallol',
      am: 'ዳሎል'
    },
    description: {
      en: 'A stunning place with colorful salt deposits and hot springs.',
      aa: 'Meqe baaxo, qalam-at kee lee-t qatway-l yan.',
      am: 'በቀለማት ያሸበረቁ የጨው ክምችቶች እና የፍል ውኃ ምንጮች የሚገኙበት አስደናቂ ቦታ።'
    },
    image: 'https://picsum.photos/seed/dallol/800/600',
    tags: {
      en: ['Nature', 'Colors'],
      aa: ['Baaxo', 'Qalam'],
      am: ['ተፈጥሮ', 'ቀለማት']
    }
  },
  {
    id: 'awash',
    name: {
      en: 'Awash National Park',
      aa: 'Awash National Park',
      am: 'አዋሽ ብሔራዊ ፓርክ'
    },
    description: {
      en: 'A park with wildlife, waterfalls, and stunning landscape views.',
      aa: 'Meqe baaxo, hayti kee lee-t qatway-l yan.',
      am: 'የዱር እንስሳት፣ ፏፏቴዎች እና አስደናቂ የመልክዓ ምድር እይታዎች የሚገኙበት ፓርክ።'
    },
    image: 'https://picsum.photos/seed/safari/800/600',
    tags: {
      en: ['Wildlife', 'Waterfall'],
      aa: ['Hayti', 'Lee'],
      am: ['ዱር እንስሳት', 'ፏፏቴ']
    }
  },
  {
    id: 'lucy',
    name: {
      en: 'Lucy - Cradle of Mankind',
      aa: 'Lucy - Cradle of Mankind',
      am: 'ሉሲ - የሰው ልጅ መገኛ'
    },
    description: {
      en: 'The historical site where the ancient human fossil (Lucy) was found.',
      aa: 'Lucy-t qaxu baaxo, addunya-l meqe-l yan.',
      am: 'የሰው ልጅ ጥንታዊ ቅሪተ አካል (ሉሲ) የተገኘበት ታሪካዊ ቦታ።'
    },
    image: 'https://picsum.photos/seed/history/800/600',
    tags: {
      en: ['History', 'Heritage'],
      aa: ['Baaxo', 'Qaxu'],
      am: ['ታሪክ', 'ቅርስ']
    }
  }
];

export function AfarTourism({ onExplore, onBlogClick, lang = 'en', userId }: { onExplore: () => void, onBlogClick: () => void, lang?: Language, userId?: string }) {
  const t = translations[lang];
  const [selectedAttraction, setSelectedAttraction] = useState<{ id: string; name: string } | null>(null);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLatestPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });
    return () => unsubscribe();
  }, []);

  const afarContent = {
    en: {
      welcome: 'Welcome to Afar',
      tagline: 'Discover the wonders of nature, ancient history, and breathtaking landscapes of the Afar region.',
      startJourney: 'Start Your Journey',
      popularAttractions: 'Popular Attractions',
      cultureTitle: 'Afar Culture & Hospitality',
      cultureDesc: 'The Afar people are known for their strong culture, unique dress style, and great hospitality. Experiencing local food and dances is a highlight of any trip.',
      guides: 'Guides',
      guidesDesc: 'Professional guides are always ready.',
      photography: 'Photography',
      photographyDesc: 'Capture stunning memories.',
      footer: '© 2026 Afar Tourism Portal. All rights reserved.'
    },
    aa: {
      welcome: 'Qafar-l Xayna',
      tagline: 'Qafar baaxoh meqe-l kee qaxu baaxooxu gubnah ku kataysu.',
      startJourney: 'Safar Ab',
      popularAttractions: 'Meqe Baaxooxu',
      cultureTitle: 'Qafar Baaxoh Gubne',
      cultureDesc: 'Qafar ummanti meqe-l kee qaxu baaxooxu gubnah abnah nanu.',
      guides: 'Malki',
      guidesDesc: 'Meqe malki nanu.',
      photography: 'Fotto',
      photographyDesc: 'Meqe fotto ab.',
      footer: '© 2026 Qafar Tourism Portal. All rights reserved.'
    },
    am: {
      welcome: 'እንኳን ወደ አፋር በሰላም መጡ',
      tagline: 'የተፈጥሮ ድንቆች፣ ጥንታዊ ታሪክ እና አስደናቂ መልክዓ ምድር መገኛ የሆነውን የአፋር ክልልን ይጎብኙ።',
      startJourney: 'ጉዞዎን ይጀምሩ',
      popularAttractions: 'ታዋቂ የመስህብ ስፍራዎች',
      cultureTitle: 'የአፋር ባህል እና እንግዳ ተቀባይነት',
      cultureDesc: 'የአፋር ህዝብ በጠንካራ ባህሉ፣ በልዩ የአለባበስ ዘይቤው እና በታላቅ እንግዳ ተቀባይነቱ ይታወቃል። በክልሉ የሚገኙትን ባህላዊ ምግቦች እና ጭፈራዎች መመልከት የጉዞዎ ትልቅ አካል ይሆናል።',
      guides: 'መመሪያዎች',
      guidesDesc: 'ባለሙያ አስጎብኚዎች ሁልጊዜ ዝግጁ ናቸው።',
      photography: 'ፎቶግራፍ',
      photographyDesc: 'አስደናቂ ትዝታዎችን ይቅረጹ።',
      footer: '© 2026 የአፋር ቱሪዝም መግቢያ። መብቱ በህግ የተጠበቀ ነው።'
    }
  };

  const c = afarContent[lang];

  return (
    <div className="min-h-screen bg-news-bg font-sans text-news-ink">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b-8 border-news-ink">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 grayscale contrast-125"
        >
          <img 
            src="https://picsum.photos/seed/afar-hero/1920/1080" 
            alt="Afar Landscape" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-news-ink/20" />
        </motion.div>
        
        <div className="relative z-10 text-center px-4 bg-news-bg/90 p-12 border-4 border-news-ink shadow-[16px_16px_0_0_rgba(26,26,26,1)] max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl mb-6 font-serif font-bold uppercase tracking-tighter leading-none"
          >
            {c.welcome}
          </motion.h1>
          <div className="h-1 bg-news-ink w-full mb-6" />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl font-serif italic max-w-2xl mx-auto leading-relaxed"
          >
            {c.tagline}
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onExplore}
            className="mt-10 px-10 py-4 bg-news-ink text-news-bg font-serif font-bold text-xl uppercase tracking-widest hover:bg-news-ink/90 transition-all flex items-center gap-3 mx-auto group border-2 border-news-ink"
          >
            {c.startJourney}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </div>
      </section>

      {/* Attractions Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 border-b-4 border-news-ink pb-8">
          <h2 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tighter">{c.popularAttractions}</h2>
          <p className="text-news-ink font-mono text-xs uppercase tracking-[0.3em] mt-4 font-bold">Must-Visit Destinations in the Afar Region</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {attractions.map((site, index) => (
            <motion.div 
              key={site.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer border-b-2 border-news-ink/10 pb-12"
            >
              <div className="relative aspect-[4/3] overflow-hidden mb-8 border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)] grayscale contrast-125">
                <img 
                  src={site.image} 
                  alt={site.name[lang]} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  {site.tags[lang].map(tag => (
                    <span key={tag} className="px-4 py-1.5 bg-news-bg border-2 border-news-ink text-news-ink text-[10px] font-mono font-bold uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-4xl mb-4 font-serif font-bold uppercase tracking-tighter group-hover:underline decoration-4 underline-offset-8">{site.name[lang]}</h3>
              <p className="text-news-ink/70 leading-relaxed text-lg font-serif italic mb-6">
                {site.description[lang]}
              </p>
              {userId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAttraction({ id: site.id, name: site.name[lang] });
                  }}
                  className="px-8 py-3 bg-news-ink text-news-bg font-serif font-bold uppercase tracking-widest hover:bg-news-ink/90 transition-all flex items-center gap-3 border-2 border-news-ink"
                >
                  <CreditCard className="w-5 h-5" />
                  {t.bookNow}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {selectedAttraction && userId && (
          <BookingModal
            isOpen={!!selectedAttraction}
            onClose={() => setSelectedAttraction(null)}
            attraction={selectedAttraction}
            userId={userId}
            lang={lang}
          />
        )}
      </section>

      {/* Cultural Section */}
      <section className="bg-news-ink text-news-bg py-32 overflow-hidden border-y-8 border-news-ink">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <h2 className="text-6xl font-serif font-bold uppercase tracking-tighter leading-none">{c.cultureTitle}</h2>
            <p className="text-news-bg/80 text-xl leading-relaxed font-serif italic">
              {c.cultureDesc}
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 border-2 border-news-bg/20">
                <Compass className="w-10 h-10 text-news-bg mb-6" />
                <h4 className="font-serif font-bold text-xl uppercase tracking-widest mb-2">{c.guides}</h4>
                <p className="text-sm font-mono text-news-bg/60 uppercase tracking-widest">{c.guidesDesc}</p>
              </div>
              <div className="p-8 border-2 border-news-bg/20">
                <Camera className="w-10 h-10 text-news-bg mb-6" />
                <h4 className="font-serif font-bold text-xl uppercase tracking-widest mb-2">{c.photography}</h4>
                <p className="text-sm font-mono text-news-bg/60 uppercase tracking-widest">{c.photographyDesc}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="aspect-square overflow-hidden border-8 border-news-bg/10 grayscale contrast-125 shadow-[24px_24px_0_0_rgba(253,252,240,0.1)]"
            >
              <img 
                src="https://picsum.photos/seed/afar-culture/800/800" 
                alt="Afar Culture" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-b-8 border-news-ink">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 border-b-4 border-news-ink pb-8">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tighter leading-none">{t.blog}</h2>
            <p className="text-news-ink font-mono text-xs uppercase tracking-[0.3em] font-bold">Latest Stories from the Afar Region</p>
          </div>
          <button 
            onClick={onBlogClick}
            className="px-8 py-3 border-4 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-ink hover:text-news-bg transition-all shadow-[8px_8px_0_0_rgba(26,26,26,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {t.readMore}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <div key={post.id} className="group cursor-pointer space-y-6" onClick={onBlogClick}>
                <div className="aspect-[16/9] overflow-hidden border-4 border-news-ink grayscale contrast-125 shadow-[8px_8px_0_0_rgba(26,26,26,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                  <img 
                    src={post.coverImage || `https://picsum.photos/seed/blog-${post.id}/800/450`} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-news-ink/40">
                    {t[post.category]} • {format(new Date(post.createdAt), 'MMM yyyy')}
                  </p>
                  <h4 className="text-2xl font-serif font-bold uppercase tracking-tighter group-hover:underline decoration-2 underline-offset-4 line-clamp-2">
                    {post.title}
                  </h4>
                </div>
              </div>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="group cursor-pointer space-y-6" onClick={onBlogClick}>
                <div className="aspect-[16/9] overflow-hidden border-4 border-news-ink grayscale contrast-125 shadow-[8px_8px_0_0_rgba(26,26,26,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                  <img 
                    src={`https://picsum.photos/seed/blog-${i}/800/450`} 
                    alt="Blog" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-news-ink/40">Travel Story • Mar 2026</p>
                  <h4 className="text-2xl font-serif font-bold uppercase tracking-tighter group-hover:underline decoration-2 underline-offset-4">
                    {i === 1 ? 'Exploring the Salt Plains' : i === 2 ? 'The Nomadic Life' : 'Afar Cuisine Guide'}
                  </h4>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-stone-400 text-sm border-t border-stone-200">
        <p>{c.footer}</p>
      </footer>
    </div>
  );
}
