import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { Settings as SettingsType } from '../../utils/seedData';
import { Save, ShieldCheck, Phone, CheckCircle, AlertCircle, Database, Upload, HelpCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, refreshData } = useDb();

  const [ownerCode, setOwnerCode] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings into form state
  useEffect(() => {
    if (settings) {
      setOwnerCode(settings.owner_code);
      setOwnerPhone(settings.owner_phone || '');
      setOwnerWhatsapp(settings.owner_whatsapp || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerCode.trim()) return;

    setStatus('saving');
    try {
      const updated: SettingsType = {
        id: settings?.id || crypto.randomUUID(),
        owner_code: ownerCode.trim(),
        owner_phone: ownerPhone.trim(),
        owner_whatsapp: ownerWhatsapp.trim(),
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
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Owner Access Passcode *
              </label>
              <input
                type="text"
                required
                value={ownerCode}
                onChange={(e) => setOwnerCode(e.target.value)}
                placeholder="mylifemuskan"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs"
              />
              <span className="block text-3xs text-sky-500 mt-1 font-semibold">
                ⚠️ This is your current dashboard password. Change it here anytime. Current: mylifemuskan
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-xs"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-xs"
              />
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

      </div>
    </div>
  );
};
