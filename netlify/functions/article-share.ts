import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const siteFromEnv = (process.env.VITE_SITE_URL || process.env.URL || "").replace(/\/$/, "");
const fallbackSite = "https://baanpets.netlify.app";

const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Missing article id",
    };
  }

  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("id, slug, title, meta_title, meta_description, og_title, og_description, og_image, image_url, image_alt")
    .eq("id", id)
    .eq("published", true)
    .single();

  const siteUrl = (siteFromEnv || fallbackSite).replace(/\/$/, "");
  const articlePath = data?.slug ? `/knowledge/${data.slug}` : `/knowledge/${encodeURIComponent(id)}`;
  const articleUrl = `${siteUrl}${articlePath}`;

  if (error || !data) {
    const html = generateHtml({
      title: "Petskub - บทความ",
      description:
        "อ่านบทความจากชุมชนคนรักแมว Petskub รวมเทคนิคและความรู้ในการดูแลน้องแมว",
      image:
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80",
      articleUrl,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
      body: html,
    };
  }

  const shareTitle = data.og_title || data.meta_title || data.title || "Petskub - บทความ";
  const shareDescription =
    data.og_description ||
    data.meta_description ||
    "สำรวจบทความแมวจากชุมชน Petskub ช่วยกันดูแลน้องแมวให้มีชีวิตที่ดีขึ้น";
  const shareImage =
    data.og_image ||
    data.image_url ||
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80";

  const html = generateHtml({
    title: shareTitle,
    description: shareDescription,
    image: shareImage,
    imageAlt: data.image_alt || shareTitle || "Petskub Article",
    articleUrl,
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=1200",
    },
    body: html,
  };
};

interface HtmlOptions {
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  articleUrl: string;
}

const generateHtml = ({ title, description, image, imageAlt, articleUrl }: HtmlOptions) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeArticleUrl = escapeHtml(articleUrl);
  const safeImageAlt = escapeHtml(imageAlt || title);

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <link rel="canonical" href="${safeArticleUrl}" />
    <meta name="description" content="${safeDescription}" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:alt" content="${safeImageAlt}" />
    <meta property="og:url" content="${safeArticleUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />

    <meta http-equiv="refresh" content="0; url=${safeArticleUrl}" />
    <script>
      window.location.replace("${safeArticleUrl}");
    </script>
    <style>
      body {
        font-family: 'Prompt', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f7f5ff;
        color: #2d2a44;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        text-align: center;
      }
      a {
        color: #6c5ce7;
      }
    </style>
  </head>
  <body>
    <div>
      <h1>${safeTitle}</h1>
      <p>กำลังพาคุณไปยังบทความ...</p>
      <p><a href="${safeArticleUrl}">คลิกที่นี่หากไม่ได้ถูกนำทางอัตโนมัติ</a></p>
    </div>
  </body>
</html>`;
};

export { handler };
