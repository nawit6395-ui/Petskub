-- Add slug column for SEO friendly article URLs
ALTER TABLE knowledge_articles
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Ensure slug values are unique when provided
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_articles_slug_unique_idx
ON knowledge_articles (slug)
WHERE slug IS NOT NULL;

COMMENT ON COLUMN knowledge_articles.slug IS 'SEO-friendly unique slug used for article URLs';
