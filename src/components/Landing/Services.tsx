import React from 'react';
import { Milk, Sparkles, Check, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICES = [
  {
    id: 'service-milk',
    title: 'Pure Farm Milk',
    tagline: 'Fresh Buffalo Milk',
    description: 'Freshly milked, pasteurized, and delivered cold to preserve its organic, sweet flavor and high cream content.',
    icon: Milk,
    available: true,
    badgeText: 'Available',
    features: ['100% Dilution Free', 'Naturally Pasteurized', 'Eco-friendly bottles', 'Chilled door delivery']
  },
  {
    id: 'service-ghee',
    title: 'Organic Desi Ghee',
    tagline: 'Traditional Butter Oil',
    description: 'Slow-cooked clarified butter made from cultured cream using traditional farm-style churning processes.',
    icon: Sparkles,
    available: false,
    badgeText: 'Coming Soon',
    features: ['Rich golden granules', 'Aromatic nutty flavor', 'No artificial colors', 'High smoke point']
  },
  {
    id: 'service-curd',
    title: 'Thick Farm Curd',
    tagline: 'Creamy probiotics-rich dahi',
    description: 'Naturally fermented dairy culture providing thick, creamy, and mildly sour yogurt for your family digestive health.',
    icon: Sparkles,
    available: false,
    badgeText: 'Coming Soon',
    features: ['Thick firm texture', 'Rich in probiotics', '100% natural setting', 'No synthetic starch']
  },
  {
    id: 'service-butter',
    title: 'Country Butter',
    tagline: 'Freshly churned table butter',
    description: 'Delicately salted or unsalted premium table butter, churned fresh from farm cream. Perfect for baking and toast.',
    icon: Sparkles,
    available: false,
    badgeText: 'Coming Soon',
    features: ['Rich dairy butter fat', 'Lightly salted option', 'Creamy spreadable', 'Freshly hand-molded']
  },
  {
    id: 'service-paneer',
    title: 'Fresh Paneer',
    tagline: 'Soft cottage cheese cubes',
    description: 'Fresh milk curdled with natural lemon juice and pressed to form velvety soft cottage cheese slabs daily.',
    icon: Sparkles,
    available: false,
    badgeText: 'Coming Soon',
    features: ['Soft melt-in-mouth', 'Packed with protein', 'No chemical coagulants', 'Vacuum sealed freshness']
  }
];

export const Services: React.FC = () => {
  return (
    <section className="w-full py-12 px-6 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest bg-sky-500/10 px-3.5 py-1.5 rounded-full">
            Our Offerings
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-white mt-4 mb-2">
            Dairy Services
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            We deliver fresh buffalo milk daily. Other organic dairy items are coming soon!
          </p>
        </div>

        {/* Services Horizontal Scroll Row */}
        <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-thin scrollbar-thumb-sky-200 scrollbar-track-transparent px-2 snap-x snap-mandatory">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 p-5 shadow-sm border transition-all duration-300 w-64 shrink-0 snap-start flex flex-col justify-between ${
                  service.available
                    ? 'border-sky-200 dark:border-sky-900/60 hover:border-sky-500/40 shadow-sky-500/5'
                    : 'border-slate-200 dark:border-slate-850 opacity-90 grayscale-[20%]'
                }`}
              >
                <div>
                  {/* Availability Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${
                      service.available 
                        ? 'bg-sky-500/10 text-sky-500' 
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                    }`}>
                      <Icon size={20} />
                    </div>

                    <div>
                      {service.available ? (
                        <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500 border border-sky-500/20 uppercase tracking-wide">
                          {service.badgeText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-750 uppercase tracking-wide">
                          {service.badgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service Details */}
                  <h3 className="text-base font-bold text-slate-850 dark:text-white font-display mb-0.5">
                    {service.title}
                  </h3>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2.5 ${
                    service.available ? 'text-sky-500' : 'text-slate-400'
                  }`}>
                    {service.tagline}
                  </p>
                  <p className="text-xs text-slate-555 dark:text-slate-400 leading-relaxed font-sans line-clamp-3 mb-4">
                    {service.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Highlights
                  </span>
                  <ul className="space-y-1.5">
                    {service.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-350">
                        <Check size={12} className={service.available ? 'text-sky-500 shrink-0' : 'text-slate-400 shrink-0'} />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
