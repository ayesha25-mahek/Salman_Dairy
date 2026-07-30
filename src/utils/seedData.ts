export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone: string;
  address: string;
  rate_per_liter: number;
  default_quantity: number;
  delivery_notes: string;
  created_at: string;
  deactivated_at?: string | null;
}

export interface MilkEntry {
  id: string;
  customer_id: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  created_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  paid_till_date: string; // YYYY-MM-DD
  notes: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  title: string;
  created_at: string;
}

export interface Settings {
  id: string;
  owner_code: string;
  owner_phone: string;
  owner_whatsapp: string;
  override_today_litres?: number | null;
  override_monthly_revenue?: number | null;
  override_pending_payments?: number | null;
  override_collected_payments?: number | null;
  created_at: string;
}

export const defaultSettings: Settings = {
  id: 'settings-1',
  owner_code: 'uni2026',
  owner_phone: '9010256658',
  owner_whatsapp: '9010256658',
  override_today_litres: null,
  override_monthly_revenue: null,
  override_pending_payments: null,
  override_collected_payments: null,
  created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
};

export const seedCustomers: Customer[] = [];

// Generate entries for June 1 to June 24, 2026
export const generateSeedMilkEntries = (customers: Customer[]): MilkEntry[] => {
  return [];
};

export const generateSeedPayments = (_customers: Customer[]): Payment[] => {
  return [];
};

// Buffalo farm gallery images
export const seedGalleryItems: GalleryItem[] = [
  {
    id: 'gal-1',
    image_url: 'https://images.unsplash.com/photo-1596200259899-781997e85c18?auto=format&fit=crop&w=600&q=80',
    title: 'Our healthy herd of domestic buffaloes',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-2',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    title: 'Fresh milk packets and traditional milk cans',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-3',
    image_url: 'https://images.unsplash.com/photo-1500595046783-cd2118934c68?auto=format&fit=crop&w=600&q=80',
    title: 'Beautiful and clean buffalo farm pasture',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-4',
    image_url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=600&q=80',
    title: 'Cows grazing peacefully with hens on the meadow',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  }
];
