import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { alert } from '@/lib/alerts';

interface ProfileData {
  full_name?: string;
  phone?: string;
  line_id?: string;
  province?: string;
  district?: string;
  avatar_url?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (profileData: ProfileData) => {
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      alert.success('อัปเดตโปรไฟล์สำเร็จ');
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cat-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cat-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      alert.success('อัปโหลดรูปโปรไฟล์สำเร็จ');
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
    uploadAvatar,
  };
};
