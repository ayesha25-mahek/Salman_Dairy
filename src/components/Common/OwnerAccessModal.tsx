import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { useDb } from '../../context/DbContext';
import { motion, AnimatePresence } from 'framer-motion';

interface OwnerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerAccessModal: React.FC<OwnerAccessModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { authenticateOwner } = useDb();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the owner access code.');
      return;
    }

    const success = authenticateOwner(code);
    if (success) {
      setCode('');
      setError(null);
      onClose();
      navigate('/dashboard');
    } else {
      setError('Invalid code. Access denied.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mt-2 mb-6 text-left">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 mb-3">
                <KeyRound size={24} />
              </div>
              <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">
                Owner Portal Access
              </h2>
              <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
                Enter the access passcode to view management records.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="passcode"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                >
                  Enter Owner Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="passcode"
                    placeholder="Enter passcode"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(null);
                    }}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono font-bold"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyRound size={18} />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
                >
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-sky-500/20 active:scale-98 transition-all uppercase tracking-wider font-bold"
              >
                <span>Access Dashboard</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
              Authorized personnel only. Logs are maintained.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
