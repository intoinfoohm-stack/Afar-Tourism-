import React, { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { BlogPost } from '../types';
import { motion } from 'motion/react';
import { X, Save, Eye, EyeOff, Tag, Image as ImageIcon, Type, FileText } from 'lucide-react';
import { Language, translations } from '../translations';
import { cn } from '../lib/utils';

interface BlogEditorProps {
  lang: Language;
  post: BlogPost | null;
  onClose: () => void;
}

export function BlogEditor({ lang, post, onClose }: BlogEditorProps) {
  const t = translations[lang];
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [coverImage, setCoverImage] = useState(post?.coverImage || '');
  const [category, setCategory] = useState<BlogPost['category']>(post?.category || 'news');
  const [tags, setTags] = useState(post?.tags.join(', ') || '');
  const [isPublished, setIsPublished] = useState(post?.isPublished || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    const postData = {
      title,
      content,
      coverImage,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isPublished,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Anonymous',
      authorPhoto: auth.currentUser.photoURL || '',
      createdAt: post?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (post) {
        await updateDoc(doc(db, 'posts', post.id), postData);
      } else {
        await addDoc(collection(db, 'posts'), postData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, post ? OperationType.UPDATE : OperationType.CREATE, post ? `posts/${post.id}` : 'posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between border-b-8 border-news-ink pb-8">
        <h2 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tighter leading-none">
          {post ? t.editPost : t.createPost}
        </h2>
        <button 
          onClick={onClose}
          className="p-4 border-4 border-news-ink hover:bg-news-ink hover:text-news-bg transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest">
                <Type className="w-4 h-4" />
                {t.postTitle}
              </label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a bold headline..."
                className="w-full px-6 py-4 border-4 border-news-ink bg-news-bg font-serif text-3xl font-bold uppercase tracking-tighter focus:outline-none focus:bg-news-ink/5 transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest">
                <ImageIcon className="w-4 h-4" />
                Cover Image URL
              </label>
              <input 
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-mono text-sm focus:outline-none focus:bg-news-ink/5 transition-all"
              />
              {coverImage && (
                <div className="h-48 w-full border-4 border-news-ink overflow-hidden">
                  <img 
                    src={coverImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover grayscale contrast-125"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest">
                <Tag className="w-4 h-4" />
                {t.category}
              </label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as BlogPost['category'])}
                className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-mono text-sm focus:outline-none focus:bg-news-ink/5 transition-all cursor-pointer"
              >
                <option value="news">{t.news}</option>
                <option value="story">{t.story}</option>
                <option value="culture">{t.culture}</option>
                <option value="guide">{t.guide}</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest">
                <Tag className="w-4 h-4" />
                {t.tags} (comma separated)
              </label>
              <input 
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Afar, Travel, Culture..."
                className="w-full px-4 py-3 border-2 border-news-ink bg-news-bg font-mono text-sm focus:outline-none focus:bg-news-ink/5 transition-all"
              />
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button 
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 border-4 font-mono text-xs font-bold uppercase tracking-widest transition-all",
                  isPublished ? "bg-news-ink text-news-bg border-news-ink" : "bg-news-bg text-news-ink/40 border-news-ink/20 hover:border-news-ink hover:text-news-ink"
                )}
              >
                {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isPublished ? t.publish : t.unpublish}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-mono font-bold text-news-ink/40 uppercase tracking-widest">
              <FileText className="w-4 h-4" />
              {t.postContent} (Markdown supported)
            </label>
            <textarea 
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tell your story here..."
              className="w-full h-[600px] px-8 py-8 border-4 border-news-ink bg-news-bg font-serif italic text-xl leading-relaxed focus:outline-none focus:bg-news-ink/5 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-6 pt-8 border-t-4 border-news-ink">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-4 font-serif font-bold uppercase tracking-widest text-news-ink hover:underline border-4 border-transparent"
          >
            {t.cancel}
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 py-4 bg-news-ink text-news-bg border-4 border-news-ink font-serif font-bold uppercase tracking-widest hover:bg-news-bg hover:text-news-ink transition-all shadow-[12px_12px_0_0_rgba(26,26,26,1)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            {isSubmitting ? '...' : t.publish}
          </button>
        </div>
      </form>
    </div>
  );
}
