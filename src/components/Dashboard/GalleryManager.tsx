import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { seedGalleryItems } from '../../utils/seedData';
import { Image, PlusCircle, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const GalleryManager: React.FC = () => {
  const { gallery, addGalleryItem, deleteGalleryItem } = useDb();

  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Display items: if db gallery is empty, show default seeds for management fallback
  const displayItems = gallery && gallery.length > 0 ? gallery : seedGalleryItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim() || !title.trim()) return;

    setStatus('saving');
    try {
      const res = await addGalleryItem(imageUrl.trim(), title.trim());
      if (res) {
        setStatus('success');
        setImageUrl('');
        setTitle('');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this photo from the gallery?')) {
      await deleteGalleryItem(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
          Gallery Manager
        </h2>
        <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">
          Add new photo URLs to showcase your farm, cows, and hygiene processes on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Add Photo Form Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm text-left">
          <h3 className="font-bold text-slate-850 dark:text-white text-base font-display mb-4 flex items-center gap-2">
            <PlusCircle size={18} className="text-green-500" />
            <span>Add New Photo</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Image URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Photo Caption / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Feeding our cows fresh organic hay"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
              />
            </div>

            {/* Preview Area */}
            {imageUrl.trim().startsWith('http') && (
              <div className="space-y-1.5">
                <span className="block text-3xs font-bold text-slate-400 uppercase tracking-widest">
                  Preview
                </span>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-850">
                  <img
                    src={imageUrl}
                    alt="Gallery item preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold">
                <CheckCircle size={16} />
                <span>Photo published to landing page!</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>Publish failed. Please try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
            >
              {status === 'saving' ? 'Publishing...' : 'Publish Photo'}
            </button>
          </form>
        </div>

        {/* Existing Photos Grid Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm text-left">
          <h3 className="font-bold text-slate-850 dark:text-white text-base font-display mb-4 flex items-center gap-2">
            <Image size={18} className="text-green-500" />
            <span>Active Gallery Collection ({displayItems.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {displayItems.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="relative group overflow-hidden rounded-2xl border border-slate-150 dark:border-slate-850 aspect-video flex flex-col justify-end bg-slate-150 dark:bg-slate-900"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 flex flex-col justify-between" />

                {/* Delete button (top right) */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2.5 right-2.5 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none z-10"
                  title="Delete image"
                >
                  <Trash2 size={12} />
                </button>

                {/* Caption (bottom) */}
                <p className="relative z-10 text-white font-bold text-xs leading-snug drop-shadow-sm p-3 truncate">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
