import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { Settings as SettingsType } from '../../utils/seedData';
import { Save, ShieldCheck, Phone, CheckCircle, AlertCircle, Database, Upload, HelpCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, refreshData, customers, updateCustomer } = useDb();

  const [ownerCode, setOwnerCode] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  
  // Dashboard Overrides
  const [overrideTodayLitres, setOverrideTodayLitres] = useState('');
  const [overrideMonthlyRevenue, setOverrideMonthlyRevenue] = useState('');
  const [overridePendingPayments, setOverridePendingPayments] = useState('');
  const [overrideCollectedPayments, setOverrideCollectedPayments] = useState('');

  // Bulk Price Change
  const [newPrice, setNewPrice] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, boolean>>({});
  const [priceChangeStatus, setPriceChangeStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings into form state
  useEffect(() => {
    if (settings) {
      setOwnerCode(settings.owner_code);
      setOwnerPhone(settings.owner_phone || '');
      setOwnerWhatsapp(settings.owner_whatsapp || '');
      setOverrideTodayLitres(settings.override_today_litres !== undefined && settings.override_today_litres !== null ? settings.override_today_litres.toString() : '');
      setOverrideMonthlyRevenue(settings.override_monthly_revenue !== undefined && settings.override_monthly_revenue !== null ? settings.override_monthly_revenue.toString() : '');
      setOverridePendingPayments(settings.override_pending_payments !== undefined && settings.override_pending_payments !== null ? settings.override_pending_payments.toString() : '');
      setOverrideCollectedPayments(settings.override_collected_payments !== undefined && settings.override_collected_payments !== null ? settings.override_collected_payments.toString() : '');
    }
  }, [settings]);

  // Bulk check all customers if applyToAll is toggled
  useEffect(() => {
    if (applyToAll) {
      const initial: Record<string, boolean> = {};
      customers.forEach(c => {
        initial[c.id] = true;
      });
      setSelectedCustomers(initial);
    }
  }, [applyToAll, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus('saving');
    try {
      const updated: SettingsType = {
        id: settings?.id || crypto.randomUUID(),
        owner_code: ownerCode.trim(),
        owner_phone: ownerPhone.trim(),
        owner_whatsapp: ownerWhatsapp.trim(),
        override_today_litres: overrideTodayLitres.trim() !== '' ? Number(overrideTodayLitres) : null,
        override_monthly_revenue: overrideMonthlyRevenue.trim() !== '' ? Number(overrideMonthlyRevenue) : null,
        override_pending_payments: overridePendingPayments.trim() !== '' ? Number(overridePendingPayments) : null,
        override_collected_payments: overrideCollectedPayments.trim() !== '' ? Number(overrideCollectedPayments) : null,
        created_at: settings?.created_at || new Date().toISOString()
      };

      const res = await updateSettings(updated);
      if (res) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleCustomerToggle = (id: string) => {
    setSelectedCustomers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAllToggle = () => {
    const nextVal = !applyToAll;
    setApplyToAll(nextVal);
    const updated: Record<string, boolean> = {};
    if (nextVal) {
      customers.forEach(c => {
        updated[c.id] = true;
      });
    }
    setSelectedCustomers(updated);
  };

  const handleChangePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newPrice);
    if (!newPrice || isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid milk price.');
      return;
    }

    const selectedIds = Object.keys(selectedCustomers).filter(id => selectedCustomers[id]);
    if (selectedIds.length === 0) {
      alert('Please select at least one customer.');
      return;
    }

    setPriceChangeStatus('saving');
    try {
      const promises = selectedIds.map(id => {
        const customer = customers.find(c => c.id === id);
        if (customer) {
          const updatedCustomer = {
            ...customer,
            rate_per_liter: priceNum
          };
          return updateCustomer(updatedCustomer);
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);
      setPriceChangeStatus('success');
      setNewPrice('');
      setApplyToAll(false);
      setSelectedCustomers({});
      setTimeout(() => setPriceChangeStatus('idle'), 3000);
    } catch (err) {
      console.error('Error changing milk prices:', err);
      setPriceChangeStatus('error');
    }
  };

  /**
   * Backs up the entire Local Storage Database as a downloadable JSON file
   */
  const handleBackup = () => {
    const backupData: Record<string, string | null> = {};
    const keys = ['sd_customers', 'sd_milk_entries', 'sd_payments', 'sd_gallery', 'sd_settings'];
    
    keys.forEach(k => {
      backupData[k] = localStorage.getItem(k);
    });

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Salman_Dairy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Restores database from a JSON backup file
   */
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        // Validate keys
        const expectedKeys = ['sd_customers', 'sd_milk_entries', 'sd_payments', 'sd_gallery', 'sd_settings'];
        const hasKeys = expectedKeys.every(k => k in backupData);

        if (!hasKeys) {
          setRestoreStatus('error');
          return;
        }

        // Write to local storage
        Object.entries(backupData).forEach(([key, val]) => {
          if (val) {
            localStorage.setItem(key, val as string);
          }
        });

        setRestoreStatus('success');
        await refreshData();
        setTimeout(() => setRestoreStatus('idle'), 3000);
      } catch (err) {
        console.error(err);
        setRestoreStatus('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black font-display text-slate-850 dark:text-white leading-tight">
          System Settings
        </h2>
        <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">
          Update your secret access passcode, default contact numbers, and manage local data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Configurations Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm text-left space-y-6">
          <h3 className="font-bold text-slate-850 dark:text-white text-base font-display flex items-center gap-2">
            <ShieldCheck size={18} className="text-sky-500" />
            <span>Admin Configuration</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Passcode */}
            <div>
              <label className="block text-3xs font-bold text-slate-455 uppercase tracking-widest mb-1.5">
                Owner Access Passcode
              </label>
              <input
                type="text"
                value={ownerCode}
                onChange={(e) => setOwnerCode(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs"
              />
              <span className="block text-3xs text-slate-400 mt-1 font-semibold">
                ⚠️ Keep this passcode safe. It is required to access the dashboard.
              </span>
            </div>

            {/* Support Phone */}
            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Support Phone Call Number
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-xs"
              />
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                WhatsApp Delivery Number
              </label>
              <input
                type="text"
                value={ownerWhatsapp}
                onChange={(e) => setOwnerWhatsapp(e.target.value)}
                placeholder="03001234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-xs"
              />
            </div>

            {/* Dashboard Manual Overrides */}
            <div className="border-t border-slate-100 dark:border-slate-855 pt-4 mt-2">
              <span className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Dashboard Value Overrides
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Today's Litres Sold
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculate"
                    value={overrideTodayLitres}
                    onChange={(e) => setOverrideTodayLitres(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-2xs font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Monthly Revenue (Rs)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculate"
                    value={overrideMonthlyRevenue}
                    onChange={(e) => setOverrideMonthlyRevenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-2xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Pending Payments (Rs)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculate"
                    value={overridePendingPayments}
                    onChange={(e) => setOverridePendingPayments(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-2xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-450 uppercase tracking-widest mb-1">
                    Collected Payments (Rs)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculate"
                    value={overrideCollectedPayments}
                    onChange={(e) => setOverrideCollectedPayments(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-2xs font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Leave empty/blank to use automated calculations from daily records.
              </p>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                <CheckCircle size={16} />
                <span>Settings updated successfully!</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>Error updating configurations. Try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wide disabled:opacity-50"
            >
              <Save size={14} />
              <span>{status === 'saving' ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>
        </div>

        {/* Database Management Tools Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm text-left space-y-6">
          <h3 className="font-bold text-slate-850 dark:text-white text-base font-display flex items-center gap-2">
            <Database size={18} className="text-sky-500" />
            <span>Database Backup Utilities</span>
          </h3>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If you are using the app offline in Demo Local Mode, all records are stored on your local browser. Make sure to download regular backups to prevent loss of customer accounts.
            </p>

            {/* Action 1: Download backup */}
            <button
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 py-3.5 border border-sky-500/30 text-sky-500 hover:bg-sky-500/5 font-bold rounded-xl transition-all text-xs uppercase tracking-wide"
            >
              <Database size={14} />
              <span>Download JSON Backup</span>
            </button>

            {/* Action 2: Restore backup */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 space-y-3">
              <span className="block text-3xs font-bold text-slate-400 uppercase tracking-widest">
                Upload & Restore Backup
              </span>
              
              <div className="relative w-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-1">
                  <Upload size={20} className="text-slate-450 mx-auto" />
                  <p className="text-3xs font-semibold text-slate-650 dark:text-slate-350">
                    Click or drag your backup `.json` file here
                  </p>
                </div>
              </div>

              {restoreStatus === 'success' && (
                <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                  <CheckCircle size={16} />
                  <span>Database restored successfully! Page updated.</span>
                </div>
              )}

              {restoreStatus === 'error' && (
                <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>Restore failed. Invalid backup schema.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Milk Price Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm text-left space-y-6 lg:col-span-2">
          <h3 className="font-bold text-slate-855 dark:text-white text-base font-display flex items-center gap-2">
            <Save size={18} className="text-sky-500" />
            <span>Bulk Change Milk Price</span>
          </h3>

          <form onSubmit={handleChangePrice} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Price Input & Apply All Checkbox */}
              <div className="space-y-4">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Enter New Price (Rs. / Litre) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 150"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850">
                  <input
                    type="checkbox"
                    id="apply-to-all"
                    checked={applyToAll}
                    onChange={handleSelectAllToggle}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="apply-to-all" className="text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer select-none">
                    Apply to All Customers
                  </label>
                </div>
              </div>

              {/* Right Column: Customer Selection List */}
              <div className="space-y-2">
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest">
                  Select Customers
                </label>
                
                <div className="max-h-[180px] overflow-y-auto border border-slate-150 dark:border-slate-855 rounded-2xl p-3 bg-slate-50/30 dark:bg-slate-900/20 divide-y divide-slate-100 dark:divide-slate-850">
                  {customers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                      No active customers found.
                    </div>
                  ) : (
                    customers.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-750 dark:text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={!!selectedCustomers[c.id]}
                            disabled={applyToAll}
                            onChange={() => handleCustomerToggle(c.id)}
                            className="h-4 w-4 rounded border-slate-350 text-sky-500 focus:ring-sky-500 disabled:opacity-50 cursor-pointer"
                          />
                          <span>{c.name}</span>
                        </label>
                        <span className="text-3xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                          Rs. {c.rate_per_liter}/L
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {priceChangeStatus === 'success' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold">
                <CheckCircle size={16} />
                <span>Milk prices updated successfully!</span>
              </div>
            )}

            {priceChangeStatus === 'error' && (
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>Failed to update prices. Try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={priceChangeStatus === 'saving' || customers.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wide disabled:opacity-50"
            >
              <span>Change Prices</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
