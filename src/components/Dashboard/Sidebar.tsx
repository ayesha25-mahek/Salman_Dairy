import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  UserPlus,
  ArrowLeft, 
  Menu, 
  X, 
  LogOut 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDb } from '../../context/DbContext';

export type DashboardTab = 'dashboard' | 'register' | 'customers' | 'add_customer';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { logoutOwner } = useDb();

  const MENU_ITEMS = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', name: 'Record Daily Milk', icon: CalendarRange },
    { id: 'customers', name: 'My Customers', icon: Users },
    { id: 'add_customer', name: 'Add Customer', icon: UserPlus }
  ] as const;

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close drawer on mobile click
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-150 no-print">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold text-sm text-slate-850 font-sans">
          Salman Dairy Admin Panel
        </span>
        <div className="w-8 h-8" /> {/* Balance spacer */}
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-3xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container - Pure White Background, Sky-Blue Accents */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-white border-r border-slate-150 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="text-left bg-white">
          {/* Header Branding - Styled in clean blue like mockup */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white">
            <span className="font-black text-xl text-sky-500 font-sans tracking-wide">
              Salman Dairy
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Info Summary */}
          <div className="p-4 mx-4 mt-4 rounded-xl bg-sky-50/50 border border-sky-100/50">
            <h4 className="text-3xs font-bold text-sky-600 uppercase tracking-widest">Admin Control</h4>
            <p className="text-xs font-bold text-slate-700 mt-0.5">Owner Mode</p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 bg-white">
            {MENU_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all focus:outline-none ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 border border-sky-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-sky-500' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-1 text-left">
          {/* Back to Website */}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <ArrowLeft size={14} className="text-sky-500" />
            <span>Back to Site</span>
          </Link>
          
          {/* Logout Portal */}
          <button
            onClick={logoutOwner}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50/10 transition-all focus:outline-none text-left"
          >
            <LogOut size={14} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
