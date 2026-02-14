
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages
FOR ALL USING (is_admin() OR is_super_admin());
