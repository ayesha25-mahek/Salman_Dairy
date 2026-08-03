import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Search, ChevronRight, UserPlus } from 'lucide-react';
import { CustomerDetails } from './CustomerDetails';

interface CustomerManagementProps {
  setActiveTab?: (tab: any) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ setActiveTab }) => {
  const { customers } = useDb();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Extract trailing number from code like "xxxx01" → 1
  const getCodeNumber = (code: string): number => {
    const match = code.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const filteredCustomers = customers
    .filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => getCodeNumber(a.customer_code) - getCodeNumber(b.customer_code));

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="text-left">
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
          My Customers
        </h2>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Click any customer below to view their billing details, outstanding balances, start date, and communication options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Customer List Column */}
        <div className={`lg:col-span-1 space-y-4 ${selectedCustomerId ? 'hidden lg:block' : 'block'}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs text-xs"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </div>
            </div>
            
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('add_customer')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm active:scale-98 transition-all text-xs uppercase tracking-wide"
                title="Register New Customer"
              >
                <UserPlus size={14} />
                <span>Add</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-900 max-h-[500px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No customer records.
              </div>
            ) : (
              filteredCustomers.map(customer => {
                const isSelected = selectedCustomerId === customer.id;
                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors focus:outline-none ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/20 border-l-4 border-sky-500 pl-3'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected 
                          ? 'bg-sky-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400'
                      }`}>
                        {customer.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <span className="block font-bold text-slate-850 dark:text-white truncate">
                          {customer.name}
                        </span>
                        <span className="block text-3xs font-mono text-sky-500 mt-0.5 font-bold">
                          Code: {customer.customer_code}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Customer Details Column */}
        <div className={`lg:col-span-2 ${selectedCustomerId ? 'block' : 'hidden lg:block bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold'}`}>
          {selectedCustomer ? (
            <CustomerDetails 
              customer={selectedCustomer} 
              onBack={() => setSelectedCustomerId(null)} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-72">
              <Search size={48} className="text-sky-300 dark:text-slate-700 mb-3" />
              <span>Select a customer from the left list to view their full ledger and payment details.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
