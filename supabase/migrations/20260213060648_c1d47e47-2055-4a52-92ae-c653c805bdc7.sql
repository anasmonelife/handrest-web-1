
-- Fix booking_staff_assignments admin policy to include super_admin
DROP POLICY "Admins can manage assignments" ON public.booking_staff_assignments;

CREATE POLICY "Admins can manage assignments"
ON public.booking_staff_assignments FOR ALL
TO authenticated
USING (is_admin() OR is_super_admin())
WITH CHECK (is_admin() OR is_super_admin());
