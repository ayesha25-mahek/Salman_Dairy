-- Salman Dairy Database Schema

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    rate_per_liter NUMERIC NOT NULL DEFAULT 80.0,
    default_quantity NUMERIC NOT NULL DEFAULT 1.0,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Milk Entries Table (Daily Logs)
CREATE TABLE IF NOT EXISTS public.milk_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, date)
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0.0,
    payment_date DATE NOT NULL,
    paid_till_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_code TEXT NOT NULL DEFAULT 'SALMAN2026',
    owner_phone TEXT,
    owner_whatsapp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Default Settings if not exists
INSERT INTO public.settings (owner_code, owner_phone, owner_whatsapp)
VALUES ('SALMAN2026', '+923001234567', '+923001234567')
ON CONFLICT DO NOTHING;

-- Seed initial test customers
INSERT INTO public.customers (customer_code, name, phone, address, rate_per_liter, default_quantity, delivery_notes)
VALUES 
('SD001', 'Muhammad Ahmed', '03007654321', 'House 12, Street 3, Block A, Lahore', 90, 1.5, 'Deliver by 7:00 AM'),
('SD002', 'Ali Raza', '03219876543', 'House 45, Street 1, Sector C, Lahore', 90, 2.0, 'Ring bell twice'),
('SD003', 'Zainab Bibi', '03334567890', 'Apartment B-4, Green Heights, Lahore', 95, 1.0, 'Leave at door');
