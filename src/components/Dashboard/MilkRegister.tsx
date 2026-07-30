import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../../context/DbContext';
import { MilkEntry } from '../../utils/seedData';
import { getDaysInMonth } from '../../utils/calculations';
import { Calendar, Search, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const MilkRegister: React.FC = () => {
  const { customers, milkEntries, saveMilkEntriesBatch, loading } = useDb();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // State for grid input overrides. Key format: `customer_id:date` -> value
  const [gridValues, setGridValues] = useState<Record<string, string>>({});

  const daysCount = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const monthString = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFutureDate = (dateStr: string) => {
    const todayStr = getTodayStr();
    return dateStr > todayStr;
  };

  // Load database entries into the local grid state
  useEffect(() => {
    const newGridValues: Record<string, string> = {};
    
    // Filter milk entries for the selected month
    const currentMonthEntries = milkEntries.filter(e => e.date.startsWith(monthString));
    
    currentMonthEntries.forEach(entry => {
      newGridValues[`${entry.customer_id}:${entry.date}`] = entry.quantity.toString();
    });

    setGridValues(newGridValues);
  }, [milkEntries, monthString]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    const selectedYearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    
    return customers.filter(c => {
      // 1. Search Filter
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.customer_code.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Creation date filter: customer must have been created in or before the selected month
      const createdDate = c.created_at ? c.created_at.split('T')[0] : '';
      const createdYearMonth = createdDate ? createdDate.substring(0, 7) : '';
      if (createdYearMonth && createdYearMonth > selectedYearMonth) {
        return false;
      }

      // 3. Deactivation date filter: if deactivated, they are removed from the NEXT month onwards
      if (c.deactivated_at) {
        const deactivatedDate = c.deactivated_at.split('T')[0];
        const deactivatedYearMonth = deactivatedDate.substring(0, 7);
        if (deactivatedYearMonth < selectedYearMonth) {
          return false;
        }
      }

      return true;
    });
  }, [customers, searchTerm, selectedYear, selectedMonth]);

  // Generate date strings for header
  const monthDays = useMemo(() => {
    const days: string[] = [];
    for (let d = 1; d <= daysCount; d++) {
      days.push(`${monthString}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [monthString, daysCount]);

  /**
   * Resolves the quantity value to display in the cell
   */
  const getDisplayValue = (customerId: string, date: string, customerDefaultQty: number) => {
    if (isFutureDate(date)) {
      return '';
    }

    const customer = customers.find(c => c.id === customerId);
    const createdAtDate = customer?.created_at ? customer.created_at.split('T')[0] : '';
    if (createdAtDate && date < createdAtDate) {
      return '';
    }

    if (customer?.deactivated_at) {
      const deactivatedDate = customer.deactivated_at.split('T')[0];
      if (date > deactivatedDate) {
        return '';
      }
    }

    const key = `${customerId}:${date}`;
    
    // If there is an explicit grid value for this cell, display it
    if (gridValues[key] !== undefined) {
      return gridValues[key];
    }
    
    // Carry-forward from previous days in this month
    const [year, month, dayStr] = date.split('-');
    const day = parseInt(dayStr, 10);
    
    for (let d = day - 1; d >= 1; d--) {
      const prevDateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const prevKey = `${customerId}:${prevDateStr}`;
      
      // Also respect creation date and deactivation date for the carry-forward source cell
      if (createdAtDate && prevDateStr < createdAtDate) {
        continue;
      }
      if (customer?.deactivated_at) {
        const deactivatedDate = customer.deactivated_at.split('T')[0];
        if (prevDateStr > deactivatedDate) {
          continue;
        }
      }
      
      if (gridValues[prevKey] !== undefined && gridValues[prevKey] !== '') {
        return gridValues[prevKey];
      }
    }
    
    // Fallback to customer's default quantity
    return customerDefaultQty.toString();
  };

  /**
   * Handle cell value change
   */
  const handleCellChange = (customerId: string, date: string, val: string) => {
    // Validate number input or empty string
    if (val !== '' && isNaN(Number(val))) return;
    
    const key = `${customerId}:${date}`;
    setGridValues(prev => ({
      ...prev,
      [key]: val
    }));
  };

  /**
   * Save the entire monthly register grid to the database
   */
  const handleSaveGrid = async () => {
    setSavingState('saving');
    
    try {
      const entriesToSave: MilkEntry[] = [];
      const selectedYearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      // Filter customers to only save entries for those active in the selected month
      const activeCustomersInMonth = customers.filter(c => {
        const createdDate = c.created_at ? c.created_at.split('T')[0] : '';
        const createdYearMonth = createdDate ? createdDate.substring(0, 7) : '';
        if (createdYearMonth && createdYearMonth > selectedYearMonth) {
          return false;
        }
        if (c.deactivated_at) {
          const deactivatedDate = c.deactivated_at.split('T')[0];
          const deactivatedYearMonth = deactivatedDate.substring(0, 7);
          if (deactivatedYearMonth < selectedYearMonth) {
            return false;
          }
        }
        return true;
      });

      activeCustomersInMonth.forEach(customer => {
        const createdAtDate = customer.created_at ? customer.created_at.split('T')[0] : '';
        const deactivatedDate = customer.deactivated_at ? customer.deactivated_at.split('T')[0] : '';

        // Loop through all days to gather explicit database entries
        for (let d = 1; d <= daysCount; d++) {
          const dateStr = `${monthString}-${String(d).padStart(2, '0')}`;
          
          // DO NOT save future dates
          if (isFutureDate(dateStr)) {
            continue;
          }

          // DO NOT save dates before creation
          if (createdAtDate && dateStr < createdAtDate) {
            continue;
          }

          // DO NOT save dates after deactivation
          if (deactivatedDate && dateStr > deactivatedDate) {
            continue;
          }
          
          const displayQtyStr = getDisplayValue(customer.id, dateStr, customer.default_quantity);
          const qtyToSave = displayQtyStr !== '' ? Number(displayQtyStr) : customer.default_quantity;

          entriesToSave.push({
            id: crypto.randomUUID(),
            customer_id: customer.id,
            date: dateStr,
            quantity: qtyToSave,
            created_at: new Date().toISOString()
          });
        }
      });

      const res = await saveMilkEntriesBatch(entriesToSave);
      if (res) {
        setSavingState('saved');
        setTimeout(() => setSavingState('idle'), 3005);
      } else {
        setSavingState('error');
      }
    } catch (err) {
      console.error(err);
      setSavingState('error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
            Record Daily Milk
          </h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Logs are only filled up to today's date automatically. The previous day's quantity carries forward.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {savingState === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-sky-500 font-semibold">
              <RefreshCw size={14} className="animate-spin" /> Saving...
            </span>
          )}
          {savingState === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-sky-655 font-bold">
              <CheckCircle size={14} className="text-sky-500" /> Saved Changes
            </span>
          )}
          {savingState === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
              <AlertCircle size={14} /> Save Failed
            </span>
          )}
          
          <button
            onClick={handleSaveGrid}
            disabled={savingState === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-md hover:shadow-sky-500/10 active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
          >
            <Save size={14} />
            <span>Save Register</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 shadow-2xs">
          <Calendar size={16} className="text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none cursor-pointer"
          >
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none cursor-pointer border-l border-slate-200 dark:border-slate-855 pl-2"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search customer by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs text-xs"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={14} />
          </div>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-850 text-xs">
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900/100 border-r border-slate-200 dark:border-slate-850 p-3 text-left font-bold min-w-[130px] shadow-sm">
                  Customer
                </th>
                {monthDays.map((dayDate, idx) => (
                  <th key={dayDate} className="p-2.5 border-r border-slate-200 dark:border-slate-850 font-mono text-center min-w-[48px]">
                    {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-700 dark:text-slate-350">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={daysCount + 1} className="py-12 text-center text-slate-450 font-medium">
                    No customers found. Please add a customer first.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                    {/* Customer Code & Name column */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-850 p-3 font-semibold shadow-sm min-w-[130px] flex flex-col justify-center">
                      <span className="font-bold text-slate-850 dark:text-white truncate">
                        {customer.name}
                      </span>
                      <span className="text-3xs font-mono text-slate-400 mt-0.5 font-bold">
                        {customer.customer_code}
                      </span>
                    </td>

                    {/* Day Input cells */}
                    {monthDays.map(dayDate => {
                      const isFuture = isFutureDate(dayDate);
                      const displayVal = getDisplayValue(customer.id, dayDate, customer.default_quantity);
                      const isDay1 = dayDate.endsWith('-01');
                      const hasOverride = gridValues[`${customer.id}:${dayDate}`] !== undefined;

                      return (
                        <td 
                          key={dayDate} 
                          className={`p-1 border-r border-slate-150 dark:border-slate-850 text-center min-w-[48px] ${
                            isFuture 
                              ? 'bg-slate-50/50 dark:bg-slate-900/10'
                              : isDay1 
                                ? 'bg-sky-50 dark:bg-sky-950/20' 
                                : hasOverride 
                                  ? 'bg-blue-50 dark:bg-blue-950/20 font-bold' 
                                  : ''
                          }`}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            value={displayVal}
                            disabled={isFuture}
                            onChange={(e) => handleCellChange(customer.id, dayDate, e.target.value)}
                            placeholder={isFuture ? '-' : '0'}
                            className={`w-full text-center py-1.5 px-0.5 bg-transparent border-0 focus:outline-none focus:bg-sky-100 dark:focus:bg-sky-900 rounded-lg text-slate-850 dark:text-white font-mono font-semibold ${
                              isFuture ? 'opacity-30 cursor-not-allowed text-slate-400' : ''
                            }`}
                            title={isFuture ? 'Future date locked' : isDay1 ? 'Day 1 Base Value' : 'Override quantity'}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Legend */}
      <div className="flex flex-wrap gap-4 text-3xs font-semibold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-sky-100 border border-sky-200" />
          <span>Base / Propagated Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-50 border border-blue-200" />
          <span>Manual Override</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200" />
          <span>Locked Future Dates</span>
        </div>
      </div>

    </div>
  );
};
