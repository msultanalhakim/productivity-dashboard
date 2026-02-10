-- =====================================================
-- Command Center Database Schema for Supabase
-- =====================================================
-- Free tier: 500MB storage, 50K monthly active users
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_state table
CREATE TABLE IF NOT EXISTS public.app_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_app_state_user_id ON public.app_state(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_app_state_updated_at ON public.app_state(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_state ENABLE ROW LEVEL security;

-- Create policy to allow all operations for anonymous users
-- Since this is a personal app with password protection at app level
CREATE POLICY "Allow all for anonymous users" 
  ON public.app_state
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.app_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Data disimpan dalam format JSONB untuk fleksibilitas
-- 2. user_id adalah unique identifier dari localStorage
-- 3. RLS diaktifkan dengan policy allow all karena:
--    - Ini aplikasi personal dengan auth di app level
--    - Tidak ada sensitive data
--    - Free tier tidak perlu auth complexity
-- 4. Setiap user_id hanya punya 1 record (UNIQUE constraint)
-- 5. Auto-update timestamp dengan trigger
-- =====================================================