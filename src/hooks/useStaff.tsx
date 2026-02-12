import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffMember {
  user_id: string;
  is_available: boolean;
  skills: string[] | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  panchayath_assignments?: {
    panchayath_id: string;
    ward_numbers: number[];
    panchayath?: { name: string };
  }[];
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const { data: staffRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'staff');
      
      if (rolesError) throw rolesError;
      if (!staffRoles?.length) return [];

      const staffUserIds = staffRoles.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', staffUserIds);
      
      if (profilesError) throw profilesError;

      const { data: details, error: detailsError } = await supabase
        .from('staff_details')
        .select('user_id, is_available, skills')
        .in('user_id', staffUserIds);
      
      if (detailsError) throw detailsError;

      const { data: assignments, error: assignError } = await supabase
        .from('staff_panchayath_assignments')
        .select('staff_user_id, panchayath_id, ward_numbers, panchayath:panchayaths(name)')
        .in('staff_user_id', staffUserIds);
      
      if (assignError) throw assignError;

      return staffUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const detail = details?.find(d => d.user_id === userId);
        const userAssignments = assignments?.filter(a => a.staff_user_id === userId) || [];
        
        return {
          user_id: userId,
          is_available: detail?.is_available ?? true,
          skills: detail?.skills ?? null,
          profile: profile ? {
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
          } : undefined,
          panchayath_assignments: userAssignments.map(a => ({
            panchayath_id: a.panchayath_id,
            ward_numbers: a.ward_numbers,
            panchayath: a.panchayath as unknown as { name: string },
          })),
        } as StaffMember;
      });
    },
  });
}

export function useStaffByPanchayath(panchayathId: string | null) {
  return useQuery({
    queryKey: ['staff-by-panchayath', panchayathId],
    queryFn: async () => {
      if (!panchayathId) return [];
      
      const { data: assignments, error } = await supabase
        .from('staff_panchayath_assignments')
        .select('staff_user_id')
        .eq('panchayath_id', panchayathId);
      
      if (error) throw error;
      if (!assignments?.length) return [];

      const staffIds = assignments.map(a => a.staff_user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', staffIds);
      
      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!panchayathId,
  });
}

export function useAssignStaffToBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, staffUserIds }: { bookingId: string; staffUserIds: string[] }) => {
      await supabase
        .from('booking_staff_assignments')
        .delete()
        .eq('booking_id', bookingId);
      
      const inserts = staffUserIds.map(staffUserId => ({
        booking_id: bookingId,
        staff_user_id: staffUserId,
        status: 'pending',
      }));
      
      const { error } = await supabase
        .from('booking_staff_assignments')
        .insert(inserts);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
    },
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('booking_staff_assignments')
        .update({ status })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['available-jobs'] });
    },
  });
}

export function useMyJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-jobs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: assignments, error: assignError } = await supabase
        .from('booking_staff_assignments')
        .select('id, booking_id, status, assigned_at')
        .eq('staff_user_id', userId);
      
      if (assignError) throw assignError;
      if (!assignments?.length) return [];

      const bookingIds = assignments.map(a => a.booking_id);
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, package:packages(*, category:service_categories(*))`)
        .in('id', bookingIds);
      
      if (bookingsError) throw bookingsError;

      return assignments.map(assignment => {
        const booking = bookings?.find(b => b.id === assignment.booking_id);
        return {
          ...assignment,
          booking,
        };
      });
    },
    enabled: !!userId,
  });
}

// New: Fetch confirmed bookings in staff's panchayath that still need staff
export function useAvailableJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ['available-jobs', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get staff's panchayath assignments
      const { data: myPanchayaths, error: pErr } = await supabase
        .from('staff_panchayath_assignments')
        .select('panchayath_id')
        .eq('staff_user_id', userId);

      if (pErr) throw pErr;
      if (!myPanchayaths?.length) return [];

      const panchayathIds = myPanchayaths.map(p => p.panchayath_id);

      // Get confirmed bookings in those panchayaths
      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select(`*, package:packages(*, category:service_categories(*))`)
        .in('panchayath_id', panchayathIds)
        .in('status', ['confirmed'])
        .order('scheduled_date', { ascending: true });

      if (bErr) throw bErr;
      if (!bookings?.length) return [];

      // Check which ones the staff already accepted/applied for
      const bookingIds = bookings.map(b => b.id);
      const { data: existingAssignments } = await supabase
        .from('booking_staff_assignments')
        .select('booking_id, status')
        .eq('staff_user_id', userId)
        .in('booking_id', bookingIds);

      const assignedBookingIds = new Set(existingAssignments?.map(a => a.booking_id) || []);

      // Also get accepted counts for each booking
      const { data: allAssignments } = await supabase
        .from('booking_staff_assignments')
        .select('booking_id, status')
        .in('booking_id', bookingIds)
        .eq('status', 'accepted');

      const acceptedCounts: Record<string, number> = {};
      allAssignments?.forEach(a => {
        acceptedCounts[a.booking_id] = (acceptedCounts[a.booking_id] || 0) + 1;
      });

      // Filter out bookings where staff already applied or slots are full
      return bookings
        .filter(b => {
          if (assignedBookingIds.has(b.id)) return false;
          const accepted = acceptedCounts[b.id] || 0;
          const required = b.required_staff_count || 2;
          return accepted < required;
        })
        .map(b => ({
          ...b,
          accepted_count: acceptedCounts[b.id] || 0,
        }));
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30s for new jobs
  });
}

// Staff self-accept: insert into booking_staff_assignments
export function useAcceptJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, staffUserId }: { bookingId: string; staffUserId: string }) => {
      const { error } = await supabase
        .from('booking_staff_assignments')
        .insert({
          booking_id: bookingId,
          staff_user_id: staffUserId,
          status: 'accepted',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Fetch staff earnings
export function useMyEarnings(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-earnings', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('staff_earnings')
        .select('*')
        .eq('staff_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}
