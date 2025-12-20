-- FreelaCash Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users Profile Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Freelancer',
  title TEXT DEFAULT 'Creative Pro',
  location TEXT,
  tax_id TEXT,
  pix_key TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_goal NUMERIC DEFAULT 10000,
  main_currency TEXT DEFAULT 'BRL',
  exchange_rates JSONB DEFAULT '{"BRL": 1, "USD": 5.0, "EUR": 5.5, "GBP": 6.5}',
  tax_reserve_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  preferred_billing_channel TEXT,
  billing_email TEXT,
  first_project_date TIMESTAMPTZ,
  last_activity_date TIMESTAMPTZ,
  tags TEXT[],
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FIXED',
  contract_type TEXT DEFAULT 'ONE_OFF',
  category TEXT,
  rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'ACTIVE',
  platform_fee NUMERIC DEFAULT 0,
  invoice_url TEXT,
  tags TEXT[],
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  contract_end_date TIMESTAMPTZ,
  renewal_date TIMESTAMPTZ,
  estimated_hours NUMERIC,
  notes TEXT,
  checklist JSONB DEFAULT '[]',
  linked_expense_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Logs Table
CREATE TABLE IF NOT EXISTS work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  billable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT DEFAULT 'SCHEDULED',
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Adjustments Table
CREATE TABLE IF NOT EXISTS project_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT,
  tags TEXT[],
  is_work_related BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT,
  notes TEXT,
  status TEXT DEFAULT 'PENDING',
  payment_history JSONB DEFAULT '[]',
  due_day INTEGER,
  is_trial BOOLEAN DEFAULT FALSE,
  trial_end_date TIMESTAMPTZ,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
-- Each user can only see/edit their own data

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients Policies
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Work Logs Policies
CREATE POLICY "Users can view own logs" ON work_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON work_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON work_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON work_logs FOR DELETE USING (auth.uid() = user_id);

-- Payments Policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (auth.uid() = user_id);

-- Project Adjustments Policies
CREATE POLICY "Users can view own adjustments" ON project_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own adjustments" ON project_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own adjustments" ON project_adjustments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own adjustments" ON project_adjustments FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-create user profile and settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Freelancer'));
  
  INSERT INTO public.user_settings (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
