import React from 'react';
import { Navbar } from '../components/Common/Navbar';
import { Hero } from '../components/Landing/Hero';
import { CustomerLookup } from '../components/Landing/CustomerLookup';
import { WhyChooseUs } from '../components/Landing/WhyChooseUs';
import { Services } from '../components/Landing/Services';
import { Gallery } from '../components/Landing/Gallery';
import { Contact } from '../components/Landing/Contact';
import { FloatingWhatsApp } from '../components/Common/FloatingWhatsApp';
import { Award, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-grow bg-white">
        <Hero />
        <CustomerLookup />
        <WhyChooseUs />
        <Services />
        <Gallery />
        <Contact />
      </main>

      {/* Footer Section */}
      <footer className="bg-white border-t border-slate-150 py-12 px-6 no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Col 1: Branding and description */}
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-black font-sans text-slate-850">
              Salman Khan's <span className="text-sky-500">Dairy</span>
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed font-sans max-w-sm">
              Providing organic, pure, and raw farm-fresh milk to families since 2020. Our strict quality and hygiene controls guarantee fresh milk delivered daily to your doorstep.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Quick Directory
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-550">
              <li>
                <a href="#customer-lookup" className="hover:text-sky-500 transition">Check Record</a>
              </li>
              <li>
                <a href="#contact-details" className="hover:text-sky-500 transition">Support Help</a>
              </li>
              <li>
                <a href="#contact-details" className="hover:text-sky-500 transition">Farm Location</a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-sky-500 transition text-sky-500">Owner Panel</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Safe Protocols */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Quality Assurance
            </h4>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Award size={20} className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-2xs text-slate-500 leading-normal font-medium">
                Our farm holds strict ISO-equivalent hygiene standards. Our cows are free-range and fed organic grass. Zero additives, guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-3xs font-semibold uppercase tracking-wider text-slate-400">
          <span>
            © {new Date().getFullYear()} Salman Khan's Dairy. All Rights Reserved.
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart size={10} className="text-red-500 animate-pulse" /> for pure health.
          </span>
        </div>
      </footer>

      {/* Floating Action WhatsApp */}
      <FloatingWhatsApp />
    </div>
  );
};
