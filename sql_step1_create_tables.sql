-- STEP 1: Run this first — creates all tables
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    rate_per_liter NUMERIC NOT NULL DEFAULT 90.0,
    default_quantity NUMERIC NOT NULL DEFAULT 1.5,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.milk_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, date)
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0.0,
    payment_date DATE NOT NULL,
    paid_till_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_code TEXT NOT NULL DEFAULT 'uni2026',
    owner_phone TEXT,
    owner_whatsapp TEXT,
    override_today_litres NUMERIC,
    override_monthly_revenue NUMERIC,
    override_pending_payments NUMERIC,
    override_collected_payments NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.settings (owner_code, owner_phone, owner_whatsapp)
VALUES ('uni2026', '03001234567', '03001234567')
ON CONFLICT DO NOTHING;
