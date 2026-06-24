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
  created_at: string;
}

export const defaultSettings: Settings = {
  id: 'settings-1',
  owner_code: 'mylifemuskan',
  owner_phone: '9010256658',
  owner_whatsapp: '9010256658',
  created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
};

export const seedCustomers: Customer[] = [];

// Generate entries for June 1 to June 24, 2026
export const generateSeedMilkEntries = (customers: Customer[]): MilkEntry[] => {
  const entries: MilkEntry[] = [];
  const startDay = 1;
  const endDay = 24;
  const year = 2026;
  const month = 6; // June

  customers.forEach(customer => {
    for (let day = startDay; day <= endDay; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let quantity = customer.default_quantity;
      if (day === 4 && customer.customer_code === 'SD001') {
        quantity = 2.5;
      } else if (day === 10 && customer.customer_code === 'SD002') {
        quantity = 0;
      } else if (day === 15 && customer.customer_code === 'SD003') {
        quantity = 2.0;
      }

      entries.push({
        id: `entry-${customer.id}-${day}`,
        customer_id: customer.id,
        date: dateString,
        quantity,
        created_at: new Date(`${dateString}T07:00:00.000Z`).toISOString()
      });
    }
  });

  return entries;
};

export const generateSeedPayments = (_customers: Customer[]): Payment[] => {
  return [
    {
      id: 'pay-1',
      customer_id: 'cust-1',
      amount: 1500,
      payment_date: '2026-06-12',
      paid_till_date: '2026-06-10',
      notes: 'Received cash by hand.',
      created_at: new Date('2026-06-12T12:00:00.000Z').toISOString()
    },
    {
      id: 'pay-2',
      customer_id: 'cust-2',
      amount: 3000,
      payment_date: '2026-06-15',
      paid_till_date: '2026-06-15',
      notes: 'Received via JazzCash.',
      created_at: new Date('2026-06-15T18:30:00.000Z').toISOString()
    },
    {
      id: 'pay-3',
      customer_id: 'cust-3',
      amount: 1000,
      payment_date: '2026-06-10',
      paid_till_date: '2026-06-10',
      notes: 'Received via EasyPaisa.',
      created_at: new Date('2026-06-10T10:15:00.000Z').toISOString()
    }
  ];
};

// Buffalo farm gallery images
export const seedGalleryItems: GalleryItem[] = [
  {
    id: 'gal-1',
    image_url: 'https://images.unsplash.com/photo-1599579425104-f54c4b14be44?auto=format&fit=crop&w=600&q=80',
    title: 'Our healthy buffalo herd grazing',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-2',
    image_url: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=600&q=80',
    title: 'Fresh buffalo milk ready for delivery',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-3',
    image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    title: 'Clean and hygienic farm facility',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-4',
    image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
    title: 'Fresh milk bottled daily',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-5',
    image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    title: 'Buffalo feeding time at the farm',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'gal-6',
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    title: 'Pure rich buffalo milk — farm fresh',
    created_at: new Date('2026-06-01T00:00:00.000Z').toISOString()
  }
];
