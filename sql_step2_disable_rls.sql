-- STEP 2: Run this AFTER step 1 — disables security so data saves properly
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
