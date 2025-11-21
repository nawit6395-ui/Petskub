import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, Share2, Facebook, Twitter, Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import type { Article } from "@/hooks/useArticles";

type ContentBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "divider" };

const trimHeadingLabel = (text: string) => text.replace(/^H[1-6]:\s*/i, "").trim();

const parseArticleContent = (rawContent?: string): ContentBlock[] => {
  if (!rawContent) return [];

  const lines = rawContent.split("\n");
  const blocks: ContentBlock[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (currentList && currentList.items.length) {
      blocks.push({ type: "list", ordered: currentList.ordered, items: [...currentList.items] });
    }
    currentList = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const markdownHeading = trimmed.match(/^(#{2,4})\s+(.*)$/);
    if (markdownHeading) {
      flushList();
      const level = markdownHeading[1].length as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: markdownHeading[2].trim() });
      return;
    }

    const semanticHeading = trimmed.match(/^H([2-4]):\s*(.*)$/i);
    if (semanticHeading) {
      flushList();
      const level = Math.min(4, Math.max(2, Number(semanticHeading[1]))) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: trimHeadingLabel(trimmed) });
      return;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s*/, "").trim() });
      return;
    }

    const unorderedMatch = trimmed.match(/^[-•]\s+(.*)$/);
    if (unorderedMatch) {
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(unorderedMatch[1].trim());
      return;
    }

    const orderedMatch = trimmed.match(/^(\d+)[\.)]\s+(.*)$/);
    if (orderedMatch) {
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(orderedMatch[2].trim());
      return;
    }

    if (trimmed === "---") {
      flushList();
      blocks.push({ type: "divider" });
      return;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  });

  flushList();
  return blocks;
};

