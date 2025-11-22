import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { alert } from '@/lib/alerts';

const normalizeStats = (post: any) => ({
  ...post,
  like_count: Number(post.like_count ?? 0),
  comment_count: Number(post.comment_count ?? 0),
  trend_score: Number(post.trend_score ?? 0),
});

const SCHEMA_MISSING_CODES = new Set([
  '42P01',
  'PGRST103',
  'PGRST104',
  'PGRST115',
  'PGRST116',
  'PGRST301',
  'PGRST302',
  'PGRST303',
  'PGRST304',
  'PGRST305',
  'PGRST306',
]);

const isInteractiveSchemaMissing = (error?: PostgrestError | null) => {
  if (!error) return false;
  if (error.code && SCHEMA_MISSING_CODES.has(error.code)) {
    return true;
  }

  const combinedMessage = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    combinedMessage.includes('forum_post_stats') ||
    combinedMessage.includes('forum_post_reactions')
  );
};

const handleReactionsError = (error?: PostgrestError | null) => {
  if (!error) return;
  if (isInteractiveSchemaMissing(error)) {
    throw new Error('ระบบถูกใจจะพร้อมใช้งานหลังจากอัปเดตฐานข้อมูลล่าสุด');
  }
  throw error;
};

const fetchProfile = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return data || undefined;
};

