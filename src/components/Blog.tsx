import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { BlogPost, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, Tag, ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Language, translations } from '../translations';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { BlogEditor } from './BlogEditor';

interface BlogProps {
  lang: Language;
  isAdmin: boolean;
}

export function Blog({ lang, isAdmin }: BlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [filter, setFilter] = useState<BlogPost['category'] | 'all'>('all');
  const t = translations[lang];

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    let q;
    
    if (isAdmin) {
      q = filter === 'all' 
        ? query(postsRef, orderBy('createdAt', 'desc'))
        : query(postsRef, where('category', '==', filter), orderBy('createdAt', 'desc'));
    } else {
      q = filter === 'all'
        ? query(postsRef, where('isPublished', '==', true), orderBy('createdAt', 'desc'))
        : query(postsRef, where('isPublished', '==', true), where('category', '==', filter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      setPosts(postData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        isPublished: !post.isPublished
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  if (isEditing) {
    return (
      <BlogEditor 
        lang={lang} 
        post={editingPost} 
        onClose={() => {
          setIsEditing(false);
          setEditingPost(null);
        }} 
      />
    );
  }

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <button 
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 text-news-ink/40 hover:text-news-ink transition-all group font-mono text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t.backToBlog}
        </button>

        <article className="bg-news-bg border-4 border-news-ink shadow-[16px_16px_0_0_rgba(26,26,26,1)] overflow-hidden">
          {selectedPost.coverImage && (
            <div className="h-[400px] w-full border-b-4 border-news-ink">
              <img 
                src={selectedPost.coverImage} 
                alt={selectedPost.title} 
                className="w-full h-full object-cover grayscale contrast-125"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-4 border-b-4 border-news-ink pb-8">
              <div className="flex flex-wrap items-center gap-6 text-news-ink/60 font-mono text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2 px-2 py-1 bg-news-ink text-news-bg">
                  {t[selectedPost.category]}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedPost.createdAt), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedPost.authorName}
                </div>
                {selectedPost.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {selectedPost.tags.join(', ')}
                  </div>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-news-ink leading-tight uppercase tracking-tighter">
                {selectedPost.title}
              </h1>
            </div>

            <div className="prose prose-lg max-w-none font-serif text-news-ink leading-relaxed italic">
              <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-news-ink pb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-7xl md:text-9xl font-serif font-bold uppercase tracking-tighter leading-none">
              {t.blog}
            </h2>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-news-ink/40">
              Stories from the heart of Afar
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {(['all', 'news', 'story', 'culture', 'guide'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-4 py-2 border-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === cat 
                    ? "bg-news-ink text-news-bg border-news-ink" 
                    : "bg-news-bg text-news-ink/40 border-news-ink/20 hover:border-news-ink hover:text-news-ink"
                )}
              >
                {cat === 'all' ? 'All' : t[cat]}
              </button>
            ))}
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-news-ink text-news-bg px-8 py-4 border-4 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-bg hover:text-news-ink transition-all shadow-[8px_8px_0_0_rgba(26,26,26,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <Plus className="w-5 h-5" />
            {t.createPost}
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center border-4 border-dashed border-news-ink/20">
          <p className="font-serif italic text-news-ink/40 text-2xl">{t.noPosts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {posts.map((post, index) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col bg-news-bg border-4 border-news-ink shadow-[12px_12px_0_0_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden"
            >
              {post.coverImage && (
                <div className="h-64 w-full border-b-4 border-news-ink overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4 text-news-ink/40 font-mono text-[10px] font-bold uppercase tracking-widest">
                    <span className="px-2 py-0.5 bg-news-ink/10 text-news-ink">{t[post.category]}</span>
                    <span className="w-1 h-1 bg-news-ink/20 rounded-full" />
                    <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                    <span className="w-1 h-1 bg-news-ink/20 rounded-full" />
                    <span>{post.authorName}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePublish(post); }}
                        className={cn(
                          "p-2 border-2 transition-all",
                          post.isPublished ? "bg-news-ink text-news-bg border-news-ink" : "bg-news-bg text-news-ink/20 border-news-ink/20 hover:border-news-ink hover:text-news-ink"
                        )}
                        title={post.isPublished ? t.unpublish : t.publish}
                      >
                        {post.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPost(post); setIsEditing(true); }}
                        className="p-2 border-2 border-news-ink/20 hover:border-news-ink hover:text-news-ink transition-all"
                        title={t.editPost}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                        className="p-2 border-2 border-news-ink/20 hover:text-red-600 hover:border-red-600 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-3xl font-serif font-bold text-news-ink uppercase tracking-tighter leading-tight group-hover:underline decoration-4 underline-offset-4">
                    {post.title}
                  </h3>
                  <p className="text-news-ink/70 font-serif italic line-clamp-3 text-lg leading-relaxed">
                    {post.content.replace(/[#*`]/g, '').slice(0, 150)}...
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedPost(post)}
                  className="inline-flex items-center gap-2 text-news-ink font-mono text-xs font-bold uppercase tracking-widest group/btn"
                >
                  {t.readMore}
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