const renderInlineText = (paragraph: string, keyPrefix: string) => {
  const parts = paragraph.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-strong-${index}`} className="text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${keyPrefix}-em-${index}`} className="text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }

    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a
          key={`${keyPrefix}-link-${index}`}
          href={linkMatch[2]}
          className="font-semibold text-emerald-600 underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
  });
};

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Fetch single article
  const { data: article, isLoading } = useQuery({
    queryKey: ["knowledge_article", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (error) throw error;
      return data as Article;
    },
    enabled: !!id,
  });

  // Increment view count only once when article loads
  useEffect(() => {
    if (!article || !id) return;
    
    let mounted = true;
    
    const incrementViews = async () => {
      try {
        const { error } = await supabase
          .from("knowledge_articles")
          .update({ views: article.views + 1 })
          .eq("id", id);
        
        if (error && mounted) {
          console.error("Error incrementing views:", error);
        }
      } catch (err) {
        console.error("Error incrementing views:", err);
      }
    };

    incrementViews();
    
    return () => {
      mounted = false;
    };
  }, [article?.id]); // Only run when article ID changes

  // Fetch related articles
  const { data: relatedArticles } = useQuery({
    queryKey: ["related_articles", article?.category],
    queryFn: async () => {
      if (!article) return [];
      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("published", true)
        .eq("category", article.category)
        .neq("id", article.id)
        .limit(3);

      if (error) throw error;
      return data as Article[];
    },
    enabled: !!article,
  });

  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const currentLocation = typeof window !== "undefined" ? window.location.href : "";
  const articleId = article?.id || id;
  const shareTargetUrl = articleId && shareOrigin
    ? `${shareOrigin}/share/article?id=${encodeURIComponent(articleId)}`
    : currentLocation;
  const shareTitle = article?.title || "";

  const contentBlocks = useMemo(() => parseArticleContent(article?.content), [article?.content]);
  const firstParagraphIndex = contentBlocks.findIndex((block) => block.type === "paragraph");

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareTargetUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank");
        break;
      case "line":
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(shareTargetUrl);
        setCopied(true);
        toast.success("คัดลอกลิงก์แล้ว");
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-center text-muted-foreground font-prompt">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4 font-prompt">ไม่พบบทความ</h1>
          <Button onClick={() => navigate("/knowledge")} className="font-prompt">
            กลับไปหน้าความรู้
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 font-prompt text-sm">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">หน้าแรก</Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/knowledge" className="hover:text-foreground">ความรู้</Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{article.title}</li>
          </ol>
        </nav>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/knowledge")}
          className="mb-4 font-prompt"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปหน้าความรู้
        </Button>

        {/* Article Header */}
        <article className="mb-8">
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="font-prompt">
                {article.category}
              </Badge>
              <span className="text-sm text-muted-foreground font-prompt flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views} ครั้ง
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 font-prompt">{article.title}</h1>
            
            {article.meta_description && (
              <p className="text-lg text-muted-foreground font-prompt">
                {article.meta_description}
              </p>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="font-prompt">
                    #{keyword}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.image_alt || article.title}
              className="w-full rounded-lg mb-6 object-cover max-h-[500px]"
            />
          )}

          {/* Share Buttons */}
          <Card className="mb-6 border border-emerald-100 bg-white/90 p-0 shadow-none">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-gradient-to-r from-white via-emerald-50/60 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 font-prompt text-slate-800">
                <span className="rounded-2xl bg-white p-3 text-emerald-500 shadow-inner shadow-white">
                  <Share2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">แชร์บทความนี้</p>
                  <p className="text-lg font-semibold">ชวนเพื่อนช่วยเหลือแมวและสุนัขด้วยกัน</p>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="group h-11 gap-2 rounded-full border border-blue-100 bg-blue-50/30 font-prompt text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2] transition group-hover:text-[#0c60c7]" />
                  Facebook
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="group h-11 gap-2 rounded-full border border-sky-100 bg-sky-50/40 font-prompt text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2] transition group-hover:text-[#0d8ad4]" />
                  Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("line")}
                  className="group h-11 gap-2 rounded-full border border-emerald-100 bg-emerald-50/40 font-prompt text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <svg className="h-4 w-4 text-[#00B900] transition group-hover:text-emerald-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINE
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("copy")}
                  className="group h-11 gap-2 rounded-full border border-slate-200 bg-white font-prompt text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-white"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500 transition group-hover:text-emerald-500" />
                  )}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Article Content */}
          <Card className="mb-8 border-0 bg-white p-0 shadow-none">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white via-white to-emerald-50/40 p-8 shadow-card">
              <div className="space-y-6 font-prompt text-slate-700">
                {contentBlocks.map((block, index) => {
                  if (block.type === "heading") {
                    const baseClass =
                      block.level === 2
                        ? "text-3xl"
                        : block.level === 3
                        ? "text-2xl"
                        : "text-xl";
                    return (
                      <h2
                        key={`heading-${index}`}
                        className={`${baseClass} scroll-mt-24 border-l-4 border-emerald-200 pl-4 font-semibold text-slate-900`}
                      >
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "paragraph") {
                    const dropCap = index === firstParagraphIndex;
                    return (
                      <p
                        key={`paragraph-${index}`}
                        className={`text-lg leading-8 text-slate-700 ${dropCap ? "first-letter:float-left first-letter:mr-3 first-letter:text-5xl first-letter:font-bold first-letter:text-emerald-500" : ""}`}
                      >
                        {renderInlineText(block.text, `paragraph-${index}`)}
                      </p>
                    );
                  }

                  if (block.type === "list") {
                    const ListTag = block.ordered ? "ol" : "ul";
                    return (
                      <ListTag
                        key={`list-${index}`}
                        className={`space-y-2 ${block.ordered ? "list-decimal" : "list-disc"} pl-6 text-lg text-slate-700`}
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`list-${index}-${itemIndex}`} className="marker:text-emerald-500">
                            {renderInlineText(item, `list-${index}-${itemIndex}`)}
                          </li>
                        ))}
                      </ListTag>
                    );
                  }

                  if (block.type === "quote") {
                    return (
                      <blockquote
                        key={`quote-${index}`}
                        className="rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-lg italic text-slate-600 shadow-inner"
                      >
                        <span className="text-3xl text-emerald-400">“</span>
                        {renderInlineText(block.text, `quote-${index}`)}
                        <span className="text-3xl text-emerald-400">”</span>
                      </blockquote>
                    );
                  }

                  if (block.type === "divider") {
                    return <Separator key={`divider-${index}`} className="my-8" />;
                  }

                  return null;
                })}
              </div>
            </div>
          </Card>
        </article>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section>
            <Separator className="mb-6" />
            <h2 className="text-2xl font-bold mb-6 font-prompt">บทความที่เกี่ยวข้อง</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((relatedArticle) => (
                <Card
                  key={relatedArticle.id}
                  className="overflow-hidden shadow-card hover:shadow-hover transition-all cursor-pointer"
                  onClick={() => navigate(`/knowledge/${relatedArticle.id}`)}
                >
                  {relatedArticle.image_url && (
                    <img
                      src={relatedArticle.image_url}
                      alt={relatedArticle.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <Badge variant="secondary" className="font-prompt mb-2">
                      {relatedArticle.category}
                    </Badge>
                    <h3 className="font-semibold text-sm mb-2 font-prompt line-clamp-2">
                      {relatedArticle.title}
                    </h3>
                    <span className="text-xs text-muted-foreground font-prompt flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {relatedArticle.views} ครั้ง
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
