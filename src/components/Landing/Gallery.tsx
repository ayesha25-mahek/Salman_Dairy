import React from 'react';
import { useDb } from '../../context/DbContext';
import { seedGalleryItems } from '../../utils/seedData';
import { motion } from 'framer-motion';

export const Gallery: React.FC = () => {
  const { gallery } = useDb();

  // If no database gallery items exist, fallback to seed placeholders
  const displayGallery = gallery && gallery.length > 0 ? gallery : seedGalleryItems;

  return (
    <section className="w-full py-12 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest bg-sky-500/10 px-3.5 py-1.5 rounded-full">
            Our Farm
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-white mt-4 mb-2">
            Life At Salman Dairy
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Hygienic processing and feed management at our dairy farm.
          </p>
        </div>

        {/* Gallery Grid - Very small images for mobile phone compatibility */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-w-4xl mx-auto">
          {displayGallery.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: (index % 6) * 0.05 }}
              className="group relative overflow-hidden rounded-xl aspect-square bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 shadow-2xs cursor-pointer"
            >
              {/* Image */}
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300 ease-out"
              />
              
              {/* Subtle hover overlay for name */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2 text-center select-none">
                <p className="text-white text-[10px] font-bold font-sans leading-tight">
                  {item.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
