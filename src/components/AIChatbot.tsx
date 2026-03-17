import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import { Language, translations } from '../translations';
import { chatWithAI } from '../services/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function AIChatbot({ lang }: { lang: Language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'model', text: t.chatWelcome }]);
    }
  }, [isOpen, t.chatWelcome]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const response = await chatWithAI(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', text: response || '...' }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "bg-news-bg border-4 border-news-ink shadow-[16px_16px_0_0_rgba(26,26,26,1)] w-[350px] flex flex-col mb-4 overflow-hidden transition-all duration-300",
              isMinimized && "w-[200px]"
            )}
          >
            {/* Header */}
            <div className="bg-news-ink text-news-bg p-4 flex items-center justify-between border-b-2 border-news-ink">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-serif font-bold uppercase tracking-tighter text-sm">
                  {isMinimized ? 'AI' : t.aiAssistant}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-news-bg/10 p-1 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-news-bg/10 p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-serif scrollbar-thin scrollbar-thumb-news-ink">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex gap-2",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 flex-shrink-0 border-2 border-news-ink flex items-center justify-center",
                        msg.role === 'user' ? "bg-news-ink text-news-bg" : "bg-news-bg text-news-ink"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "p-3 text-sm border-2 border-news-ink max-w-[80%]",
                        msg.role === 'user' ? "bg-news-ink/5" : "bg-news-bg"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 border-2 border-news-ink bg-news-bg text-news-ink flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3 border-2 border-news-ink bg-news-bg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t-4 border-news-ink bg-news-ink/5">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t.chatPlaceholder}
                      className="flex-1 bg-news-bg border-2 border-news-ink p-2 text-sm font-serif focus:outline-none focus:bg-news-ink/5"
                    />
                    <button 
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-news-ink text-news-bg p-2 border-2 border-news-ink hover:bg-news-ink/90 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          "bg-news-ink text-news-bg p-4 border-4 border-news-ink shadow-[8px_8px_0_0_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3",
          isOpen && "hidden"
        )}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-serif font-bold uppercase tracking-widest text-sm">{t.aiAssistant}</span>
      </motion.button>
    </div>
  );
}
