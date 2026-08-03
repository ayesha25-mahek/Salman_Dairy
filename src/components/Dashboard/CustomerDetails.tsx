import React, { useState } from 'react';
import { Customer, MilkEntry, Payment } from '../../utils/seedData';
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
  CalendarDays,
  RotateCcw,
  Edit2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, onBack }) => {
  const { 
    milkEntries, 
    payments, 
    addPayment, 
    deletePayment, 
    deleteCustomer, 
    deactivateCustomer, 
    reactivateCustomer,
    updateCustomer
  } = useDb();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── Add Phone Modal (for call/whatsapp when phone is missing) ──
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'call' | 'whatsapp_bill' | 'whatsapp_unpaid' | null>(null);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [addPhoneStatus, setAddPhoneStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // ── Edit Customer Modal ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Payment Form State
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [modalStatus, setModalStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Get today's local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // Compute billing summary for current month
  const billing = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth);

  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';

  // Helper to add 1 day to date string (YYYY-MM-DD)
  const getNextDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute unpaid bill period and amount
  const unpaidInfo = React.useMemo(() => {
    const customerPayments = payments.filter(p => p.customer_id === customer.id);
    let unpaidStartDate = customer.created_at ? customer.created_at.split('T')[0] : todayStr;
    
    if (customerPayments.length > 0) {
      // Find latest paid_till_date
      const sortedByPaidTill = [...customerPayments].sort((a, b) => b.paid_till_date.localeCompare(a.paid_till_date));
      const lastPaidTill = sortedByPaidTill[0].paid_till_date;
      unpaidStartDate = getNextDay(lastPaidTill);
    }

    // Filter milk entries from unpaidStartDate up to today
    const unpaidEntries = milkEntries.filter(
      e => e.customer_id === customer.id && e.date >= unpaidStartDate && e.date <= todayStr
    );
    const unpaidLiters = unpaidEntries.reduce((sum, e) => sum + Number(e.quantity), 0);
    const unpaidCost = unpaidLiters * customer.rate_per_liter;

    return {
      unpaidStartDate,
      unpaidLiters,
      unpaidCost
    };
  }, [customer, milkEntries, payments]);

  // WhatsApp template for entire month bill
  const getWhatsAppMessage = () => {
    const msg = `*Salman Dairy — Monthly Bill*\n` +
      `Customer: *${customer.name}*\n` +
      `• Code: *${customer.customer_code}*\n` +
      `• Total Milk: *${billing.monthlyConsumption.toFixed(1)} Litres*\n` +
      `• Rate: *Rs. ${customer.rate_per_liter}/L*\n` +
      `• Current Bill: *${formatCurrency(billing.monthlyBill)}*\n` +
      `-----------------------------\n` +
      `*Total Balance Due: ${formatCurrency(billing.pendingAmount)}*\n\n` +
      `Kindly clear your outstanding balance. Thank you!`;
    return encodeURIComponent(msg);
  };

  // Short WhatsApp bill message for unpaid period
  const getWhatsAppUnpaidMessage = () => {
    const msg =
      `*Salman Dairy — Unpaid Bill*\n` +
      `Customer: *${customer.name}*\n\n` +
      `📅 Period: ${unpaidInfo.unpaidStartDate} → ${todayStr}\n` +
      `🧴 Milk: *${unpaidInfo.unpaidLiters.toFixed(1)} L* @ Rs.${customer.rate_per_liter}/L\n` +
      `💰 Due Amount: *${formatCurrency(billing.pendingAmount)}*\n\n` +
      `Kindly clear your dues. Shukriya!`;
    return encodeURIComponent(msg);
  };

  // ── Handle actions that need a phone number ──
  const handleActionRequiringPhone = (action: 'call' | 'whatsapp_bill' | 'whatsapp_unpaid') => {
    if (cleanPhone) {
      // Phone exists — act immediately
      executePhoneAction(action, cleanPhone);
    } else {
      // No phone — prompt to add
      setPendingAction(action);
      setNewPhoneInput('');
      setAddPhoneStatus('idle');
      setShowAddPhoneModal(true);
    }
  };

  const executePhoneAction = (action: 'call' | 'whatsapp_bill' | 'whatsapp_unpaid', phone: string) => {
    if (action === 'call') {
      window.location.href = `tel:${phone}`;
    } else if (action === 'whatsapp_bill') {
      window.open(`https://wa.me/${phone}?text=${getWhatsAppMessage()}`, '_blank');
    } else if (action === 'whatsapp_unpaid') {
      window.open(`https://wa.me/${phone}?text=${getWhatsAppUnpaidMessage()}`, '_blank');
    }
  };

  const handleSaveAndCall = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = newPhoneInput.trim();
    if (!trimmedPhone) return;

    setAddPhoneStatus('saving');
    try {
      const updated = { ...customer, phone: trimmedPhone };
      const res = await updateCustomer(updated);
      if (res) {
        setAddPhoneStatus('success');
        const cleanNew = trimmedPhone.replace(/[^0-9]/g, '');
        setTimeout(() => {
          setShowAddPhoneModal(false);
          setAddPhoneStatus('idle');
          if (pendingAction) {
            executePhoneAction(pendingAction, cleanNew);
          }
          setPendingAction(null);
        }, 1000);
      } else {
        setAddPhoneStatus('error');
      }
    } catch (err) {
      console.error(err);
      setAddPhoneStatus('error');
    }
  };

  // ── Edit Customer ──
  const openEditModal = () => {
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditAddress(customer.address || '');
    setEditRate(String(customer.rate_per_liter));
    setEditQuantity(String(customer.default_quantity));
    setEditDeliveryNotes(customer.delivery_notes || '');
    setEditStatus('idle');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setEditStatus('saving');
    try {
      const updated: Customer = {
        ...customer,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        rate_per_liter: Number(editRate),
        default_quantity: Number(editQuantity),
        delivery_notes: editDeliveryNotes.trim()
      };
      const res = await updateCustomer(updated);
      if (res) {
        setEditStatus('success');
        setTimeout(() => {
          setEditStatus('idle');
          setShowEditModal(false);
        }, 1500);
      } else {
        setEditStatus('error');
      }
    } catch (err) {
      console.error(err);
      setEditStatus('error');
    }
  };

  const handleMarkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setModalStatus('saving');
    try {
      // Calculate paid_till_date automatically based on chronological deliveries
      const customerEntries = milkEntries
        .filter(e => e.customer_id === customer.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const customerPayments = payments.filter(p => p.customer_id === customer.id);
      const totalPaidBefore = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const newTotalPaid = totalPaidBefore + Number(amount);

      let computedPaidTill = customer.created_at ? customer.created_at.split('T')[0] : todayStr;
      let cumulativeBill = 0;

      for (const entry of customerEntries) {
        const cost = Number(entry.quantity) * customer.rate_per_liter;
        if (cumulativeBill + cost <= newTotalPaid) {
          cumulativeBill += cost;
          computedPaidTill = entry.date;
        } else {
          break;
        }
      }

      if (newTotalPaid >= cumulativeBill && customerEntries.length > 0) {
        const lastEntryDate = customerEntries[customerEntries.length - 1].date;
        computedPaidTill = lastEntryDate > todayStr ? lastEntryDate : todayStr;
      }

      const res = await addPayment({
        customer_id: customer.id,
        amount: Number(amount),
        payment_date: todayStr, // Record as today's date
        paid_till_date: computedPaidTill, // Automatically computed cover date
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
      `Are you sure you want to stop milk deliveries for ${customer.name}? They will be removed from the daily register starting next month, but their billing history for this month will be saved.`
    );
    if (confirmDrop) {
      await deactivateCustomer(customer.id);
    }
  };

  const handleReactivateCustomer = async () => {
    const confirmReactivate = window.confirm(
      `Reactivate deliveries for ${customer.name}?`
    );
    if (confirmReactivate) {
      await reactivateCustomer(customer.id);
    }
  };

  const handlePermanentDelete = async () => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you absolutely sure you want to permanently delete ${customer.name} and ALL their historical billing and payment records? This cannot be undone.`
    );
    if (confirmDelete) {
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
      
      {/* Deactivation Banner */}
      {customer.deactivated_at && (
        <div className="flex items-center justify-between p-4.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold leading-normal">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-orange-500" />
            <span>Deliveries stopped since {new Date(customer.deactivated_at).toLocaleDateString()}.</span>
          </div>
          <button
            onClick={handleReactivateCustomer}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition text-2xs uppercase tracking-wide font-bold"
          >
            <RotateCcw size={12} />
            <span>Reactivate</span>
          </button>
        </div>
      )}

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
          {/* Edit Customer button */}
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-880 focus:outline-none text-xs font-bold uppercase tracking-wide transition"
            title="Edit Customer Details"
          >
            <Edit2 size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={() => exportRegisterToCSV([customer], milkEntries, currentYear, currentMonth)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-880 focus:outline-none"
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
              {/* Phone badge — shows "No phone" if missing */}
              {cleanPhone ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-2xs font-semibold">
                  <Phone size={11} />
                  {customer.phone}
                </span>
              ) : (
                <button
                  onClick={() => handleActionRequiringPhone('call')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-2xs font-semibold border border-orange-200 dark:border-orange-800 hover:bg-orange-200 transition"
                >
                  <Phone size={11} />
                  No phone — tap to add
                </button>
              )}
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
          <span className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1">Daily Delivery</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{customer.default_quantity} Litre(s)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1">{currentMonthName} Litres</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{billing.monthlyConsumption.toFixed(1)} L</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1">{currentMonthName} Bill</span>
          <span className="text-sm font-extrabold text-slate-850 dark:text-white">{formatCurrency(billing.monthlyBill)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1">Total Bill</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{formatCurrency(billing.totalBilled)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850">
          <span className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1">Total Paid</span>
          <span className="text-sm font-extrabold text-sky-600">{formatCurrency(billing.totalPaid)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 col-span-2">
          <span className="block text-3xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1 font-bold">Outstanding Balance</span>
          <span className={`text-base font-black ${billing.pendingAmount > 0 ? 'text-red-500' : 'text-sky-600'}`}>
            {formatCurrency(billing.pendingAmount)}
          </span>
        </div>
      </div>

      {/* Unpaid Bill Period Summary */}
      <div className="p-5 rounded-2xl bg-red-50/20 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 space-y-3">
        <h4 className="text-2xs font-bold text-red-650 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
          <CalendarDays size={14} />
          <span>Unpaid Period Ledger Summary</span>
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-3xs text-slate-400 uppercase font-semibold">Unpaid From Date</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{unpaidInfo.unpaidStartDate}</span>
          </div>
          <div>
            <span className="block text-3xs text-slate-400 uppercase font-semibold">Liters in Unpaid Period</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{unpaidInfo.unpaidLiters.toFixed(1)} L</span>
          </div>
          <div>
            <span className="block text-3xs text-slate-400 uppercase font-semibold">Period Milk Amount</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(unpaidInfo.unpaidCost)}</span>
          </div>
          <div>
            <span className="block text-3xs text-red-500 uppercase font-bold">Total Due Balance</span>
            <span className="font-black text-red-600 dark:text-red-400">{formatCurrency(billing.pendingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Interactive Communication Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Call */}
        <button
          onClick={() => handleActionRequiringPhone('call')}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition focus:outline-none"
        >
          <Phone size={14} className="text-sky-500" />
          <span>Call Customer</span>
        </button>

        {/* WhatsApp monthly bill */}
        <button
          onClick={() => handleActionRequiringPhone('whatsapp_bill')}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition focus:outline-none"
        >
          <MessageSquare size={14} className="text-sky-500" />
          <span>WhatsApp</span>
        </button>

        {/* WhatsApp unpaid bill */}
        <button
          onClick={() => handleActionRequiringPhone('whatsapp_unpaid')}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold uppercase transition focus:outline-none animate-pulse-subtle"
        >
          <MessageSquare size={14} />
          <span>Send Unpaid Bill</span>
        </button>
      </div>

      {/* Secondary control button */}
      <button
        onClick={() => printReceipt(customer, milkEntries, payments, currentYear, currentMonth)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-880 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition focus:outline-none"
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
      <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex flex-col sm:flex-row gap-3">
        {!customer.deactivated_at ? (
          <button
            onClick={handleDropCustomer}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold uppercase transition focus:outline-none border border-orange-200"
          >
            <Trash2 size={14} />
            <span>Drop Customer (Stop Deliveries)</span>
          </button>
        ) : (
          <button
            onClick={handlePermanentDelete}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold uppercase transition focus:outline-none border border-red-200 animate-pulse-subtle"
          >
            <Trash2 size={14} />
            <span>Permanently Delete Account & Dues</span>
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* Mark Payment Modal Dialog               */}
      {/* ════════════════════════════════════════ */}
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
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-slate-955 p-5 shadow-2xl border border-slate-200 dark:border-slate-850 z-10 text-left"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
              >
                <X size={18} />
              </button>

              <h4 className="font-bold text-slate-850 dark:text-white text-base font-display mb-4">
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

      {/* ════════════════════════════════════════ */}
      {/* Add Phone Number Modal                  */}
      {/* (shown when calling/messaging without   */}
      {/*  a saved phone number)                  */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddPhoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddPhoneModal(false); setPendingAction(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-slate-955 p-5 shadow-2xl border border-slate-200 dark:border-slate-850 z-10 text-left"
            >
              <button
                onClick={() => { setShowAddPhoneModal(false); setPendingAction(null); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
              >
                <X size={18} />
              </button>

              {/* Icon + heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-500">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-base font-display leading-tight">
                    Phone Number Missing
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Please add a phone number for <span className="font-bold text-slate-700 dark:text-slate-200">{customer.name}</span> to continue.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAndCall} className="space-y-4">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="e.g. 03001234567"
                    value={newPhoneInput}
                    onChange={(e) => { setNewPhoneInput(e.target.value); setAddPhoneStatus('idle'); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-400 font-mono text-sm font-bold"
                  />
                  <p className="text-3xs text-slate-400 mt-1.5">
                    This will be saved to the customer's profile.
                  </p>
                </div>

                {addPhoneStatus === 'success' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                    <Check size={16} />
                    <span>Phone saved! Proceeding…</span>
                  </div>
                )}

                {addPhoneStatus === 'error' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                    <AlertCircle size={16} />
                    <span>Failed to save. Try again.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addPhoneStatus === 'saving' || addPhoneStatus === 'success'}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
                >
                  {addPhoneStatus === 'saving' ? 'Saving…' : 'Save & Continue'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════ */}
      {/* Edit Customer Modal                     */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-955 p-6 shadow-2xl border border-slate-200 dark:border-slate-850 z-10 text-left max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
              >
                <X size={18} />
              </button>

              {/* Heading */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-500">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-base font-display leading-tight">
                    Edit Customer Details
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Code: <span className="font-mono font-bold text-sky-500">{customer.customer_code}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 03001234567"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. House 12, Shadnagar"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>

                {/* Rate & Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Rate / Litre (Rs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Daily Qty (L)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
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
                    value={editDeliveryNotes}
                    onChange={(e) => setEditDeliveryNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs resize-none"
                  />
                </div>

                {editStatus === 'success' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                    <Check size={16} />
                    <span>Customer updated successfully!</span>
                  </div>
                )}

                {editStatus === 'error' && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                    <AlertCircle size={16} />
                    <span>Failed to update. Please try again.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={editStatus === 'saving'}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:shadow-sky-500/10 active:scale-98 transition-all text-xs uppercase tracking-wide disabled:opacity-50"
                >
                  <Save size={14} />
                  {editStatus === 'saving' ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
