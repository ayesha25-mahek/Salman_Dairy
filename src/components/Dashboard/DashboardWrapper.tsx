import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Sidebar, DashboardTab } from './Sidebar';
import { DashboardOverview } from './DashboardOverview';
import { MilkRegister } from './MilkRegister';
import { CustomerManagement } from './CustomerManagement';
import { AddCustomer } from './AddCustomer';
import { Settings } from './Settings';
import { KeyRound, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const DashboardWrapper: React.FC = () => {
  const { ownerAuthenticated, authenticateOwner, loginError } = useDb();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [code, setCode] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authenticateOwner(code);
  };

  // 1. Render Lock Screen Gate if unauthorized (Pure white background)
  if (!ownerAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Link back home */}
        <Link 
          to="/" 
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-500 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Homepage</span>
        </Link>

        {/* Lock Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-7 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 text-left"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 mx-auto">
            <KeyRound size={28} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold font-sans text-slate-800">
              Administrator Dashboard Access
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Please enter the access code to unlock management tables.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                Owner Passcode
              </label>
              <input
                type="password"
                placeholder="Enter passcode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-250 bg-slate-50 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs text-center tracking-widest font-bold"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:shadow-sky-500/10 active:scale-98 transition-all text-xs uppercase tracking-wide"
            >
              <span>Unlock Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <p className="text-3xs text-slate-400 text-center">
            Unauthorized activity will be logged. Backups are downloaded locally.
          </p>
        </motion.div>
      </div>
    );
  }

  // 2. Render Dashboard once Authorized (Pure white background)
  return (
    <div className="min-h-screen bg-white text-slate-800">
      
      {/* Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 min-h-screen flex flex-col bg-white">
        {/* Top bar (for desktop layout consistency) */}
        <header className="h-16 border-b border-slate-150 bg-white hidden lg:flex items-center justify-between px-8 no-print">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Salman Dairy Management Portal
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-2xs font-semibold text-slate-500 font-bold">Systems Operational</span>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto bg-white">
          {activeTab === 'dashboard' && (
            <DashboardOverview setActiveTab={setActiveTab} />
          )}
          {activeTab === 'register' && (
            <MilkRegister />
          )}
          {activeTab === 'customers' && (
            <CustomerManagement setActiveTab={setActiveTab} />
          )}
          {activeTab === 'add_customer' && (
            <AddCustomer />
          )}
          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>
    </div>
  );
};
