
-- Create custom_features table
CREATE TABLE public.custom_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'sparkles',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_features ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage custom features"
  ON public.custom_features FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active custom features"
  ON public.custom_features FOR SELECT
  USING (is_active = true);

-- Timestamp trigger
CREATE TRIGGER update_custom_features_updated_at
  BEFORE UPDATE ON public.custom_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some initial data
INSERT INTO public.custom_features (name, description, price, icon, display_order) VALUES
  ('Window Cleaning', 'Interior and exterior window cleaning', 300, 'wind', 1),
  ('Carpet Shampooing', 'Deep carpet cleaning with shampoo', 500, 'layers', 2),
  ('Ceiling Fan Cleaning', 'Dust and clean all ceiling fans', 150, 'fan', 3),
  ('Wardrobe Organization', 'Organize and clean inside wardrobes', 400, 'shirt', 4),
  ('Fridge Deep Clean', 'Interior deep cleaning of refrigerator', 250, 'thermometer', 5);
