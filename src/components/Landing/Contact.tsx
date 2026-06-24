import React from 'react';
import { Phone, MessageSquare, MapPin, User, Navigation } from 'lucide-react';
import { useDb } from '../../context/DbContext';

export const Contact: React.FC = () => {
  const { settings } = useDb();

  const phone = settings?.owner_phone || '9010256658';
  const whatsapp = settings?.owner_whatsapp || '9010256658';
  const address = 'Salman Dairy Farm, Farooqnagar, Shadnagar, Telangana, India';
  
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
  
  const encodedAddress = encodeURIComponent(address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <section id="contact-details" className="w-full py-20 px-6 bg-sky-50 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Contact info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest bg-sky-500/10 px-3.5 py-1.5 rounded-full">
                Get In Touch
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-800 dark:text-white mt-4 mb-3">
                Contact Salman Dairy
              </h2>
              <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed">
                Have questions about our buffalo milk, delivery slots, or pricing? Want to register? Feel free to contact the owner directly.
              </p>
            </div>

            {/* Owner Profile Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-sky-100 dark:border-slate-850 shadow-md space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400">
                  <User size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Owner Name</h4>
                  <p className="font-bold text-slate-800 dark:text-white text-base">Salman Khan</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</h4>
                  <a href={`tel:${cleanPhone}`} className="font-bold text-slate-800 dark:text-white text-base hover:text-sky-500 transition">
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Farm Location</h4>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Buttons */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg font-display text-slate-800 dark:text-white mb-2">
              Quick Customer Support
            </h3>
            
            {/* Call Now */}
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-sky-500/30 shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500">
                  <Phone size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">Call Owner</span>
                  <span className="block text-xs text-slate-450 dark:text-slate-400 mt-0.5">Open mobile dialer directly</span>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Phone size={16} />
              </span>
            </a>

            {/* WhatsApp Chat */}
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Assalam-o-Alaikum%20Salman%20Dairy!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-sky-500/30 shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500">
                  <MessageSquare size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">Chat on WhatsApp</span>
                  <span className="block text-xs text-slate-450 dark:text-slate-400 mt-0.5">Send a message to order milk</span>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <MessageSquare size={16} />
              </span>
            </a>

            {/* Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-blue-500/30 shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500">
                  <Navigation size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">Google Maps Location</span>
                  <span className="block text-xs text-slate-450 dark:text-slate-400 mt-0.5">Farooqnagar, Shadnagar</span>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Navigation size={16} />
              </span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
