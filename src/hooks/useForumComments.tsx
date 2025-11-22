import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { alert } from '@/lib/alerts';

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useForumComments = (postId: string) => {
  return useQuery({
    queryKey: ['forum-comments', postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          return { ...comment, profiles: profile || undefined };
        })
      );

      return commentsWithProfiles as ForumComment[];
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newComment: {
      post_id: string;
      content: string;
      user_id: string;
    }) => {
      const { data, error } = await supabase
        .from('forum_comments')
        .insert([newComment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-comments', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-trending'] });
      alert.success('แสดงความคิดเห็นสำเร็จ!');
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message,
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['forum-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-trending'] });
      alert.success('ลบความคิดเห็นสำเร็จ');
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message,
      });
    },
  });
};
