import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArticle, useCreateArticle, useUpdateArticle } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { alert } from "@/lib/alerts";

// SEO-optimized validation schema
const articleSchema = z.object({
  title: z.string()
    .min(10, "หัวข้อควรมีอย่างน้อย 10 ตัวอักษร")
    .max(60, "หัวข้อไม่ควรเกิน 60 ตัวอักษรเพื่อ SEO")
    .trim(),
  meta_title: z.string()
    .min(10, "Meta Title ควรมีอย่างน้อย 10 ตัวอักษร")
    .max(60, "Meta Title ไม่ควรเกิน 60 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
  meta_description: z.string()
    .min(50, "Meta Description ควรมีอย่างน้อย 50 ตัวอักษร")
    .max(160, "Meta Description ไม่ควรเกิน 160 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
  keywords: z.string()
    .optional()
    .or(z.literal("")),
  slug: z.string()
    .trim()
    .min(5, "URL ควรมีอย่างน้อย 5 ตัวอักษร")
    .max(80, "URL ไม่ควรเกิน 80 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/i, "ใช้เฉพาะตัวอักษร a-z ตัวเลข และขีดกลาง (-)")
    .transform((value) => value.toLowerCase()),
  content: z.string()
    .min(100, "เนื้อหาควรมีอย่างน้อย 100 ตัวอักษร")
    .max(10000, "เนื้อหาไม่ควรเกิน 10,000 ตัวอักษร")
    .trim(),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  image_url: z.string().url("กรุณาใส่ URL รูปภาพที่ถูกต้อง").optional().or(z.literal("")),
  image_alt: z.string()
    .min(10, "Alt text ควรมีอย่างน้อย 10 ตัวอักษร")
    .max(125, "Alt text ไม่ควรเกิน 125 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
  og_title: z.string()
    .max(60, "OG Title ไม่ควรเกิน 60 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
  og_description: z.string()
    .max(160, "OG Description ไม่ควรเกิน 160 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
  og_image: z.string()
    .url("กรุณาใส่ URL รูปภาพที่ถูกต้อง")
    .optional()
    .or(z.literal("")),
});

const slugifyValue = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const fallbackSiteUrl = "https://petskub.vercel.app";

type ArticleFormData = z.infer<typeof articleSchema>;

const CreateArticle = () => {
  const navigate = useNavigate();
  const { id: articleId } = useParams<{ id?: string }>();
  const isEditing = Boolean(articleId);
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const { data: articleToEdit, isLoading: isLoadingArticle } = useArticle(articleId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
  });

  const selectedCategory = watch("category");
  const titleValue = watch("title") || "";
  const metaTitleValue = watch("meta_title") || "";
  const metaDescriptionValue = watch("meta_description") || "";
  const imageAltValue = watch("image_alt") || "";
  const contentValue = watch("content") || "";
  const slugValue = watch("slug") || "";
  const contentWordCount = contentValue.trim()
    ? contentValue
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  const siteBaseUrl = (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : fallbackSiteUrl)
  ).replace(/\/$/, "");
  const slugPreview = slugValue
    ? `${siteBaseUrl}/knowledge/${slugValue}`
    : `${siteBaseUrl}/knowledge/ชื่อ-url`;

  useEffect(() => {
    if (isEditing && articleToEdit) {
      setValue("title", articleToEdit.title || "");
      setValue("meta_title", articleToEdit.meta_title || "");
      setValue("meta_description", articleToEdit.meta_description || "");
      setValue("keywords", articleToEdit.keywords?.join(", ") || "");
      setValue("slug", articleToEdit.slug || "");
      setValue("content", articleToEdit.content || "");
      setValue("category", articleToEdit.category || "");
      setValue("image_url", articleToEdit.image_url || "");
      setValue("image_alt", articleToEdit.image_alt || "");
      setValue("og_title", articleToEdit.og_title || "");
      setValue("og_description", articleToEdit.og_description || "");
      setValue("og_image", articleToEdit.og_image || "");
    }
  }, [isEditing, articleToEdit, setValue]);

  const handleSlugFromTitle = () => {
    const generatedSlug = slugifyValue(titleValue);
    if (!generatedSlug) {
      alert.error("กรุณากรอกหัวข้อบทความเพื่อสร้าง URL");
      return;
    }
    setValue("slug", generatedSlug, { shouldValidate: true, shouldDirty: true });
  };

  // Redirect if not admin
  if (!isAdmin) {
    navigate("/knowledge");
    alert.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    return null;
  }

  if (isEditing && isLoadingArticle) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-muted-foreground font-prompt">กำลังโหลดข้อมูลบทความ...</p>
        </div>
      </div>
    );
  }

  if (isEditing && !isLoadingArticle && !articleToEdit) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-muted-foreground font-prompt">ไม่พบบทความที่ต้องการแก้ไข</p>
          <Button onClick={() => navigate("/knowledge")} className="mt-4 font-prompt">
            กลับหน้าความรู้
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ArticleFormData) => {
    if (!user) {
      alert.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    setIsSubmitting(true);
    try {
      const keywordsArray = data.keywords 
        ? data.keywords.split(",").map((k) => k.trim()).filter((k) => k.length > 0)
        : undefined;

      const sharedPayload = {
        title: data.title,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        keywords: keywordsArray,
        slug: data.slug,
        content: data.content,
        category: data.category,
        image_url: data.image_url || undefined,
        image_alt: data.image_alt || undefined,
        og_title: data.og_title || undefined,
        og_description: data.og_description || undefined,
        og_image: data.og_image || undefined,
      };

      if (isEditing && articleId) {
        await updateArticle.mutateAsync({ id: articleId, ...sharedPayload });
        alert.success("อัปเดตบทความสำเร็จ");
      } else {
        await createArticle.mutateAsync({
          ...sharedPayload,
          author_id: user.id,
          published: true,
        });
        alert.success("สร้างบทความสำเร็จ");
      }

      navigate("/knowledge");
    } catch (error) {
      alert.error("เกิดข้อผิดพลาดในการบันทึกบทความ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["การดูแล", "สุขภาพ", "รับเลี้ยง", "โภชนาการ", "พฤติกรรม"];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header with SEO best practices */}
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/knowledge")}
            className="mb-4 font-prompt"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้าความรู้
          </Button>
          <h1 className="text-4xl font-bold mb-2 font-prompt">
            {isEditing ? "แก้ไขบทความ" : "สร้างบทความใหม่ 📝"}
          </h1>
          <p className="text-muted-foreground font-prompt">
            {isEditing ? "ปรับปรุงข้อมูลบทความให้ทันสมัย" : "แบ่งปันความรู้เกี่ยวกับการดูแลแมวให้กับชุมชน"}
          </p>
        </header>

        {/* Main content with semantic HTML */}
        <Card className="p-6 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Title - H1 Tag */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title" className="font-prompt text-base">
                  หัวข้อบทความ (H1) <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">
                  {titleValue.length}/60
                </span>
              </div>
              <Input
                id="title"
                placeholder="หัวข้อควรชัดเจนและมีคำสำคัญ (10-60 ตัวอักษร)"
                className="font-prompt"
                {...register("title")}
                aria-describedby="title-help"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.title.message}
                </p>
              )}
              <p id="title-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                💡 หัวข้อนี้จะเป็น H1 ของบทความ ควรมีคำสำคัญและยาว 10-60 ตัวอักษร
              </p>
            </div>

            {/* Meta Title - SEO Critical */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="meta_title" className="font-prompt text-base">
                  Meta Title
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">
                  {metaTitleValue.length}/60
                </span>
              </div>
              <Input
                id="meta_title"
                placeholder="ชื่อที่จะแสดงในผลการค้นหา Google (50-60 ตัวอักษร)"
                className="font-prompt"
                {...register("meta_title")}
                aria-describedby="meta-title-help"
              />
              {errors.meta_title && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.meta_title.message}
                </p>
              )}
              <p id="meta-title-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                🔍 จะแสดงในผลการค้นหา Google ควรมีคำค้นหาสำคัญและน่าสนใจ
              </p>
            </div>

            {/* Meta Description - SEO Critical */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="meta_description" className="font-prompt text-base">
                  Meta Description
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">
                  {metaDescriptionValue.length}/160
                </span>
              </div>
              <Textarea
                id="meta_description"
                placeholder="คำอธิบายสั้นๆ ที่จะแสดงใน Google (150-160 ตัวอักษร)"
                className="font-prompt min-h-[80px]"
                {...register("meta_description")}
                aria-describedby="meta-desc-help"
              />
              {errors.meta_description && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.meta_description.message}
                </p>
              )}
              <p id="meta-desc-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                📝 คำอธิบายที่แสดงใน Google ควรสรุปเนื้อหาและมีคำค้นหาสำคัญ
              </p>
            </div>

            {/* SEO Keywords */}
            <div className="mb-6">
              <Label htmlFor="keywords" className="font-prompt text-base mb-2 block">
                🔑 SEO Keywords (คำค้นหาสำคัญ)
              </Label>
              <Input
                id="keywords"
                placeholder="แมว, การดูแลแมว, อาหารแมว, สุขภาพแมว (คั่นด้วยเครื่องหมายจุลภาค)"
                className="font-prompt"
                {...register("keywords")}
                aria-describedby="keywords-help"
              />
              {errors.keywords && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.keywords.message}
                </p>
              )}
              <p id="keywords-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                💡 ใส่คำค้นหาสำคัญ 3-5 คำ คั่นด้วยเครื่องหมายจุลภาค (,) เช่น "แมว, การดูแลแมว, อาหารแมว"
              </p>
            </div>

            {/* Category */}
            <div className="mb-6">
              <Label htmlFor="category" className="font-prompt text-base mb-2 block">
                หมวดหมู่ <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("category", value)} value={selectedCategory}>
                <SelectTrigger id="category" className="font-prompt" aria-label="เลือกหมวดหมู่">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-prompt">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Article URL / Slug */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="slug" className="font-prompt text-base">
                  URL บทความ (ห้ามซ้ำ) <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">{slugValue.length}/80</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  id="slug"
                  placeholder="care-guide-for-rescue-cats"
                  className="font-prompt md:flex-1"
                  {...register("slug")}
                  aria-describedby="slug-help"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSlugFromTitle}
                  className="font-prompt md:w-auto"
                >
                  สร้างจากหัวข้อ
                </Button>
              </div>
              {errors.slug && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.slug.message}
                </p>
              )}
              <p id="slug-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                URL ตัวอย่าง: <span className="text-foreground">{slugPreview}</span>
              </p>
            </div>

            {/* Image URL */}
            <div className="mb-6">
              <Label htmlFor="image_url" className="font-prompt text-base mb-2 block">
                URL รูปภาพ (ถ้ามี)
              </Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                className="font-prompt"
                {...register("image_url")}
                aria-describedby="image-help"
              />
              {errors.image_url && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.image_url.message}
                </p>
              )}
              <p id="image-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                💡 รูปภาพควรมีคุณภาพสูงและเกี่ยวข้องกับเนื้อหา
              </p>
            </div>

            {/* Image Alt Text - SEO Critical */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="image_alt" className="font-prompt text-base">
                  Alt Text รูปภาพ
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">
                  {imageAltValue.length}/125
                </span>
              </div>
              <Input
                id="image_alt"
                placeholder="คำอธิบายรูปภาพสำหรับ SEO และการเข้าถึง (10-125 ตัวอักษร)"
                className="font-prompt"
                {...register("image_alt")}
                aria-describedby="alt-help"
              />
              {errors.image_alt && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.image_alt.message}
                </p>
              )}
              <p id="alt-help" className="text-xs text-muted-foreground mt-1 font-prompt">
                ♿ Alt text ช่วยให้ผู้พิการทางสายตาเข้าถึงเนื้อหา และช่วย SEO ของบทความ
              </p>
            </div>

            {/* Content - Main SEO content */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content" className="font-prompt text-base">
                  เนื้อหาบทความ <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground font-prompt">
                  {contentWordCount} คำ · {contentValue.length}/10000 ตัวอักษร
                </span>
              </div>
              <Textarea
                id="content"
                placeholder="เขียนเนื้อหาที่มีคุณค่าและมีรายละเอียดครบถ้วน (อย่างน้อย 100 ตัวอักษร)"
                className="font-prompt min-h-[300px]"
                {...register("content")}
                aria-describedby="content-help"
                aria-invalid={!!errors.content}
              />
              {errors.content && (
                <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                  {errors.content.message}
                </p>
              )}
              <Card className="mt-2 p-3 bg-primary/5 border-primary/20">
                <div id="content-help" className="text-xs font-prompt space-y-2">
                  <div className="font-semibold text-base mb-2">📝 คู่มือโครงสร้างเนื้อหา SEO</div>
                  
                  <div className="space-y-1">
                    <div><strong>🏗️ โครงสร้างหัวข้อ (Markdown):</strong></div>
                    <div className="pl-4 space-y-0.5">
                      • <code className="bg-muted px-1 rounded">## หัวข้อหลัก (H2)</code> - แบ่งส่วนใหญ่ๆ<br/>
                      • <code className="bg-muted px-1 rounded">### หัวข้อย่อย (H3)</code> - รายละเอียดภายใต้ H2<br/>
                      • <code className="bg-muted px-1 rounded">#### หัวข้อย่อยย่อย (H4)</code> - รายละเอียดเพิ่มเติม
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div><strong>🔗 การใส่ลิงก์ (Internal/External):</strong></div>
                    <div className="pl-4 space-y-0.5">
                      • <code className="bg-muted px-1 rounded">[ข้อความ](URL)</code> - สำหรับลิงก์<br/>
                      • Internal: ลิงก์ไปบทความอื่นๆ ในเว็บ (ช่วย SEO มาก)<br/>
                      • External: อ้างอิงแหล่งข้อมูลน่าเชื่อถือ
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div><strong>✍️ เทคนิคเขียนที่ดี:</strong></div>
                    <div className="pl-4">
                      • ย่อหน้าสั้นๆ 2-4 ประโยค<br/>
                      • ใช้ bullet points สำหรับรายการ<br/>
                      • ใส่คำค้นหาสำคัญตามธรรมชาติ
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* SEO Team Checklist */}
            <Card className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 border border-orange-200 dark:border-orange-900">
              <h3 className="font-semibold mb-2 font-prompt">ผู้เช็คลิสต์ของทีม SEO</h3>
              <p className="text-sm text-muted-foreground mb-4 font-prompt">
                ทีมจะตรวจตามหลัก E-E-A-T เพื่อให้บทความมีความน่าเชื่อถือ อ่านง่าย และได้อันดับที่ดีบน Google
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-prompt">
                <div>
                  <div className="font-semibold mb-2">E-E-A-T Framework</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>E (Experience): แชร์ประสบการณ์หรือเคสจริง</li>
                    <li>E (Expertise): อ้างอิงผู้เชี่ยวชาญหรือแหล่งข้อมูล</li>
                    <li>A (Authoritativeness): ใส่ข้อมูลที่ตรวจสอบได้และลิงก์อ้างอิง</li>
                    <li>T (Trustworthiness): ข้อมูลต้องถูกต้องและอัปเดต</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-2">รายการตรวจสอบเพิ่มเติม</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>มี H2 อย่างน้อย 3 หัวข้อ และ H3 รองรับ</li>
                    <li>Meta Description 150-160 ตัวอักษร</li>
                    <li>มี Internal และ External links</li>
                    <li>Alt Text ครบทุกภาพสำคัญ</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Open Graph Tags Section */}
            <div className="mb-6">
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 font-prompt flex items-center gap-2 text-base">
                  📱 Social Media Preview (OG Tags)
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-prompt">
                  กำหนดรูปแบบการแสดงผลเมื่อแชร์บน Facebook, Twitter, LINE ฯลฯ (ถ้าไม่ระบุจะใช้ค่า Meta Tags ด้านบน)
                </p>

                <div className="space-y-4">
                  {/* OG Title */}
                  <div>
                    <Label htmlFor="og_title" className="font-prompt text-sm mb-2 block">
                      OG Title (ชื่อเมื่อแชร์)
                    </Label>
                    <Input
                      id="og_title"
                      placeholder="ใช้ Meta Title โดยอัตโนมัติถ้าไม่ระบุ"
                      className="font-prompt"
                      {...register("og_title")}
                    />
                    {errors.og_title && (
                      <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                        {errors.og_title.message}
                      </p>
                    )}
                  </div>

                  {/* OG Description */}
                  <div>
                    <Label htmlFor="og_description" className="font-prompt text-sm mb-2 block">
                      OG Description (คำอธิบายเมื่อแชร์)
                    </Label>
                    <Textarea
                      id="og_description"
                      placeholder="ใช้ Meta Description โดยอัตโนมัติถ้าไม่ระบุ"
                      className="font-prompt min-h-[60px]"
                      {...register("og_description")}
                    />
                    {errors.og_description && (
                      <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                        {errors.og_description.message}
                      </p>
                    )}
                  </div>

                  {/* OG Image */}
                  <div>
                    <Label htmlFor="og_image" className="font-prompt text-sm mb-2 block">
                      OG Image (รูปภาพเมื่อแชร์)
                    </Label>
                    <Input
                      id="og_image"
                      type="url"
                      placeholder="ใช้รูปบทความโดยอัตโนมัติถ้าไม่ระบุ (แนะนำ 1200x630px)"
                      className="font-prompt"
                      {...register("og_image")}
                    />
                    {errors.og_image && (
                      <p className="text-destructive text-sm mt-1 font-prompt" role="alert">
                        {errors.og_image.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 font-prompt">
                      💡 ขนาดแนะนำ: 1200x630 pixels สำหรับแสดงผลบนโซเชียลมีเดีย
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* SEO Checklist */}
            <Card className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <h2 className="font-semibold mb-3 font-prompt flex items-center gap-2 text-base">
                <FileText className="w-5 h-5" />
                ✅ SEO Checklist - ครบถ้วนทุกจุด
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-prompt">
                <div>
                  <div className="font-semibold mb-2">🎯 On-Page SEO:</div>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>H1</strong>: 1 ครั้ง - ใช้หัวข้อบทความ</li>
                    <li><strong>H2-H3</strong>: โครงสร้างชัดเจน</li>
                    <li><strong>Meta Tags</strong>: Title & Description</li>
                    <li><strong>Alt Text</strong>: ทุกรูปภาพ</li>
                    <li><strong>Keywords</strong>: ใส่ตามธรรมชาติ</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-2">🔗 Content Quality:</div>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    <li>เนื้อหายาว 300+ คำ</li>
                    <li>Internal Links ไปบทความอื่น</li>
                    <li>External Links อ้างอิงที่น่าเชื่อถือ</li>
                    <li>ย่อหน้าสั้นๆ อ่านง่าย</li>
                    <li><strong>OG Tags</strong>: สำหรับโซเชียล</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-prompt flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : isEditing
                  ? "บันทึกการแก้ไข"
                  : "เผยแพร่บทความ"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/knowledge")}
                className="font-prompt"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateArticle;
