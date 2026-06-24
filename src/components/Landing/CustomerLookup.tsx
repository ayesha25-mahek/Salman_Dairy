import React, { useState } from 'react';
import { Search, User, Calendar, CreditCard, ShieldAlert, Award } from 'lucide-react';
import { useDb } from '../../context/DbContext';
import { calculateCustomerBilling, formatCurrency } from '../../utils/calculations';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerLookup: React.FC = () => {
  const [code, setCode] = useState('');
  const [searchedCustomer, setSearchedCustomer] = useState<any>(null);
  const [billingDetails, setBillingDetails] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  
  const { customers, milkEntries, payments } = useDb();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSearched(true);
    const cleanedCode = code.trim().toUpperCase();
    const customer = customers.find(c => c.customer_code.toUpperCase() === cleanedCode);

    if (customer) {
      // Calculate current date year/month
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // Month index starts at 0

      const billing = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth);
      
      setSearchedCustomer(customer);
      setBillingDetails(billing);
    } else {
      setSearchedCustomer(null);
      setBillingDetails(null);
    }
  };

  return (
    <section id="customer-lookup" className="w-full py-16 px-4 bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-xl mx-auto text-center mb-10">
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white mb-2">
          Check Your Dairy Record
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          Enter your unique Customer Code below to view your milk delivery details and balance.
        </p>
      </div>

      <div className="max-w-xl mx-auto text-left">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2.5 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter Customer Code (e.g. SD001)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all text-sm uppercase"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-md hover:shadow-sky-500/10 active:scale-98 transition-all whitespace-nowrap text-sm focus:outline-none uppercase tracking-wider"
          >
            View My Record
          </button>
        </form>

        {/* Results Container */}
        <AnimatePresence mode="wait">
          {searched && searchedCustomer && billingDetails && (
            <motion.div
              key="results-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="overflow-hidden rounded-3xl bg-white dark:bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-850 p-6 space-y-6"
            >
              {/* Header: Name and Status Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                      {searchedCustomer.name}
                    </h3>
                    <p className="text-xs text-slate-450 font-mono mt-0.5">
                      Code: {searchedCustomer.customer_code}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {billingDetails.status === 'Paid' && (
                    <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-550 border border-sky-500/20">
                      Paid
                    </span>
                  )}
                  {billingDetails.status === 'Partially Paid' && (
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500 border border-orange-500/20">
                      Partially Paid
                    </span>
                  )}
                  {billingDetails.status === 'Pending' && (
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 border border-red-500/20">
                      Pending Payment
                    </span>
                  )}
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-2 gap-4">
                {/* ID & Phone */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {searchedCustomer.phone || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Daily Milk Quantity
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {searchedCustomer.default_quantity} Litre(s)
                  </span>
                </div>

                {/* Consumption Stats */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Milk Consumed
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />
                    {billingDetails.totalMilkConsumed.toFixed(1)} Litres
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Amount
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <CreditCard size={14} className="text-slate-400" />
                    {formatCurrency(billingDetails.totalBilled)}
                  </span>
                </div>

                {/* Payments */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Paid Amount
                  </span>
                  <span className="text-sm font-bold text-sky-600">
                    {formatCurrency(billingDetails.totalPaid)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pending Amount
                  </span>
                  <span className={`text-sm font-black ${billingDetails.pendingAmount > 0 ? 'text-red-500' : 'text-sky-600'}`}>
                    {formatCurrency(billingDetails.pendingAmount)}
                  </span>
                </div>
              </div>

              {/* Last Payment Date Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Award size={14} />
                  <span>Last Payment Date:</span>
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {billingDetails.lastPaymentDate
                    ? new Date(billingDetails.lastPaymentDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'No payment recorded'}
                </span>
              </div>
            </motion.div>
          )}

          {searched && !searchedCustomer && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex items-start gap-3.5 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm shadow-sm"
            >
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-650 dark:text-red-400 mb-1">Customer Code Not Found</h4>
                <p className="text-red-500/90 leading-normal text-xs font-semibold">
                  We could not find any records for code <strong className="font-mono uppercase">"{code}"</strong>. Please verify the code or contact Salman Dairy management to verify your registration.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
