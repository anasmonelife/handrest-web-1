import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Package } from '@/types/database';

export interface PackageFormData {
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number;
  min_staff: number;
  max_sqft: number | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  is_featured: boolean;
  discount_amount: number;
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PackageFormData) => {
      const { data: pkg, error } = await supabase
        .from('packages')
        .insert(data)
        .select('*, category:service_categories(*)')
        .single();
      if (error) throw error;
      return pkg as Package;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PackageFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select('*, category:service_categories(*)')
        .single();
      if (error) throw error;
      return data as Package;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}
