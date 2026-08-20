import React, { useState, useEffect } from 'react';
import { Phone, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDb } from '../../context/DbContext';

// Buffalo farm slideshow images
const SLIDESHOW_IMAGES = [
  '/images/cows_meadow.png',
  '/images/buffaloes_shed.png',
  '/images/buffalo_farm.png',
  '/images/dairy_farm.png'
];

export const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { settings } = useDb();
  
  const phoneNumber = settings?.owner_phone || '9010256658';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToLookup = () => {
    const lookupSection = document.getElementById('customer-lookup');
    if (lookupSection) {
      lookupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-[calc(100vh-4rem)] min-h-[550px] overflow-hidden flex items-center justify-center">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide}
            src={SLIDESHOW_IMAGES[currentSlide]}
            alt="Salman Dairy buffalo farm"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        {/* Dark blur overlay */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />
      </div>

      {/* Center Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 text-center flex flex-col items-center justify-center text-white select-none">
        
        {/* Animated Badge */}
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider border border-sky-500/30 mb-6 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          100% Pure Buffalo Milk
        </motion.span>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white mb-4"
        >
          Salman Khan's <span className="text-sky-400">Dairy</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-200 font-medium max-w-xl mb-10 leading-relaxed font-sans"
        >
          Pure Fresh Buffalo Milk Delivered Daily To Your Doorstep.
        </motion.p>

        {/* Buttons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <a
            href={`tel:${phoneNumber}`}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all text-sm uppercase tracking-wide focus:outline-none"
          >
            <Phone size={18} />
            <span>Call Now</span>
          </a>
          <button
            onClick={scrollToLookup}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 hover:border-white/30 backdrop-blur-md active:scale-95 transition-all text-sm uppercase tracking-wide focus:outline-none"
          >
            <Search size={18} />
            <span>My Record</span>
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToLookup}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-6 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
        >
          <span className="text-2xs font-semibold uppercase tracking-widest text-slate-300">Scroll Down</span>
          <ChevronDown size={18} className="animate-bounce" />
        </motion.button>

      </div>
    </section>
  );
};
