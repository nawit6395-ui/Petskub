import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Report {
  id: string;
  province: string;
  district: string;
  location: string;
  description?: string;
  photo_urls?: string[];
  latitude: number | null;
  longitude: number | null;
  cat_count: number;
  status: 'pending' | 'in_progress' | 'resolved';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('ส่งรายงานสำเร็จ!', {
        description: 'ขอบคุณที่ช่วยแจ้งจุดพบสัตว์จร'
      });
    },
    onError: (error: any) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};
