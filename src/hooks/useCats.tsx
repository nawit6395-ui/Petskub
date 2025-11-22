import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cat {
  id: string;
  name: string;
  age: string;
  gender: 'ชาย' | 'หญิง' | 'ไม่ระบุ';
  province: string;
  district?: string;
  image_url?: string[];
  story?: string;
  health_status?: string;
  is_sterilized: boolean;
  is_adopted: boolean;
  is_urgent: boolean;
  contact_name: string;
  contact_phone: string;
  contact_line?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCats = () => {
  return useQuery({
    queryKey: ['cats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Cat[];
    },
    staleTime: 1000 * 60 * 5,
    select: (data) => data ?? [],
    placeholderData: (prev) => prev,
  });
};

export const useCreateCat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cat: Omit<Cat, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cats')
        .insert(cat)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats'] });
      toast.success('เพิ่มข้อมูลสัตว์เลี้ยงสำเร็จ');
    },
    onError: (error: any) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};

export const useUpdateCat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cat> & { id: string }) => {
      const { data, error } = await supabase
        .from('cats')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats'] });
      toast.success('อัพเดทข้อมูลสำเร็จ');
    },
    onError: (error: any) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};
