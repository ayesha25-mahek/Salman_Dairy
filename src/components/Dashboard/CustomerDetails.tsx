import React, { useState } from 'react';
import { Customer } from '../../utils/seedData';
import { useDb } from '../../context/DbContext';
import { calculateCustomerBilling, formatCurrency } from '../../utils/calculations';
import { printReceipt, exportRegisterToCSV } from '../../services/pdfGenerator';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Download, 
  PlusCircle, 
  X, 
  Trash2, 
  Check, 
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, onBack }) => {
  const { milkEntries, payments, addPayment, deletePayment, deleteCustomer } = useDb();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment Form State
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-06-24');
  const [paidTillDate, setPaidTillDate] = useState('2026-06-24');
  const [notes, setNotes] = useState('');
  const [modalStatus, setModalStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Compute billing summary for June 2026 (current active month)
  const billing = calculateCustomerBilling(customer, milkEntries, payments, 2026, 6);

  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';

  // WhatsApp template generator
  const getWhatsAppMessage = () => {
    const monthName = 'June 2026';
    const msg = `Assalam-o-Alaikum ${customer.name},\n\nThis is your monthly bill from *Salman Dairy*:\n` +
      `• Code: *${customer.customer_code}*\n` +
      `• Total Milk: *${billing.monthlyConsumption.toFixed(1)} Litres*\n` +
      `• Rate: *Rs. ${customer.rate_per_liter}/L*\n` +
      `• Current Bill: *${formatCurrency(billing.monthlyBill)}*\n` +
      `-----------------------------\n` +
      `*Total Balance Due: ${formatCurrency(billing.pendingAmount)}*\n\n` +
      `Kindly clear your outstanding balance. Thank you!`;
    return encodeURIComponent(msg);
  };

  const handleMarkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setModalStatus('saving');
    try {
      const res = await addPayment({
        customer_id: customer.id,
        amount: Number(amount),
        payment_date: paymentDate,
        paid_till_date: paidTillDate,
        notes: notes.trim()
      });

      if (res) {
        setModalStatus('success');
        setAmount('');
        setNotes('');
        setTimeout(() => {
          setModalStatus('idle');
          setShowPaymentModal(false);
        }, 1500);
      } else {
        setModalStatus('error');
      }
    } catch (err) {
      console.error(err);
      setModalStatus('error');
    }
  };

  const handleDropCustomer = async () => {
    const confirmDrop = window.confirm(
      `Are you sure you want to drop ${customer.name}? This customer will not take milk anymore, and all their data will be deleted.`
    );
    if (confirmDrop) {
      await deleteCustomer(customer.id);
      onBack();
    }
  };

  const customerPayments = payments
    .filter(p => p.customer_id === customer.id)
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  // Format creation date for "taking milk from"
  const formattedStartDate = new Date(customer.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6 text-left">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 font-semibold text-xs focus:outline-none"
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        <div className="flex gap-2">
          {/* Export CSV button */}
          <button
            onClick={() => exportRegisterToCSV([customer], milkEntries, 2026, 6)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
            title="Export Excel Ledger"
          >
            <Download size={16} />
          </button>
          
          {/* Mark Payment Action */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-md hover:shadow-sky-500/10 transition-all text-xs uppercase tracking-wide focus:outline-none"
          >
            <PlusCircle size={14} />
            <span>Mark Payment</span>
          </button>
        </div>
      </div>

      {/* Customer details card header */}
      <div className="space-y-3 bg-sky-50/30 dark:bg-sky-950/10 p-5 rounded-2xl border border-sky-100/50 dark:border-sky-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xl font-black font-display text-slate-850 dark:text-white leading-tight">
              {customer.name}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-2xs font-bold font-mono uppercase tracking-wider">
                Code: {customer.customer_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-2xs font-semibold">
                <CalendarDays size={12} className="text-sky-500" />
                From: {formattedStartDate}
              </span>
            </div>
          </div>
          
          {/* Status badge */}
          <div className="self-start sm:self-center">
            {billing.status === 'Paid' && (
              <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-500 border border-sky-500/20">
                Paid
              </span>
            )}
            {billing.status === 'Partially Paid' && (
              <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500 border border-orange-500/20">
                Partially Paid
              </span>
            )}
            {billing.status === 'Pending' && (
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 border border-red-500/20">
                Pending Dues
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {customer.address || 'No address specified'}
        </p>
      </div>

      {/* Grid: Details Ledger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">Rate / Litre</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">Rs. {customer.rate_per_liter}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">Daily Delivery</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{customer.default_quantity} Litre(s)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">June Litres</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{billing.monthlyConsumption.toFixed(1)} L</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">June Bill</span>
          <span className="text-sm font-extrabold text-slate-850 dark:text-white">{formatCurrency(billing.monthlyBill)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">Total Bill</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{formatCurrency(billing.totalBilled)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">Total Paid</span>
          <span className="text-sm font-extrabold text-sky-600">{formatCurrency(billing.totalPaid)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 col-span-2">
          <span className="block text-3xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1 font-bold">Outstanding Balance</span>
          <span className={`text-base font-black ${billing.pendingAmount > 0 ? 'text-red-500' : 'text-sky-600'}`}>
            {formatCurrency(billing.pendingAmount)}
          </span>
        </div>
      </div>

      {/* Interactive Communication Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={cleanPhone ? `tel:${cleanPhone}` : undefined}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition focus:outline-none ${
            !cleanPhone ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <Phone size={14} className="text-sky-500" />
          <span>Call Customer</span>
        </a>

        <a
          href={cleanPhone ? `https://wa.me/${cleanPhone}?text=${getWhatsAppMessage()}` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold uppercase transition focus:outline-none"
        >
          <MessageSquare size={14} />
          <span>WhatsApp Bill</span>
        </a>
      </div>

      {/* Secondary control button */}
      <button
        onClick={() => printReceipt(customer, milkEntries, payments, 2026, 6)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition focus:outline-none"
      >
        <PlusCircle size={14} className="text-sky-500" />
        <span>Print PDF Invoice</span>
      </button>

      {/* Payment History Log */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm font-display">
          Payment Ledger Logs
        </h4>
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
          {customerPayments.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-semibold">
              No payments recorded for this account yet.
            </div>
          ) : (
            customerPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-250 text-xs">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="block text-3xs text-slate-450 mt-0.5 font-semibold">
                      Date: {new Date(p.payment_date).toLocaleDateString()} • Covered till: {new Date(p.paid_till_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-3xs text-slate-400 italic max-w-[120px] truncate hidden sm:block font-medium">
                    {p.notes || 'No description'}
                  </span>
                  <button
                    onClick={async () => {
                      if (window.confirm('Delete payment record? This will adjust outstanding balances.')) {
                        await deletePayment(p.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition focus:outline-none"
                    title="Remove Payment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DROP CUSTOMER ACTION BUTTON (AT VERY BOTTOM) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
        <button
          onClick={handleDropCustomer}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase transition focus:outline-none border border-red-200"
        >
          <Trash2 size={14} />
          <span>Drop Customer (Stop Deliveries)</span>
        </button>
      </div>

      {/* Mark Payment Modal Dialog */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-slate-950 p-5 shadow-2xl border border-slate-200 dark:border-slate-850 z-10 text-left"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
              >
                <X size={18} />
              </button>

              <h4 className="font-bold text-slate-800 dark:text-white text-base font-display mb-4">
                Record Payment
              </h4>

              <form onSubmit={handleMarkPayment} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Amount Received (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Date */}
                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-2xs"
                    />
                  </div>

                  {/* Covered Date */}
                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Paid Till Date
                    </label>
                    <input
                      type="date"
                      value={paidTillDate}
                      onChange={(e) => setPaidTillDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-2xs"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Receipt Notes / Mode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received via EasyPaisa"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>

                {modalStatus === 'success' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                    <Check size={16} />
                    <span>Payment recorded successfully!</span>
                  </div>
                )}

                {modalStatus === 'error' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                    <AlertCircle size={16} />
                    <span>Failed to save. Try again.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={modalStatus === 'saving'}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:shadow-sky-500/10 active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
                >
                  {modalStatus === 'saving' ? 'Recording...' : 'Record Payment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
