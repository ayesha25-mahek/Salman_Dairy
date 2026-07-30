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

export const dbService = {
  getCustomers: async (): Promise<Customer[]> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('customer_code', { ascending: true });
        
        if (error) throw error;
        return data as Customer[];
      } catch (err) {
        console.warn('Supabase getCustomers failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.getCustomers();
  },

  saveCustomer: async (customer: Customer): Promise<Customer> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .upsert(customer)
          .select()
          .single();
        
        if (error) throw error;
        return data as Customer;
      } catch (err) {
        console.warn('Supabase saveCustomer failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.saveCustomer(customer);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteCustomer failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.deleteCustomer(id);
  },

  getMilkEntries: async (): Promise<MilkEntry[]> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('milk_entries')
          .select('*');
        
        if (error) throw error;
        return data as MilkEntry[];
      } catch (err) {
        console.warn('Supabase getMilkEntries failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.getMilkEntries();
  },

  saveMilkEntry: async (entry: MilkEntry): Promise<MilkEntry> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('milk_entries')
          .upsert({
            customer_id: entry.customer_id,
            date: entry.date,
            quantity: entry.quantity
          })
          .select()
          .single();
        
        if (error) throw error;
        return data as MilkEntry;
      } catch (err) {
        console.warn('Supabase saveMilkEntry failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.saveMilkEntry(entry);
  },

  saveMilkEntriesBatch: async (entries: MilkEntry[]): Promise<MilkEntry[]> => {
    if (!useLocalMode && supabase) {
      try {
        const dbEntries = entries.map(e => ({
          customer_id: e.customer_id,
          date: e.date,
          quantity: e.quantity
        }));
        
        const { data, error } = await supabase
          .from('milk_entries')
          .upsert(dbEntries)
          .select();
        
        if (error) throw error;
        return data as MilkEntry[];
      } catch (err) {
        console.warn('Supabase saveMilkEntriesBatch failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.saveMilkEntriesBatch(entries);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });
        
        if (error) throw error;
        return data as Payment[];
      } catch (err) {
        console.warn('Supabase getPayments failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.getPayments();
  },

  savePayment: async (payment: Payment): Promise<Payment> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .upsert(payment)
          .select()
          .single();
        
        if (error) throw error;
        return data as Payment;
      } catch (err) {
        console.warn('Supabase savePayment failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.savePayment(payment);
  },

  deletePayment: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      try {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deletePayment failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.deletePayment(id);
  },

  getGallery: async (): Promise<GalleryItem[]> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as GalleryItem[];
      } catch (err) {
        console.warn('Supabase getGallery failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.getGallery();
  },

  saveGalleryItem: async (item: GalleryItem): Promise<GalleryItem> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .insert({
            image_url: item.image_url,
            title: item.title
          })
          .select()
          .single();
        
        if (error) throw error;
        return data as GalleryItem;
      } catch (err) {
        console.warn('Supabase saveGalleryItem failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.saveGalleryItem(item);
  },

  deleteGalleryItem: async (id: string): Promise<void> => {
    if (!useLocalMode && supabase) {
      try {
        const { error } = await supabase
          .from('gallery')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteGalleryItem failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.deleteGalleryItem(id);
  },

  getSettings: async (): Promise<Settings> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1);
        
        if (error) throw error;
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
          if (seedErr) throw seedErr;
          return seeded as Settings;
        }
      } catch (err) {
        console.warn('Supabase getSettings failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.getSettings();
  },

  saveSettings: async (settings: Settings): Promise<Settings> => {
    if (!useLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .upsert(settings)
          .select()
          .single();
        
        if (error) throw error;
        return data as Settings;
      } catch (err) {
        console.warn('Supabase saveSettings failed, falling back to localStorage:', err);
        setLocalMode(true);
      }
    }
    return localDb.saveSettings(settings);
  }
};
