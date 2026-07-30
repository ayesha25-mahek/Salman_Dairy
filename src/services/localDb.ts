import { Customer, MilkEntry, Payment, GalleryItem, Settings, seedCustomers, generateSeedMilkEntries, generateSeedPayments, seedGalleryItems, defaultSettings } from '../utils/seedData';

const KEYS = {
  CUSTOMERS: 'sd_customers',
  MILK_ENTRIES: 'sd_milk_entries',
  PAYMENTS: 'sd_payments',
  GALLERY: 'sd_gallery',
  SETTINGS: 'sd_settings'
};

export const localDb = {
  initialize: () => {
    const DB_VERSION_KEY = 'sd_db_version_v4';
    if (!localStorage.getItem(DB_VERSION_KEY)) {
      localStorage.removeItem(KEYS.CUSTOMERS);
      localStorage.removeItem(KEYS.MILK_ENTRIES);
      localStorage.removeItem(KEYS.PAYMENTS);
      localStorage.removeItem(KEYS.GALLERY);
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.setItem(DB_VERSION_KEY, 'true');
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
    }
    if (!localStorage.getItem(KEYS.MILK_ENTRIES)) {
      localStorage.setItem(KEYS.MILK_ENTRIES, JSON.stringify(generateSeedMilkEntries(seedCustomers)));
    }
    if (!localStorage.getItem(KEYS.PAYMENTS)) {
      localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(generateSeedPayments(seedCustomers)));
    }
    if (!localStorage.getItem(KEYS.GALLERY)) {
      localStorage.setItem(KEYS.GALLERY, JSON.stringify(seedGalleryItems));
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  },

  getCustomers: (): Customer[] => {
    localDb.initialize();
    return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
  },

  saveCustomer: (customer: Customer): Customer => {
    localDb.initialize();
    const customers = localDb.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    return customer;
  },

  deleteCustomer: (id: string): void => {
    localDb.initialize();
    const customers = localDb.getCustomers().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));

    // Cascade delete milk entries and payments
    const entries = localDb.getMilkEntries().filter(e => e.customer_id !== id);
    localStorage.setItem(KEYS.MILK_ENTRIES, JSON.stringify(entries));

    const payments = localDb.getPayments().filter(p => p.customer_id !== id);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getMilkEntries: (): MilkEntry[] => {
    localDb.initialize();
    return JSON.parse(localStorage.getItem(KEYS.MILK_ENTRIES) || '[]');
  },

  saveMilkEntry: (entry: MilkEntry): MilkEntry => {
    localDb.initialize();
    const entries = localDb.getMilkEntries();
    const index = entries.findIndex(e => e.customer_id === entry.customer_id && e.date === entry.date);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    localStorage.setItem(KEYS.MILK_ENTRIES, JSON.stringify(entries));
    return entry;
  },

  saveMilkEntriesBatch: (newEntries: MilkEntry[]): MilkEntry[] => {
    localDb.initialize();
    const entries = localDb.getMilkEntries();
    newEntries.forEach(newEntry => {
      const index = entries.findIndex(e => e.customer_id === newEntry.customer_id && e.date === newEntry.date);
      if (index >= 0) {
        entries[index] = newEntry;
      } else {
        entries.push(newEntry);
      }
    });
    localStorage.setItem(KEYS.MILK_ENTRIES, JSON.stringify(entries));
    return newEntries;
  },

  getPayments: (): Payment[] => {
    localDb.initialize();
    return JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]');
  },

  savePayment: (payment: Payment): Payment => {
    localDb.initialize();
    const payments = localDb.getPayments();
    const index = payments.findIndex(p => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
    return payment;
  },

  deletePayment: (id: string): void => {
    localDb.initialize();
    const payments = localDb.getPayments().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getGallery: (): GalleryItem[] => {
    localDb.initialize();
    return JSON.parse(localStorage.getItem(KEYS.GALLERY) || '[]');
  },

  saveGalleryItem: (item: GalleryItem): GalleryItem => {
    localDb.initialize();
    const gallery = localDb.getGallery();
    gallery.push(item);
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
    return item;
  },

  deleteGalleryItem: (id: string): void => {
    localDb.initialize();
    const gallery = localDb.getGallery().filter(g => g.id !== id);
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
  },

  getSettings: (): Settings => {
    localDb.initialize();
    const settingsStr = localStorage.getItem(KEYS.SETTINGS);
    if (!settingsStr) return defaultSettings;
    return JSON.parse(settingsStr);
  },

  saveSettings: (settings: Settings): Settings => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
};
