-- Subscription & monetization schema

-- Helper function (needed by multiple triggers below)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Plans catalog
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'THB',
  billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly')),
  listing_quota integer NOT NULL DEFAULT 0,
  image_quota integer NOT NULL DEFAULT 0,
  featured_slots integer NOT NULL DEFAULT 0,
  badge_level text NOT NULL DEFAULT 'none',
  adopter_alert_limit integer NOT NULL DEFAULT 0,
  background_check_limit integer NOT NULL DEFAULT 0,
  is_for_adopters boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are readable by everyone"
  ON public.plans
  FOR SELECT
  USING (true);

-- Seed plans
INSERT INTO public.plans (slug, name, description, price, sort_order, listing_quota, image_quota, featured_slots, badge_level)
VALUES
  ('free-care', 'Free Care', 'ประกาศได้ฟรี 3 รายการ/เดือน', 0, 1, 3, 3, 0, 'none'),
  ('home-booster', 'Home Booster', 'แพ็กเกจสำหรับเจ้าของ/ศูนย์พักพิงขนาดเล็ก', 199, 2, 15, 0, 1, 'verified'),
  ('rescue-pro', 'Rescue Pro', 'ไม่จำกัดประกาศ พร้อมปักหมุด 3 รายการ', 499, 3, 999, 0, 3, 'elite'),
  ('adopter-insights', 'Adopter Insights', 'แจ้งเตือนและตัวกรองขั้นสูงสำหรับผู้รับเลี้ยง', 99, 4, 0, 0, 0, 'none')
ON CONFLICT (slug) DO NOTHING;

-- Payment transactions for PromptPay
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'THB',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  promptpay_payload text,
  reference_code text UNIQUE NOT NULL,
  slip_url text,
  notes text,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their payment record"
  ON public.payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their payment record"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No direct updates by end users"
  ON public.payment_transactions
  FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete by end users"
  ON public.payment_transactions
  FOR DELETE
  USING (false);

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','canceled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT false,
  payment_transaction_id uuid REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pending subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Prevent direct updates/deletes"
  ON public.user_subscriptions
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent delete"
  ON public.user_subscriptions
  FOR DELETE
  USING (false);

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Plan usage tracking per month
CREATE TABLE IF NOT EXISTS public.plan_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  listing_count integer NOT NULL DEFAULT 0,
  featured_count integer NOT NULL DEFAULT 0,
  adopter_alert_count integer NOT NULL DEFAULT 0,
  background_check_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

ALTER TABLE public.plan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their usage"
  ON public.plan_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot mutate usage directly"
  ON public.plan_usage
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER plan_usage_updated_at
  BEFORE UPDATE ON public.plan_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Featured cats slots
CREATE TABLE IF NOT EXISTS public.featured_cats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id uuid NOT NULL REFERENCES public.cats(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  slot_number integer NOT NULL DEFAULT 1,
  featured_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cat_id)
);

ALTER TABLE public.featured_cats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured cats are public"
  ON public.featured_cats
  FOR SELECT
  USING (true);

CREATE POLICY "Owners can request featured entries"
  ON public.featured_cats
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can deactivate their featured entry"
  ON public.featured_cats
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Adopter alerts for email notification
CREATE TABLE IF NOT EXISTS public.adopter_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  email text,
  is_active boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.adopter_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alerts"
  ON public.adopter_alerts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER adopter_alerts_updated_at
  BEFORE UPDATE ON public.adopter_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Background check requests
CREATE TABLE IF NOT EXISTS public.background_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adopter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cat_id uuid NOT NULL REFERENCES public.cats(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes text,
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.background_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read background requests"
  ON public.background_requests
  FOR SELECT
  USING (auth.uid() = adopter_id OR auth.uid() = owner_id);

CREATE POLICY "Adopters can create requests"
  ON public.background_requests
  FOR INSERT
  WITH CHECK (auth.uid() = adopter_id);

CREATE POLICY "Owners can update request status"
  ON public.background_requests
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
