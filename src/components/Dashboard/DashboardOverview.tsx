import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CircleDollarSign, 
  ChevronRight, 
  FileText, 
  UserPlus
} from 'lucide-react';
import { useDb } from '../../context/DbContext';
import { calculateDashboardStats, formatCurrency } from '../../utils/calculations';
import { DashboardTab } from './Sidebar';

interface DashboardOverviewProps {
  setActiveTab: (tab: DashboardTab) => void;
  setSelectedCustomerId?: (id: string | null) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { customers, milkEntries, payments, settings } = useDb();

  // Get current date in local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();
  
  const stats = calculateDashboardStats(customers, milkEntries, payments, todayStr);

  const formattedDate = new Date(todayStr).toLocaleDateString('en-PK', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Resolve values (manual overrides from Settings take precedence)
  const todayLitresVal = settings?.override_today_litres !== undefined && settings?.override_today_litres !== null
    ? `${settings.override_today_litres} Litres`
    : `${stats.todayLitresSold} Litres`;

  const monthlyRevenueVal = settings?.override_monthly_revenue !== undefined && settings?.override_monthly_revenue !== null
    ? formatCurrency(Number(settings.override_monthly_revenue))
    : formatCurrency(stats.monthlyRevenue);

  const pendingPaymentsVal = settings?.override_pending_payments !== undefined && settings?.override_pending_payments !== null
    ? formatCurrency(Number(settings.override_pending_payments))
    : formatCurrency(stats.pendingPayments);

  const collectedPaymentsVal = settings?.override_collected_payments !== undefined && settings?.override_collected_payments !== null
    ? formatCurrency(Number(settings.override_collected_payments))
    : formatCurrency(stats.collectedPayments);

  const STATS_ITEMS = [
    {
      title: "Today's Litres Sold",
      value: todayLitresVal,
      subtitle: `${formattedDate} volume`,
      color: "bg-sky-500/10 text-sky-600",
      icon: TrendingUp
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenueVal,
      subtitle: "Current Month Total Bill",
      color: "bg-blue-500/10 text-blue-600",
      icon: DollarSign
    },
    {
      title: "Pending Payments",
      value: pendingPaymentsVal,
      subtitle: "Outstanding customer dues",
      color: "bg-red-500/10 text-red-655",
      icon: Clock
    },
    {
      title: "Collected Payments",
      value: collectedPaymentsVal,
      subtitle: "Total received cash",
      color: "bg-indigo-500/10 text-indigo-600",
      icon: CircleDollarSign
    }
  ];

  return (
    <div className="space-y-8 text-left bg-white">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black font-sans text-slate-850 leading-tight">
          Dashboard Overview
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Salman Dairy performance metrics and quick bookkeeping controls.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS_ITEMS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <span className="block text-2xl font-black text-slate-800 font-sans">
                  {stat.value}
                </span>
                <span className="block text-3xs text-slate-450 mt-1 font-semibold">
                  {stat.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions (Full width or centered since Recent Payments is removed) */}
      <div className="max-w-xl mx-auto p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base font-sans mb-4 text-center">
          Quick Navigation
        </h3>
        <div className="space-y-3">
          {/* Action: Add Customer */}
          <button
            onClick={() => setActiveTab('add_customer')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-sky-50/50 border border-sky-100 hover:border-sky-500/30 text-slate-700 font-semibold text-sm hover:bg-sky-500/5 group transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <UserPlus size={18} className="text-sky-500" />
              <span>Add Customer</span>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Action: Open Register */}
          <button
            onClick={() => setActiveTab('register')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-sky-50/50 border border-sky-100 hover:border-sky-500/30 text-slate-700 font-semibold text-sm hover:bg-sky-500/5 group transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-sky-500" />
              <span>Record Daily Milk</span>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
