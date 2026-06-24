import React, { useMemo } from 'react';
import { useDb } from '../../context/DbContext';
import { calculateCustomerBilling } from '../../utils/calculations';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { TrendingUp, BarChart3, Users, PieChart as PieIcon } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { customers, milkEntries, payments } = useDb();

  // 1. Calculate Daily Milk Consumption (Last 10 days of entries)
  const dailyConsumptionData = useMemo(() => {
    const datesMap: Record<string, number> = {};
    
    // Sort milk entries by date
    const sortedEntries = [...milkEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group quantity by date
    sortedEntries.forEach(entry => {
      // Limit to June 2026 for rich mock data
      if (entry.date.startsWith('2026-06')) {
        datesMap[entry.date] = (datesMap[entry.date] || 0) + Number(entry.quantity);
      }
    });

    // Convert map to array and take last 10 records
    return Object.entries(datesMap)
      .map(([date, litres]) => {
        const dayNum = parseInt(date.split('-')[2], 10);
        return {
          name: `Day ${dayNum}`,
          litres: Number(litres.toFixed(1))
        };
      })
      .slice(-10);
  }, [milkEntries]);

  // 2. Collection vs Pending Split
  const collectionSplitData = useMemo(() => {
    let collected = 0;
    let pending = 0;

    customers.forEach(customer => {
      const summary = calculateCustomerBilling(customer, milkEntries, payments, 2026, 6);
      collected += summary.totalPaid;
      pending += summary.pendingAmount;
    });

    return [
      { name: 'Collected Cash', value: Math.round(collected), color: '#22c55e' },
      { name: 'Pending Balance', value: Math.round(pending), color: '#ef4444' }
    ];
  }, [customers, milkEntries, payments]);

  // 3. Top Customers by Liter Consumption (June 2026)
  const topCustomersData = useMemo(() => {
    const data = customers.map(customer => {
      const summary = calculateCustomerBilling(customer, milkEntries, payments, 2026, 6);
      return {
        name: customer.name,
        litres: Number(summary.monthlyConsumption.toFixed(1))
      };
    });

    return data
      .sort((a, b) => b.litres - a.litres)
      .slice(0, 5); // Take top 5
  }, [customers, milkEntries, payments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
          Visual Analytics
        </h2>
        <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">
          Simpler graphs to track consumption, collections, and top customers.
        </p>
      </div>

      {/* Graphs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Daily Milk Consumption */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold font-display text-sm">
            <TrendingUp size={16} className="text-green-500" />
            <span>Daily Milk Delivered (Last 10 Days)</span>
          </div>
          <div className="h-64 w-full text-2xs">
            {dailyConsumptionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No logs found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyConsumptionData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'Litres', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="litres" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    dot={{ fill: '#22c55e', r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Cashflow (Collected vs Pending) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold font-display text-sm">
            <BarChart3 size={16} className="text-green-500" />
            <span>Dues Collection Status (Rs)</span>
          </div>
          <div className="h-64 w-full text-2xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionSplitData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `Rs. ${value}`} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {collectionSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top 5 Customers by Consumption */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold font-display text-sm">
            <Users size={16} className="text-green-500" />
            <span>Top 5 Customers by Litre Volume (Current Month)</span>
          </div>
          <div className="h-64 w-full text-2xs">
            {topCustomersData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No customers found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                  <Bar dataKey="litres" fill="#3b82f6" radius={[0, 8, 8, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
