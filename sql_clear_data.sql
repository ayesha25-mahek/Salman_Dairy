-- Clear all existing data and reset settings with correct phone number
TRUNCATE public.payments CASCADE;
TRUNCATE public.milk_entries CASCADE;
TRUNCATE public.gallery CASCADE;
TRUNCATE public.customers CASCADE;
TRUNCATE public.settings CASCADE;

-- Insert correct settings with owner phone
INSERT INTO public.settings (owner_code, owner_phone, owner_whatsapp)
VALUES ('uni2026', '9010256658', '9010256658');
