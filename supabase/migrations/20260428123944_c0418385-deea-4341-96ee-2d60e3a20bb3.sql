
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('super_user', 'production_user', 'viewer');
CREATE TYPE public.so_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.so_status AS ENUM ('new','waiting_material','ready_plan','planned','running','partial','completed','hold','late');
CREATE TYPE public.material_state AS ENUM ('ready','partial','shortage','waiting_supplier');
CREATE TYPE public.plan_status AS ENUM ('scheduled','running','completed','hold');
CREATE TYPE public.log_status AS ENUM ('not_started','running','partial','completed','hold');
CREATE TYPE public.note_kind AS ENUM ('order','material','planning','production','completion','general');
CREATE TYPE public.shift_kind AS ENUM ('shift_1','shift_2','shift_3');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_user(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'super_user'); $$;

CREATE OR REPLACE FUNCTION public.can_write_production(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'super_user') OR public.has_role(_user_id, 'production_user'); $$;

CREATE OR REPLACE FUNCTION public.is_authenticated_user(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT _user_id IS NOT NULL; $$;

-- Auto-create profile + default viewer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================
-- MASTER DATA
-- ============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  box_type TEXT,
  paper_material TEXT,
  specification TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  capacity_per_hour INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_machines_updated BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- SALES ORDERS
-- ============================================
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_po TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  box_type TEXT,
  paper_material TEXT,
  specification TEXT,
  qty_order INTEGER NOT NULL DEFAULT 0,
  qty_produced INTEGER NOT NULL DEFAULT 0,
  qty_reject INTEGER NOT NULL DEFAULT 0,
  delivery_date DATE,
  priority so_priority NOT NULL DEFAULT 'normal',
  status so_status NOT NULL DEFAULT 'new',
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_so_status ON public.sales_orders(status);
CREATE INDEX idx_so_priority ON public.sales_orders(priority);
CREATE INDEX idx_so_delivery ON public.sales_orders(delivery_date);
CREATE TRIGGER trg_so_updated BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- MATERIAL STATUS
-- ============================================
CREATE TABLE public.material_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  material_name TEXT,
  need_qty NUMERIC NOT NULL DEFAULT 0,
  ready_qty NUMERIC NOT NULL DEFAULT 0,
  eta DATE,
  status material_state NOT NULL DEFAULT 'shortage',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.material_status ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_matstat_so ON public.material_status(sales_order_id);
CREATE TRIGGER trg_matstat_updated BEFORE UPDATE ON public.material_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- PRODUCTION PLANS
-- ============================================
CREATE TABLE public.production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  start_date DATE,
  finish_date DATE,
  estimated_output INTEGER DEFAULT 0,
  priority_rank INTEGER NOT NULL DEFAULT 0,
  status plan_status NOT NULL DEFAULT 'scheduled',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_plan_machine ON public.production_plans(machine_id);
CREATE INDEX idx_plan_so ON public.production_plans(sales_order_id);
CREATE TRIGGER trg_plan_updated BEFORE UPDATE ON public.production_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- PRODUCTION LOGS
-- ============================================
CREATE TABLE public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift shift_kind NOT NULL DEFAULT 'shift_1',
  qty_produced INTEGER NOT NULL DEFAULT 0,
  qty_reject INTEGER NOT NULL DEFAULT 0,
  status log_status NOT NULL DEFAULT 'running',
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_log_so ON public.production_logs(sales_order_id);
CREATE INDEX idx_log_date ON public.production_logs(log_date);
CREATE TRIGGER trg_log_updated BEFORE UPDATE ON public.production_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-update SO produced/reject totals + status
CREATE OR REPLACE FUNCTION public.recalc_so_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE so_id UUID; tot_prod INT; tot_rej INT; ord INT;
BEGIN
  so_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  SELECT COALESCE(SUM(qty_produced),0), COALESCE(SUM(qty_reject),0) INTO tot_prod, tot_rej
    FROM public.production_logs WHERE sales_order_id = so_id;
  SELECT qty_order INTO ord FROM public.sales_orders WHERE id = so_id;
  UPDATE public.sales_orders
    SET qty_produced = tot_prod,
        qty_reject = tot_rej,
        status = CASE
          WHEN tot_prod >= ord AND ord > 0 THEN 'completed'::so_status
          WHEN tot_prod > 0 THEN 'partial'::so_status
          ELSE status
        END
  WHERE id = so_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_recalc_so_totals
AFTER INSERT OR UPDATE OR DELETE ON public.production_logs
FOR EACH ROW EXECUTE FUNCTION public.recalc_so_totals();

-- ============================================
-- NOTES (Timeline)
-- ============================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  kind note_kind NOT NULL DEFAULT 'general',
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notes_so ON public.notes(sales_order_id, created_at DESC);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- profiles: user can read/update own; super can manage all
CREATE POLICY "profiles_select_own_or_super" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_user(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- user_roles: any authenticated user can read (needed to check own role); only super can write
CREATE POLICY "roles_read_all_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_super_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- helper macro: read by any auth, write by super
-- customers
CREATE POLICY "customers_read" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_super" ON public.customers FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- products
CREATE POLICY "products_read" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_super" ON public.products FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- machines
CREATE POLICY "machines_read" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "machines_super" ON public.machines FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- materials
CREATE POLICY "materials_read" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_super" ON public.materials FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- sales_orders
CREATE POLICY "so_read" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "so_super" ON public.sales_orders FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- material_status
CREATE POLICY "matstat_read" ON public.material_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "matstat_super" ON public.material_status FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- production_plans
CREATE POLICY "plan_read" ON public.production_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_super" ON public.production_plans FOR ALL TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));

-- production_logs: super + production user can insert/update; everyone reads
CREATE POLICY "log_read" ON public.production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "log_insert_prod" ON public.production_logs FOR INSERT TO authenticated
  WITH CHECK (public.can_write_production(auth.uid()));
CREATE POLICY "log_update_prod" ON public.production_logs FOR UPDATE TO authenticated
  USING (public.can_write_production(auth.uid())) WITH CHECK (public.can_write_production(auth.uid()));
CREATE POLICY "log_delete_super" ON public.production_logs FOR DELETE TO authenticated
  USING (public.is_super_user(auth.uid()));

-- notes: super + production user can insert; super can edit/delete; all read
CREATE POLICY "notes_read" ON public.notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_insert_prod" ON public.notes FOR INSERT TO authenticated
  WITH CHECK (public.can_write_production(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "notes_super_modify" ON public.notes FOR UPDATE TO authenticated
  USING (public.is_super_user(auth.uid())) WITH CHECK (public.is_super_user(auth.uid()));
CREATE POLICY "notes_super_delete" ON public.notes FOR DELETE TO authenticated
  USING (public.is_super_user(auth.uid()));

-- audit_logs: super read, system write via service role
CREATE POLICY "audit_super_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_user(auth.uid()));
