import React, { useEffect, useState } from "react";
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
          <Card className="p-4 mb-6 bg-gradient-subtle">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 font-prompt">
                <Share2 className="w-5 h-5" />
                <span className="font-semibold">แชร์บทความนี้:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="font-prompt gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="font-prompt gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("line")}
                  className="font-prompt gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
                  </svg>
                  LINE
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("copy")}
                  className="font-prompt gap-2"
                >
                  {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Article Content */}
          <Card className="p-8 mb-8">
            <div className="leading-relaxed space-y-4 font-prompt">
              {article.content.split('\n\n').map((paragraph, index) => {
                // Handle headings
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('#### ')) {
                  return <h4 key={index} className="text-lg font-bold mt-4 mb-2">{paragraph.replace('#### ', '')}</h4>;
                }
                
                // Handle links in text
                const parts = paragraph.split(/(\[.*?\]\(.*?\))/g);
                const content = parts.map((part, i) => {
                  const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                  if (linkMatch) {
                    return (
                      <a
                        key={i}
                        href={linkMatch[2]}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {linkMatch[1]}
                      </a>
                    );
                  }
                  return part;
                });
                
                return <p key={index} className="mb-4">{content}</p>;
              })}
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
