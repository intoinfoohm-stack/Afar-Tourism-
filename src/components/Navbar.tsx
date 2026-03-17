import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, User as UserIcon, Compass, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';

export function Navbar({ 
  user, 
  onLogout, 
  onViewChange, 
  currentView,
  lang,
  onLangChange
}: { 
  user: User, 
  onLogout: () => void, 
  onViewChange: (view: string) => void, 
  currentView: string,
  lang: Language,
  onLangChange: (lang: Language) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[lang];

  const navLinks = [
    { id: 'app', label: t.home },
    { id: 'blog', label: t.blog },
    { id: 'media', label: t.gallery },
    { id: 'bookings', label: t.myBookings },
    { id: 'about', label: t.about },
    { id: 'contact', label: t.contact },
    { id: 'help', label: t.help },
    { id: 'afar', label: t.visitAfar },
    { id: 'vision', label: t.vision },
  ];

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-news-bg border-b-4 border-news-ink sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleViewChange('app')}>
            <div className="w-12 h-12 bg-news-ink flex items-center justify-center border-2 border-news-ink shadow-[4px_4px_0_0_rgba(26,26,26,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
              <Compass className="text-news-bg w-7 h-7" />
            </div>
            <span className="text-3xl font-serif font-bold uppercase tracking-tighter">{t.appName}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleViewChange(link.id)}
                className={`px-4 py-2 text-sm font-serif font-bold uppercase tracking-widest transition-all border-b-2 ${
                  currentView === link.id 
                    ? 'border-news-ink text-news-ink' 
                    : 'border-transparent text-news-ink/40 hover:text-news-ink hover:border-news-ink/20'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 mr-4 border-r-2 border-news-ink/20 pr-4">
            <div className="flex items-center gap-2 text-news-ink">
              <Globe className="w-4 h-4" />
              <select 
                value={lang} 
                onChange={(e) => onLangChange(e.target.value as Language)}
                className="bg-transparent text-xs font-mono font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:underline transition-all"
              >
                <option value="en">EN</option>
                <option value="aa">AA</option>
                <option value="am">AM</option>
              </select>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user?.uid ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 border-2 border-news-ink bg-news-bg">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 border border-news-ink grayscale" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-news-ink" />
                  )}
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-news-ink">{user.displayName}</span>
                </div>
                
                <button 
                  onClick={onLogout}
                  className="p-2 text-news-ink hover:bg-news-ink hover:text-news-bg transition-all border-2 border-news-ink"
                  title={t.signOut}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleViewChange('app')}
                className="px-6 py-2 bg-news-ink text-news-bg border-2 border-news-ink font-serif font-bold text-sm hover:bg-news-ink/90 transition-all"
              >
                {t.signIn}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-news-ink border-2 border-news-ink hover:bg-news-ink hover:text-news-bg transition-all"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t-4 border-news-ink bg-news-bg overflow-hidden"
          >
            <div className="px-4 py-8 space-y-4">
              <div className="flex items-center justify-between px-6 py-4 mb-4 bg-news-ink text-news-bg border-2 border-news-ink">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Language / ቋንቋ</span>
                <div className="flex gap-6">
                  {(['en', 'aa', 'am'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => onLangChange(l)}
                      className={`text-xs font-mono font-bold uppercase tracking-widest ${lang === l ? 'underline decoration-2 underline-offset-4' : 'opacity-50 hover:opacity-100'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => handleViewChange(link.id)}
                  className={`w-full text-left px-6 py-4 border-2 transition-all font-serif font-bold uppercase tracking-widest ${
                    currentView === link.id 
                      ? 'bg-news-ink text-news-bg border-news-ink' 
                      : 'text-news-ink border-transparent hover:border-news-ink/20'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              
              <div className="pt-6 mt-6 border-t-2 border-news-ink/10">
                {user?.uid ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 px-6 py-4 bg-news-ink/5 border-2 border-news-ink">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 border border-news-ink grayscale" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-news-ink" />
                      )}
                      <div>
                        <p className="text-sm font-serif font-bold uppercase tracking-tight text-news-ink">{user.displayName}</p>
                        <p className="text-[10px] font-mono text-news-ink/60">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-6 py-4 text-news-ink border-2 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-ink hover:text-news-bg transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      {t.signOut}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleViewChange('app')}
                    className="w-full py-5 bg-news-ink text-news-bg border-2 border-news-ink font-serif font-bold text-lg uppercase tracking-widest hover:bg-news-ink/90 transition-all"
                  >
                    {t.signIn}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
