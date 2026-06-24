import React from 'react';
import { Milk } from 'lucide-react';
import { motion } from 'framer-motion';

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="w-full py-12 px-6 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Single box container */}
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center p-6 rounded-3xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 hover:shadow-lg transition-all duration-300 text-center"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 mb-4">
              <Milk size={24} />
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 font-display leading-tight">
              100% Pure Buffalo Milk Promise
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Directly from our farm to your doorstep. Guaranteed zero additives, zero water dilution, and strict hygiene protocols. Just pure, farm-fresh milk every single morning.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
