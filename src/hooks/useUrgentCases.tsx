import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UrgentCase {
  id: string;
  title: string;
  description: string;
  location: string;
  province: string;
  image_url?: string[];
  contact_name: string;
  contact_phone: string;
  contact_line?: string;
  case_type: 'injured' | 'sick' | 'kitten' | 'other';
  is_resolved: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useUrgentCases = (options?: { includeResolved?: boolean }) => {
  const includeResolved = options?.includeResolved ?? false;

  return useQuery({
    queryKey: ['urgent_cases', includeResolved ? 'all' : 'active'],
    queryFn: async () => {
      const query = supabase
        .from('urgent_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeResolved) {
        query.eq('is_resolved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UrgentCase[];
    },
    staleTime: 1000 * 60,
    select: (data) => data ?? [],
    placeholderData: (prev) => prev,
  });
};

export const useCreateUrgentCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urgentCase: Omit<UrgentCase, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('urgent_cases')
        .insert(urgentCase)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent_cases'] });
      toast.success('แจ้งกรณีฉุกเฉินสำเร็จ');
    },
    onError: (error: any) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};

export const useUpdateUrgentCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UrgentCase> & { id: string }) => {
      const { data, error } = await supabase
        .from('urgent_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent_cases'] });
      toast.success('อัพเดทสำเร็จ');
    },
    onError: (error: any) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};
