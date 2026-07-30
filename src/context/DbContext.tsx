import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService, isLocalMode, testSupabaseConnection } from '../services/db';
import { Customer, MilkEntry, Payment, GalleryItem, Settings } from '../utils/seedData';

interface DbContextType {
  customers: Customer[];
  milkEntries: MilkEntry[];
  payments: Payment[];
  gallery: GalleryItem[];
  settings: Settings | null;
  loading: boolean;
  isLocalDb: boolean;
  supabaseConnected: boolean;
  ownerAuthenticated: boolean;
  loginError: string | null;
  
  // Auth
  authenticateOwner: (code: string) => boolean;
  logoutOwner: () => void;

  // Refetch
  refreshData: () => Promise<void>;

  // Customer Operations
  addCustomer: (customerData: Omit<Customer, 'id' | 'customer_code' | 'created_at'>, customCode?: string) => Promise<Customer | null>;
  updateCustomer: (customer: Customer) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  deactivateCustomer: (id: string) => Promise<boolean>;
  reactivateCustomer: (id: string) => Promise<boolean>;

  // Milk Operations
  saveMilkEntry: (customerId: string, date: string, quantity: number) => Promise<MilkEntry | null>;
  saveMilkEntriesBatch: (entries: MilkEntry[]) => Promise<MilkEntry[] | null>;

