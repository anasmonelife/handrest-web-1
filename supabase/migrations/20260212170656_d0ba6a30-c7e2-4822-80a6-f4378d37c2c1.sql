
-- 1. Allow staff to self-assign (accept) to confirmed bookings in their panchayath
CREATE POLICY "Staff can accept panchayath bookings"
ON public.booking_staff_assignments
FOR INSERT
WITH CHECK (
  is_staff()
  AND staff_user_id = auth.uid()
  AND booking_in_staff_panchayath(booking_id, auth.uid())
);

-- 2. Create staff_earnings table for tracking fixed earnings per completed job
CREATE TABLE public.staff_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  staff_user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, paid
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id, staff_user_id)
);

ALTER TABLE public.staff_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all earnings"
ON public.staff_earnings FOR ALL
USING (is_admin() OR is_super_admin());

CREATE POLICY "Staff can view own earnings"
ON public.staff_earnings FOR SELECT
USING (staff_user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_staff_earnings_updated_at
BEFORE UPDATE ON public.staff_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
ON public.push_subscriptions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all subscriptions"
ON public.push_subscriptions FOR SELECT
USING (is_admin() OR is_super_admin());

-- 4. Function to auto-close booking when enough staff accept
CREATE OR REPLACE FUNCTION public.check_booking_staff_filled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_accepted_count integer;
  v_required_count integer;
  v_booking_status text;
BEGIN
  -- Only trigger on acceptance
  IF NEW.status != 'accepted' THEN
    RETURN NEW;
  END IF;

  -- Get booking required staff count and current status
  SELECT required_staff_count, status INTO v_required_count, v_booking_status
  FROM bookings WHERE id = NEW.booking_id;

  -- Only process confirmed bookings
  IF v_booking_status NOT IN ('confirmed', 'assigned') THEN
    RETURN NEW;
  END IF;

  -- Count accepted staff
  SELECT COUNT(*) INTO v_accepted_count
  FROM booking_staff_assignments
  WHERE booking_id = NEW.booking_id AND status = 'accepted';

  -- If enough staff accepted, update booking status to assigned
  IF v_accepted_count >= COALESCE(v_required_count, 2) THEN
    UPDATE bookings SET status = 'assigned' WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_booking_staff_filled
AFTER INSERT OR UPDATE ON public.booking_staff_assignments
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_staff_filled();
