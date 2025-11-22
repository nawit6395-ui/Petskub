import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { alert } from '@/lib/alerts';

export interface Article {
  id: string;
  slug?: string | null;
  title: string;
  meta_title?: string;
  meta_description?: string;
  content: string;
  category: string;
  image_url?: string;
  image_alt?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  keywords?: string[];
  author_id: string;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export const useArticle = (id: string | undefined) => {
  return useQuery({
    queryKey: ['knowledge_article', id],
    queryFn: async () => {
      if (!id) throw new Error('Article ID is required');
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;
      return data as Article;
    },
    enabled: !!id,
  });
};

export const useArticles = () => {
  return useQuery({
    queryKey: ['knowledge_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'views'>) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert(article)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_articles'] });
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...article }: { id: string } & Partial<Article>) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update(article)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Article;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge_article', variables.id] });
    },
    onError: (error: any) => {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message,
      });
    },
  });
};
