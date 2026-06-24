import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { UserPlus, Hash, DollarSign, Milk, CheckCircle, AlertCircle } from 'lucide-react';

export const AddCustomer: React.FC = () => {
  const { addCustomer, customers } = useDb();
  
  // Form State
  const [name, setName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('90');
  const [defaultQuantity, setDefaultQuantity] = useState('1.5');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'code_taken'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Check if custom code is already taken
    const finalCode = customCode.trim().toUpperCase();
    if (finalCode && customers.some(c => c.customer_code.toUpperCase() === finalCode)) {
      setFormStatus('code_taken');
      return;
    }

    setFormStatus('submitting');
    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        rate_per_liter: Number(ratePerLiter),
        default_quantity: Number(defaultQuantity),
        delivery_notes: deliveryNotes.trim(),
        _custom_code: finalCode || null
      };

      const res = await addCustomer(customerData as any, finalCode || undefined);

      if (res) {
        setFormStatus('success');
        setName('');
        setCustomCode('');
        setPhone('');
        setAddress('');
        setRatePerLiter('90');
        setDefaultQuantity('1.5');
        setDeliveryNotes('');
        
        setTimeout(() => {
          setFormStatus('idle');
        }, 3000);
      } else {
        setFormStatus('error');
      }
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
          Register New Customer
        </h2>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Add a new customer with a custom code. They can view their bills and deliveries using this code.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ⭐ CUSTOM CODE */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/60">
            <label className="block text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash size={14} />
              Customer Code (Must be Unique) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AHMED01, SD005..."
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value.toUpperCase());
                setFormStatus('idle');
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold text-sm uppercase tracking-widest"
            />
            <p className="text-3xs text-sky-650 dark:text-sky-455 mt-1.5 font-medium">
              This code will be entered by the customer on the home screen to check their billing logs.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Delivery Address
            </label>
            <input
              type="text"
              placeholder="e.g. House 12, Farooqnagar, Shadnagar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Rate & Qty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Rate per Litre (Rs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={ratePerLiter}
                  onChange={(e) => setRatePerLiter(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <DollarSign size={14} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Daily Quantity (L)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={defaultQuantity}
                  onChange={(e) => setDefaultQuantity(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Milk size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Delivery Notes / Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deliver before 7am, leave at doorstep"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs resize-none"
            />
          </div>

          {formStatus === 'code_taken' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold">
              <AlertCircle size={16} />
              <span>Code "{customCode}" is already taken! Please choose another code.</span>
            </div>
          )}

          {formStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
              <CheckCircle size={16} />
              <span>Customer added successfully! Code: {customCode}</span>
            </div>
          )}

          {formStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              <AlertCircle size={16} />
              <span>Failed to register customer. Try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={formStatus === 'submitting'}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md hover:shadow-sky-500/10 active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
          >
            {formStatus === 'submitting' ? 'Registering...' : 'Register Customer'}
          </button>
        </form>
      </div>
    </div>
  );
};
