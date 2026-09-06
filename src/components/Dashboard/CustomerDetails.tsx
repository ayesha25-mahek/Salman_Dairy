import React, { useState } from 'react';
import { Customer, MilkEntry, Payment } from '../../utils/seedData';
import { useDb } from '../../context/DbContext';
import { calculateCustomerBilling, calculateCustomerUnpaidPeriod, getCustomerDailyDeliveries, formatCurrency } from '../../utils/calculations';
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
  Save,
  History
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
  const billing = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth, todayStr);

  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';

  // Compute unpaid bill period and amount
  const unpaidInfo = React.useMemo(() => {
    return calculateCustomerUnpaidPeriod(customer, milkEntries, payments, todayStr);
  }, [customer, milkEntries, payments, todayStr]);

  // WhatsApp template for entire bill
  const getWhatsAppMessage = () => {
    const msg = `*Salman Khan's Dairy — Account Statement*\n` +
      `Customer: *${customer.name}*\n` +
      `• Code: *${customer.customer_code}*\n` +
      `• Total Milk Delivered: *${billing.totalMilkConsumed.toFixed(1)} Litres*\n` +
      `• Milk Paid For: *${billing.paidMilkLitres.toFixed(1)} Litres* (${formatCurrency(billing.totalPaid)})\n` +
      `• Rate: *Rs. ${customer.rate_per_liter}/L*\n` +
      `-----------------------------\n` +
      `*Total Due Milk: ${billing.dueMilkLitres.toFixed(1)} Litres*\n` +
      `*Total Balance Due: ${formatCurrency(billing.pendingAmount)}*\n\n` +
      `Kindly clear your outstanding balance. Thank you!\n\n` +
      `— *Salman Khan*`;
    return encodeURIComponent(msg);
  };

  // Short WhatsApp bill message for unpaid period
  const getWhatsAppUnpaidMessage = () => {
    const msg =
      `*Salman Khan's Dairy — Unpaid Bill*\n` +
      `Customer: *${customer.name}*\n\n` +
      `📅 Period: ${unpaidInfo.unpaidStartDate} → ${todayStr}\n` +
      `🧴 Due Milk: *${billing.dueMilkLitres.toFixed(1)} L* @ Rs.${customer.rate_per_liter}/L\n` +
      `💰 Due Amount: *${formatCurrency(billing.pendingAmount)}*\n\n` +
      `Kindly clear your dues. Shukriya!\n\n` +
      `— *Salman Khan*`;
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
      const deliveries = getCustomerDailyDeliveries(customer, milkEntries, todayStr);
      const customerPayments = payments.filter(p => p.customer_id === customer.id);
      const totalPaidBefore = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const newTotalPaid = totalPaidBefore + Number(amount);

      let coveredPaid = newTotalPaid;
      let computedPaidTill = customer.created_at ? customer.created_at.split('T')[0] : todayStr;

      for (const delivery of deliveries) {
        if (delivery.cost === 0) continue;
        if (coveredPaid >= delivery.cost) {
          coveredPaid -= delivery.cost;
          computedPaidTill = delivery.date;
        } else {
          break;
        }
      }

      if (deliveries.length > 0 && coveredPaid >= 0) {
        const totalDeliveryCost = deliveries.reduce((s, d) => s + d.cost, 0);
        if (newTotalPaid >= totalDeliveryCost) {
          const lastDeliveryDate = deliveries[deliveries.length - 1].date;
          computedPaidTill = lastDeliveryDate > todayStr ? lastDeliveryDate : todayStr;
        }
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
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Paid
              </span>
            )}
            {billing.hasOverdue && (
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 border border-red-500/20">
                Overdue (Last Month Pending)
              </span>
            )}
            {!billing.hasOverdue && billing.status === 'Partially Paid' && (
              <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                Partially Paid
              </span>
            )}
            {!billing.hasOverdue && billing.status === 'Pending' && (
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Current Month Dues
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {customer.address || 'No address specified'}
        </p>
      </div>

      {/* ── Last Month Overdue Red Section ── */}
      {billing.hasOverdue && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wide">
                Last Month Amount Pending: {formatCurrency(billing.previousMonthPending)}
              </span>
              <span className="block text-3xs text-red-500/80 mt-0.5">
                Unpaid balance from {billing.previousMonthName} / past months. Recording payment for this amount will clear this red overdue alert.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setAmount(billing.previousMonthPending.toString());
              setShowPaymentModal(true);
            }}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-2xs uppercase tracking-wider shadow-xs transition"
          >
            Clear Last Month Dues
          </button>
        </div>
      )}

      {/* 4 Clean Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Daily Delivery & Rate */}
        <div className="p-4.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
          <div>
            <span className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Daily Delivery & Rate
            </span>
            <span className="block text-base font-black text-slate-850 dark:text-white">
              {customer.default_quantity} Litre(s)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-3xs">
            <span className="text-slate-400 font-semibold">Rate per Litre:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">Rs. {customer.rate_per_liter}</span>
          </div>
        </div>

        {/* Box 2: This Month (Milk 1st to date & price) */}
        <div className="p-4.5 rounded-2xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100/60 dark:border-sky-900/40 flex flex-col justify-between">
          <div>
            <span className="block text-3xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              This Month ({currentMonthName})
            </span>
            <span className="block text-base font-black text-slate-850 dark:text-white">
              {billing.monthlyConsumption.toFixed(1)} Litres
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-sky-100 dark:border-sky-900/30 flex items-center justify-between text-3xs">
            <span className="text-slate-400 font-semibold">Total Month Bill:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{formatCurrency(billing.monthlyBill)}</span>
          </div>
        </div>

        {/* Box 3: Last Month's Pending (Dynamic previous month name) */}
        <div className={`p-4.5 rounded-2xl flex flex-col justify-between ${
          billing.hasOverdue 
            ? 'bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40' 
            : 'bg-slate-50/70 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850'
        }`}>
          <div>
            <span className={`block text-3xs font-bold uppercase tracking-wider mb-1 ${
              billing.hasOverdue ? 'text-red-500 font-bold' : 'text-slate-400'
            }`}>
              Last Month's Pending ({billing.previousMonthName})
            </span>
            <span className={`block text-base font-black ${
              billing.hasOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'
            }`}>
              {formatCurrency(billing.previousMonthPending)}
            </span>
          </div>
          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-3xs ${
            billing.hasOverdue ? 'border-red-100 dark:border-red-900/30' : 'border-slate-200/60 dark:border-slate-800'
          }`}>
            <span className="text-slate-400 font-semibold">Unpaid Litres:</span>
            <span className={`font-bold ${billing.hasOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
              {customer.rate_per_liter > 0 ? (billing.previousMonthPending / customer.rate_per_liter).toFixed(1) : '0.0'} L
            </span>
          </div>
        </div>

        {/* Box 4: Total Balance Due */}
        <div className="p-4.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 flex flex-col justify-between">
          <div>
            <span className="block text-3xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              Total Balance Due
            </span>
            <span className={`block text-base font-black ${billing.pendingAmount > 0 ? (billing.hasOverdue ? 'text-red-500' : 'text-sky-600') : 'text-emerald-600'}`}>
              {formatCurrency(billing.pendingAmount)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-sky-500/15 flex items-center justify-between text-3xs">
            <span className="text-slate-400 font-semibold">Total Due Milk:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{billing.dueMilkLitres.toFixed(1)} L</span>
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

      {/* ACTION BUTTONS (AT VERY BOTTOM) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex flex-col sm:flex-row gap-3">
        {/* See Payment History Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wide transition focus:outline-none border border-sky-200 dark:border-sky-800 shadow-xs"
        >
          <History size={15} />
          <span>See Payment History ({customerPayments.length})</span>
        </button>

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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest">
                      Amount Received (Rs) *
                    </label>
                    {billing.hasOverdue && (
                      <span className="text-3xs font-bold text-red-500">
                        Last Month Due: {formatCurrency(billing.previousMonthPending)}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs font-bold"
                  />
                  {(billing.hasOverdue || billing.pendingAmount > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {billing.hasOverdue && (
                        <button
                          type="button"
                          onClick={() => setAmount(billing.previousMonthPending.toString())}
                          className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 text-3xs font-bold hover:bg-red-100 transition"
                        >
                          Fill Last Month: {formatCurrency(billing.previousMonthPending)}
                        </button>
                      )}
                      {billing.pendingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(billing.pendingAmount.toString())}
                          className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-200 text-3xs font-bold hover:bg-sky-100 transition"
                        >
                          Fill Total: {formatCurrency(billing.pendingAmount)}
                        </button>
                      )}
                    </div>
                  )}
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

      {/* ════════════════════════════════════════ */}
      {/* Payment History Modal                    */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-955 p-6 shadow-2xl border border-slate-200 dark:border-slate-850 z-10 text-left max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 p-1 rounded-lg"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-850">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                  <History size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-base font-display leading-tight">
                    Payment History
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {customer.name}
                    </span>
                    <span className="text-3xs font-mono font-bold text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">
                      {customer.customer_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850">
                  <span className="block text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Received</span>
                  <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(billing.totalPaid)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850">
                  <span className="block text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
                  <span className="block text-sm font-black text-slate-800 dark:text-white mt-0.5">
                    {customerPayments.length} Payment(s)
                  </span>
                </div>
              </div>

              {/* Payments List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
                {customerPayments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No payment records found for this customer.
                  </div>
                ) : (
                  customerPayments.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          #{customerPayments.length - idx}
                        </div>
                        <div>
                          <span className="block font-black text-slate-850 dark:text-white text-xs">
                            {formatCurrency(p.amount)}
                          </span>
                          <span className="block text-3xs text-slate-400 mt-0.5 font-medium">
                            Paid on: <strong className="text-slate-600 dark:text-slate-300">{new Date(p.payment_date).toLocaleDateString()}</strong> • Covered till: {new Date(p.paid_till_date).toLocaleDateString()}
                          </span>
                          {p.notes && (
                            <span className="block text-3xs text-sky-600 dark:text-sky-400 mt-0.5 italic">
                              Note: {p.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete payment of ${formatCurrency(p.amount)} from ${new Date(p.payment_date).toLocaleDateString()}?`)) {
                            await deletePayment(p.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition focus:outline-none shrink-0"
                        title="Delete this payment record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wide transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
