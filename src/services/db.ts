import { supabase } from './supabaseClient';
import { localDb } from './localDb';
import { Customer, MilkEntry, Payment, GalleryItem, Settings } from '../utils/seedData';

// Determine if we should attempt Supabase queries
const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// State flag to track active mode (can be checked in UI)
let useLocalMode = !isSupabaseConfigured();

export const isLocalMode = () => useLocalMode;
export const setLocalMode = (val: boolean) => {
  useLocalMode = val;
};

// Test Supabase connectivity and set mode accordingly
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      useLocalMode = true;
      return false;
    }
    useLocalMode = false;
    return true;
  } catch (err) {
    console.error('Supabase connection test exception:', err);
    useLocalMode = true;
    return false;
  }
};

export const dbService = {
  getCustomers: async (): Promise<Customer[]> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('customer_code', { ascending: true });
      
      if (error) {
        console.error('Supabase getCustomers error:', error.message, error.details);
        useLocalMode = true;
        return localDb.getCustomers();
      }
      return data as Customer[];
    }
    return localDb.getCustomers();
  },

  saveCustomer: async (customer: Customer): Promise<Customer> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .upsert(customer, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase saveCustomer error:', error.message, error.details);
        useLocalMode = true;
        return localDb.saveCustomer(customer);
      }
      return data as Customer;
    }
    return localDb.saveCustomer(customer);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase deleteCustomer error:', error.message);
        useLocalMode = true;
      }
      return;
    }
    return localDb.deleteCustomer(id);
  },

  getMilkEntries: async (): Promise<MilkEntry[]> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('milk_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase getMilkEntries error:', error.message);
        useLocalMode = true;
        return localDb.getMilkEntries();
      }
      return data as MilkEntry[];
    }
    return localDb.getMilkEntries();
  },

  saveMilkEntry: async (entry: MilkEntry): Promise<MilkEntry> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('milk_entries')
        .upsert({
          id: entry.id,
          customer_id: entry.customer_id,
          date: entry.date,
          quantity: entry.quantity,
          created_at: entry.created_at
        }, { onConflict: 'customer_id,date' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase saveMilkEntry error:', error.message);
        useLocalMode = true;
        return localDb.saveMilkEntry(entry);
      }
      return data as MilkEntry;
    }
    return localDb.saveMilkEntry(entry);
  },

  saveMilkEntriesBatch: async (entries: MilkEntry[]): Promise<MilkEntry[]> => {
    if (!useLocalMode && supabase) {
      const dbEntries = entries.map(e => ({
        id: e.id,
        customer_id: e.customer_id,
        date: e.date,
        quantity: e.quantity,
        created_at: e.created_at
      }));
      
      const { data, error } = await supabase
        .from('milk_entries')
        .upsert(dbEntries, { onConflict: 'customer_id,date' })
        .select();
      
      if (error) {
        console.error('Supabase saveMilkEntriesBatch error:', error.message);
        useLocalMode = true;
        return localDb.saveMilkEntriesBatch(entries);
      }
      return data as MilkEntry[];
    }
    return localDb.saveMilkEntriesBatch(entries);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.error('Supabase getPayments error:', error.message);
        useLocalMode = true;
        return localDb.getPayments();
      }
      return data as Payment[];
    }
    return localDb.getPayments();
  },

  savePayment: async (payment: Payment): Promise<Payment> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .upsert(payment, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase savePayment error:', error.message);
        useLocalMode = true;
        return localDb.savePayment(payment);
      }
      return data as Payment;
    }
    return localDb.savePayment(payment);
  },

  deletePayment: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase deletePayment error:', error.message);
        useLocalMode = true;
      }
      return;
    }
    return localDb.deletePayment(id);
  },

  getGallery: async (): Promise<GalleryItem[]> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase getGallery error:', error.message);
        useLocalMode = true;
        return localDb.getGallery();
      }
      return data as GalleryItem[];
    }
    return localDb.getGallery();
  },

  saveGalleryItem: async (item: GalleryItem): Promise<GalleryItem> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('gallery')
        .upsert(item, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase saveGalleryItem error:', error.message);
        useLocalMode = true;
        return localDb.saveGalleryItem(item);
      }
      return data as GalleryItem;
    }
    return localDb.saveGalleryItem(item);
  },

  deleteGalleryItem: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase deleteGalleryItem error:', error.message);
        useLocalMode = true;
      }
      return;
    }
    return localDb.deleteGalleryItem(id);
  },

  getSettings: async (): Promise<Settings> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Supabase getSettings error:', error.message);
        useLocalMode = true;
        return localDb.getSettings();
      }
      if (data && data.length > 0) {
        return data[0] as Settings;
      } else {
        // Seed if missing
        const { data: seeded, error: seedErr } = await supabase
          .from('settings')
          .insert({
            owner_code: 'uni2026',
            owner_phone: '03001234567',
            owner_whatsapp: '03001234567'
          })
          .select()
          .single();
        if (seedErr) {
          console.error('Supabase settings seed error:', seedErr.message);
          useLocalMode = true;
          return localDb.getSettings();
        }
        return seeded as Settings;
      }
    }
    return localDb.getSettings();
  },

  saveSettings: async (settings: Settings): Promise<Settings> => {
    if (!useLocalMode && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .upsert(settings, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase saveSettings error:', error.message);
        useLocalMode = true;
        return localDb.saveSettings(settings);
      }
      return data as Settings;
    }
    return localDb.saveSettings(settings);
  }
};
