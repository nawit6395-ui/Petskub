-- Forum post reactions for like system
CREATE TABLE IF NOT EXISTS public.forum_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS forum_post_reactions_unique_user
  ON public.forum_post_reactions(post_id, user_id);
CREATE INDEX IF NOT EXISTS forum_post_reactions_user_idx
  ON public.forum_post_reactions(user_id);

ALTER TABLE public.forum_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post reactions"
  ON public.forum_post_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react"
  ON public.forum_post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reaction"
  ON public.forum_post_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- View with aggregated metrics for trending feed
CREATE OR REPLACE VIEW public.forum_post_stats AS
SELECT
  fp.*,
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

-- Conversations between cat owner and adopter
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id uuid NOT NULL REFERENCES public.cats(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  adopter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair
  ON public.conversations(cat_id, adopter_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = adopter_id);

CREATE POLICY "Participants can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = adopter_id);

CREATE POLICY "Participants can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = adopter_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = adopter_id);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON public.messages(conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.owner_id OR auth.uid() = c.adopter_id)
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.owner_id OR auth.uid() = c.adopter_id)
    )
  );

CREATE POLICY "Participants can delete their messages"
  ON public.messages
  FOR DELETE
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.owner_id OR auth.uid() = c.adopter_id)
    )
  );

-- Automatically keep conversation timestamps in sync
CREATE OR REPLACE FUNCTION public.refresh_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_after_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_conversation_timestamp();
