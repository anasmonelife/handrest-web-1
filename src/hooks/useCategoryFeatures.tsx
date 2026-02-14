import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryFeatureMapping {
  id: string;
  category_id: string;
  custom_feature_id: string;
  created_at: string;
}

export function useCategoryFeatureMappings(categoryId?: string) {
  return useQuery<CategoryFeatureMapping[]>({
    queryKey: ['category_feature_mappings', categoryId],
    queryFn: async () => {
      let query = supabase.from('category_feature_mappings').select('*');
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CategoryFeatureMapping[];
    },
  });
}

export function useSetCategoryFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ featureId, categoryIds }: { featureId: string; categoryIds: string[] }) => {
      // Delete existing mappings for this feature
      const { error: delError } = await supabase
        .from('category_feature_mappings')
        .delete()
        .eq('custom_feature_id', featureId);
      if (delError) throw delError;

      // Insert new mappings
      if (categoryIds.length > 0) {
        const rows = categoryIds.map(cid => ({ category_id: cid, custom_feature_id: featureId }));
        const { error: insError } = await supabase
          .from('category_feature_mappings')
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category_feature_mappings'] }),
  });
}