  // Payment Operations
  addPayment: (paymentData: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<boolean>;

  // Gallery Operations
  addGalleryItem: (imageUrl: string, title: string) => Promise<GalleryItem | null>;
  deleteGalleryItem: (id: string) => Promise<boolean>;

  // Settings Operations
  updateSettings: (settings: Settings) => Promise<Settings | null>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocalDb, setIsLocalDb] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [ownerAuthenticated, setOwnerAuthenticated] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load Auth State on mount
  useEffect(() => {
    const auth = localStorage.getItem('sd_owner_auth');
    if (auth === 'true') {
      setOwnerAuthenticated(true);
    }
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [custData, milkData, payData, galData, settsData] = await Promise.all([
        dbService.getCustomers(),
        dbService.getMilkEntries(),
        dbService.getPayments(),
        dbService.getGallery(),
        dbService.getSettings()
      ]);

      setCustomers(custData);
      setMilkEntries(milkData);
      setPayments(payData);
      setGallery(galData);
      setSettings(settsData);
      const localNow = isLocalMode();
      setIsLocalDb(localNow);
      setSupabaseConnected(!localNow);
    } catch (err) {
      console.error('Error fetching data from database service:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test Supabase first, then load data
    testSupabaseConnection().then((ok) => {
      setSupabaseConnected(ok);
      setIsLocalDb(!ok);
      refreshData();
    });
  }, []);

  // Authentication
  const authenticateOwner = (code: string): boolean => {
    const currentCode = settings?.owner_code || 'uni2026';
    const trimmedInput = code.trim();
    if (trimmedInput === currentCode) {
      setOwnerAuthenticated(true);
      localStorage.setItem('sd_owner_auth', 'true');
      setLoginError(null);
      return true;
    } else {
      setLoginError('Incorrect Access Code. Please try again.');
      return false;
    }
  };

  const logoutOwner = () => {
    setOwnerAuthenticated(false);
    localStorage.removeItem('sd_owner_auth');
  };

  // Generate Customer Code SD001, SD002, etc.
  const generateCustomerCode = (): string => {
    if (customers.length === 0) return 'SD001';
    
    // Extract codes and parse numeric suffixes
    const codes = customers.map(c => {
      const match = c.customer_code.match(/SD(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSuffix = Math.max(...codes, 0);
    return `SD${String(maxSuffix + 1).padStart(3, '0')}`;
  };

  // Customer Operations
  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'customer_code' | 'created_at'>,
    customCode?: string
  ): Promise<Customer | null> => {
    // Use the custom code if provided, otherwise auto-generate
    const nextCode = customCode ? customCode.toUpperCase() : generateCustomerCode();
    const { _custom_code: _, ...cleanData } = customerData as any;
    const newCustomer: Customer = {
      ...cleanData,
      id: crypto.randomUUID(),
      customer_code: nextCode,
      created_at: new Date().toISOString()
    };

    const saved = await dbService.saveCustomer(newCustomer);
    if (saved) {
      setCustomers(prev => [...prev, saved].sort((a, b) => a.customer_code.localeCompare(b.customer_code)));
      return saved;
    }
    return null;
  };

  const updateCustomer = async (customer: Customer): Promise<Customer | null> => {
    const saved = await dbService.saveCustomer(customer);
    if (saved) {
      setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c));
      return saved;
    }
    return null;
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    await dbService.deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    // Cascade delete milkEntries and payments in local state
    setMilkEntries(prev => prev.filter(e => e.customer_id !== id));
    setPayments(prev => prev.filter(p => p.customer_id !== id));
    return true;
  };

  const deactivateCustomer = async (id: string): Promise<boolean> => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return false;
    
    const updated = {
      ...customer,
      deactivated_at: new Date().toISOString()
    };
    
    const saved = await dbService.saveCustomer(updated);
    if (saved) {
      setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c));
      return true;
    }
    return false;
  };

  const reactivateCustomer = async (id: string): Promise<boolean> => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return false;
    
    const updated = {
      ...customer,
      deactivated_at: null
    };
    
    const saved = await dbService.saveCustomer(updated);
    if (saved) {
      setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c));
      return true;
    }
    return false;
  };

  // Milk Operations
  const saveMilkEntry = async (customerId: string, date: string, quantity: number): Promise<MilkEntry | null> => {
    const newEntry: MilkEntry = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      date,
      quantity,
      created_at: new Date().toISOString()
    };

    const saved = await dbService.saveMilkEntry(newEntry);
    if (saved) {
      setMilkEntries(prev => {
        const index = prev.findIndex(e => e.customer_id === customerId && e.date === date);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      return saved;
    }
    return null;
  };

  const saveMilkEntriesBatch = async (entries: MilkEntry[]): Promise<MilkEntry[] | null> => {
    const saved = await dbService.saveMilkEntriesBatch(entries);
    if (saved) {
      setMilkEntries(prev => {
        const updated = [...prev];
        saved.forEach(newEntry => {
          const index = updated.findIndex(e => e.customer_id === newEntry.customer_id && e.date === newEntry.date);
          if (index >= 0) {
            updated[index] = newEntry;
          } else {
            updated.push(newEntry);
          }
        });
        return updated;
      });
      return saved;
    }
    return null;
  };

  // Payment Operations
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> => {
    const newPayment: Payment = {
      ...paymentData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    const saved = await dbService.savePayment(newPayment);
    if (saved) {
      setPayments(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  };

  const deletePayment = async (id: string): Promise<boolean> => {
    await dbService.deletePayment(id);
    setPayments(prev => prev.filter(p => p.id !== id));
    return true;
  };

  // Gallery Operations
  const addGalleryItem = async (imageUrl: string, title: string): Promise<GalleryItem | null> => {
    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      image_url: imageUrl,
      title,
      created_at: new Date().toISOString()
    };

    const saved = await dbService.saveGalleryItem(newItem);
    if (saved) {
      setGallery(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  };

  const deleteGalleryItem = async (id: string): Promise<boolean> => {
    await dbService.deleteGalleryItem(id);
    setGallery(prev => prev.filter(g => g.id !== id));
    return true;
  };

  // Settings Operations
  const updateSettings = async (updatedSettings: Settings): Promise<Settings | null> => {
    const saved = await dbService.saveSettings(updatedSettings);
    if (saved) {
      setSettings(saved);
      return saved;
    }
    return null;
  };

  return (
    <DbContext.Provider
      value={{
        customers,
        milkEntries,
        payments,
        gallery,
        settings,
        loading,
        isLocalDb,
        supabaseConnected,
        ownerAuthenticated,
        loginError,
        authenticateOwner,
        logoutOwner,
        refreshData,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        deactivateCustomer,
        reactivateCustomer,
        saveMilkEntry,
        saveMilkEntriesBatch,
        addPayment,
        deletePayment,
        addGalleryItem,
        deleteGalleryItem,
        updateSettings
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