const fetchCounts = async (
  table: string,
  postIds: string[],
  options?: { ignoreMissing?: boolean }
) => {
  if (!postIds.length) return {} as Record<string, number>;

  const { data, error } = await supabase
    .from(table)
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    if (options?.ignoreMissing && isInteractiveSchemaMissing(error)) {
      return {} as Record<string, number>;
    }
    throw error;
  }

  return (data || []).reduce((acc, row: { post_id?: string }) => {
    if (!row?.post_id) return acc;
    acc[row.post_id] = (acc[row.post_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

const fetchLikedPostIds = async (userId?: string) => {
  if (!userId) return new Set<string>();

  const { data, error } = await supabase
    .from('forum_post_reactions')
    .select('post_id')
    .eq('user_id', userId);

  if (error) {
    if (isInteractiveSchemaMissing(error)) {
      return new Set();
    }
    throw error;
  }

  return new Set((data || []).map((item) => item.post_id));
};

const fetchIsLiked = async (postId: string, userId?: string) => {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('forum_post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isInteractiveSchemaMissing(error)) {
      return false;
    }
    throw error;
  }

  return Boolean(data);
};

const calculateFallbackTrendScore = ({
  views = 0,
  likeCount = 0,
  commentCount = 0,
}: {
  views?: number | null;
  likeCount?: number;
  commentCount?: number;
}) => {
  return likeCount * 2 + commentCount + (Number(views) || 0) * 0.2;
};

const withStatsFallback = async <T,>(primary: () => Promise<T>, fallback: () => Promise<T>) => {
  try {
    return await primary();
  } catch (error) {
    const postgrestError = error as PostgrestError;
    if (isInteractiveSchemaMissing(postgrestError)) {
      console.warn('[forum] Falling back to legacy forum_posts query because forum_post_stats is unavailable.');
      return fallback();
    }
    throw error;
  }
};

const fetchPostsFromStatsView = async (category?: string, userId?: string) => {
  let query = supabase
    .from('forum_post_stats')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('trend_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  const likedPostIds = await fetchLikedPostIds(userId);

  return Promise.all(
    (data || []).map(async (rawPost) => {
      const post = normalizeStats(rawPost);
      const profile = await fetchProfile(post.user_id);
      return {
        ...post,
        profiles: profile,
        is_liked: likedPostIds.has(post.id),
      } as ForumPost;
    })
  );
};

const fetchPostsFromBaseTable = async (category?: string, userId?: string) => {
  let query = supabase
    .from('forum_posts')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  const posts = data || [];
  const postIds = posts.map((post) => post.id);

  const [commentCounts, likeCounts, likedPostIds] = await Promise.all([
    fetchCounts('forum_comments', postIds),
    fetchCounts('forum_post_reactions', postIds, { ignoreMissing: true }),
    fetchLikedPostIds(userId),
  ]);

  return Promise.all(
    posts.map(async (post) => {
      const profile = await fetchProfile(post.user_id);
      const likeCount = likeCounts[post.id] ?? 0;
      const commentCount = commentCounts[post.id] ?? 0;

      return {
        ...post,
        like_count: likeCount,
        comment_count: commentCount,
        trend_score: calculateFallbackTrendScore({
          views: post.views,
          likeCount,
          commentCount,
        }),
        is_liked: likedPostIds.has(post.id),
        profiles: profile,
      } as ForumPost;
    })
  );
};

const fetchPostFromStatsView = async (postId: string, userId?: string) => {
  const { data, error } = await supabase
    .from('forum_post_stats')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) throw error;

  const post = normalizeStats(data);
  const [profile, isLiked] = await Promise.all([
    fetchProfile(post.user_id),
    fetchIsLiked(postId, userId),
  ]);

  return { ...post, profiles: profile, is_liked: isLiked } as ForumPost;
};

const fetchPostFromBaseTable = async (postId: string, userId?: string) => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) throw error;

  const [commentCounts, likeCounts, profile, isLiked] = await Promise.all([
    fetchCounts('forum_comments', [postId]),
    fetchCounts('forum_post_reactions', [postId], { ignoreMissing: true }),
    fetchProfile(data.user_id),
    fetchIsLiked(postId, userId),
  ]);

  const likeCount = likeCounts[postId] ?? 0;
  const commentCount = commentCounts[postId] ?? 0;

  return {
    ...data,
    like_count: likeCount,
    comment_count: commentCount,
    trend_score: calculateFallbackTrendScore({
      views: data.views,
      likeCount,
      commentCount,
    }),
    profiles: profile,
    is_liked: isLiked,
  } as ForumPost;
};

const fetchTrendingFromStatsView = async (limit: number, userId?: string) => {
  const { data, error } = await supabase
    .from('forum_post_stats')
    .select('*')
    .order('trend_score', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const likedPostIds = await fetchLikedPostIds(userId);

  return Promise.all(
    (data || []).map(async (rawPost) => {
      const post = normalizeStats(rawPost);
      const profile = await fetchProfile(post.user_id);
      return {
        ...post,
        profiles: profile,
        is_liked: likedPostIds.has(post.id),
      } as ForumPost;
    })
  );
};

const fetchTrendingFromBaseTable = async (limit: number, userId?: string) => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .order('views', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const posts = data || [];
  const postIds = posts.map((post) => post.id);

  const [commentCounts, likeCounts, likedPostIds] = await Promise.all([
    fetchCounts('forum_comments', postIds),
    fetchCounts('forum_post_reactions', postIds, { ignoreMissing: true }),
    fetchLikedPostIds(userId),
  ]);

  return Promise.all(
    posts.map(async (post) => {
      const profile = await fetchProfile(post.user_id);
      const likeCount = likeCounts[post.id] ?? 0;
      const commentCount = commentCounts[post.id] ?? 0;

      return {
        ...post,
        like_count: likeCount,
        comment_count: commentCount,
        trend_score: calculateFallbackTrendScore({
          views: post.views,
          likeCount,
          commentCount,
        }),
        is_liked: likedPostIds.has(post.id),
        profiles: profile,
      } as ForumPost;
    })
  );
};

const incrementPostViews = async (postId: string, views: number) => {
  if (!Number.isFinite(views)) return;

  await supabase
    .from('forum_posts')
    .update({ views: Math.max(0, views) + 1 })
    .eq('id', postId);
};

export interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  image_urls?: string[];
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  trend_score: number;
  is_liked?: boolean;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useForumPosts = (category?: string, options?: { userId?: string }) => {
  return useQuery({
    queryKey: ['forum-posts', category, options?.userId],
    queryFn: () =>
      withStatsFallback(
        () => fetchPostsFromStatsView(category, options?.userId),
        () => fetchPostsFromBaseTable(category, options?.userId)
      ),
  });
};

export const useForumPost = (
  postId?: string,
  options?: { skipViewIncrement?: boolean; enabled?: boolean; userId?: string }
) => {
  return useQuery({
    queryKey: ['forum-post', postId, options?.skipViewIncrement ? 'skip-view' : 'with-view', options?.userId],
    enabled: options?.enabled ?? Boolean(postId),
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');

      const post = await withStatsFallback(
        () => fetchPostFromStatsView(postId, options?.userId),
        () => fetchPostFromBaseTable(postId, options?.userId)
      );

      if (!options?.skipViewIncrement) {
        await incrementPostViews(postId, Number(post.views ?? 0));
      }

      return post;
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPost: {
      title: string;
      content: string;
      category: string;
      user_id: string;
      image_urls?: string[];
    }) => {
      const payload = {
        ...newPost,
        image_urls: newPost.image_urls ?? [],
      };
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
        alert.success('สร้างกระทู้สำเร็จ!');
    },
    onError: (error: any) => {
        alert.error('เกิดข้อผิดพลาด', {
          description: error.message,
        });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
        alert.success('ลบกระทู้สำเร็จ');
    },
    onError: (error: any) => {
        alert.error('เกิดข้อผิดพลาด', {
          description: error.message,
        });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      content: string;
      category: string;
      image_urls?: string[];
    }) => {
      const { id, ...updates } = payload;
      const { data, error } = await supabase
        .from('forum_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.id] });
        alert.success('อัปเดตกระทู้สำเร็จ');
    },
    onError: (error: any) => {
        alert.error('เกิดข้อผิดพลาด', {
          description: error.message,
        });
    },
  });
};

export const useTrendingPosts = (limit = 5, userId?: string) => {
  return useQuery({
    queryKey: ['forum-trending', limit, userId],
    queryFn: () =>
      withStatsFallback(
        () => fetchTrendingFromStatsView(limit, userId),
        () => fetchTrendingFromBaseTable(limit, userId)
      ),
  });
};

export const useTogglePostReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('forum_post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) {
          handleReactionsError(error);
        }

        return { liked: false };
      }

      const { error } = await supabase
        .from('forum_post_reactions')
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        handleReactionsError(error);
      }

      return { liked: true };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-trending'] });
    },
    onError: (error: any) => {
        alert.error('ไม่สามารถอัปเดตการกดถูกใจได้', {
          description: error.message,
        });
    },
  });
};
