-- Allow forum posts to reference uploaded Supabase Storage images
ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.forum_posts.image_urls IS 'Public Supabase Storage URLs for images attached to the post';

DROP VIEW IF EXISTS public.forum_post_stats;

CREATE VIEW public.forum_post_stats AS
SELECT
  fp.id,
  fp.user_id,
  fp.title,
  fp.content,
  fp.category,
  fp.views,
  fp.is_pinned,
  fp.is_locked,
  fp.created_at,
  fp.updated_at,
  fp.image_urls,
  COALESCE(like_totals.like_count, 0) AS like_count,
  COALESCE(comment_totals.comment_count, 0) AS comment_count,
  (
    COALESCE(like_totals.like_count, 0) * 3
    + COALESCE(comment_totals.comment_count, 0)
    + fp.views * 0.3
  )
  /
  POWER(
    GREATEST(EXTRACT(EPOCH FROM (now() - fp.created_at)) / 3600, 1) + 2,
    1.5
  ) AS trend_score
FROM public.forum_posts fp
LEFT JOIN (
  SELECT post_id, COUNT(*) AS like_count
  FROM public.forum_post_reactions
  GROUP BY post_id
) AS like_totals ON like_totals.post_id = fp.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM public.forum_comments
  GROUP BY post_id
) AS comment_totals ON comment_totals.post_id = fp.id;

COMMENT ON VIEW public.forum_post_stats IS 'Forum posts enriched with like/comment counts and trend_score for feed ordering';
