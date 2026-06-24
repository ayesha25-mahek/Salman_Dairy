import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useDb } from '../../context/DbContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useDb();
  
  const whatsappNumber = settings?.owner_whatsapp || '9010256658';
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  
  const message = encodeURIComponent('Assalam-o-Alaikum Salman Dairy! I would like to enquire about fresh buffalo milk delivery.');

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-sky-300"
      aria-label="Contact Salman Dairy on WhatsApp"
    >
      {/* Ripple Ring Animation */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping pointer-events-none"></span>
      
      {/* Icon */}
      <MessageCircle size={28} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        WhatsApp Us
      </span>
    </a>
  );
};
