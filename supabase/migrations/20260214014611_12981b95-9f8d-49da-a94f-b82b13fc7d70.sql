
-- 1. Add featured/discount columns to packages
ALTER TABLE public.packages
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;

-- 2. Create junction table: category ↔ custom_feature
CREATE TABLE public.category_feature_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  custom_feature_id uuid NOT NULL REFERENCES public.custom_features(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, custom_feature_id)
);

ALTER TABLE public.category_feature_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category feature mappings"
  ON public.category_feature_mappings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage category feature mappings"
  ON public.category_feature_mappings FOR ALL
  USING (is_admin() OR is_super_admin())
  WITH CHECK (is_admin() OR is_super_admin());
