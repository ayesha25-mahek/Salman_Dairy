import React, { useState } from 'react';
import { Menu, Sun, Moon, Shield, LogOut, UserCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useDb } from '../../context/DbContext';
import { OwnerAccessModal } from './OwnerAccessModal';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { ownerAuthenticated, logoutOwner, isLocalDb } = useDb();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');

  const handleOwnerAction = () => {
    if (ownerAuthenticated) {
      if (isDashboard) {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-effect shadow-sm no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left Section: Owner Portal Trigger / Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOwnerAction}
              className="flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
              title={ownerAuthenticated ? 'Go to Dashboard' : 'Owner Login'}
            >
              {ownerAuthenticated ? (
                <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400 font-semibold text-sm">
                  <UserCheck size={20} className="animate-pulse" />
                  <span className="hidden sm:inline">Portal</span>
                </div>
              ) : (
                <Menu size={24} />
              )}
            </button>
            
            {/* Database indicator */}
            {isLocalDb && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-medium text-amber-500 border border-amber-500/20">
                Demo DB
              </span>
            )}
          </div>

          {/* Center Section: Title Logo */}
          <div className="flex items-center justify-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-extrabold font-display tracking-tight text-slate-800 dark:text-white bg-clip-text">
                Salman Khan's <span className="text-sky-500">Dairy</span>
              </span>
            </Link>
          </div>

          {/* Right Section: Theme Toggle & Logout/Login */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Owner Logout or Link to Owner */}
            {ownerAuthenticated ? (
              <button
                onClick={() => {
                  logoutOwner();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-sm transition uppercase tracking-wider font-bold"
              >
                <Shield size={14} />
                <span>Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Owner Access Modal */}
      <OwnerAccessModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
