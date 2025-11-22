import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Hash, ImagePlus, Loader2, Shield, Sparkles, AlertCircle, Clock3 } from 'lucide-react';
import { z } from 'zod';
import { alert } from '@/lib/alerts';

import { useAuth } from '@/hooks/useAuth';
import { useCreatePost, useForumPost, useUpdatePost } from '@/hooks/useForumPosts';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { buildAppUrl, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const postSchema = z.object({
  title: z.string().min(5, 'หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร').max(200, 'หัวข้อต้องไม่เกิน 200 ตัวอักษร'),
  content: z.string().min(10, 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร').max(5000, 'เนื้อหาต้องไม่เกิน 5000 ตัวอักษร'),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  image_urls: z
    .array(z.string().url())
    .max(4, 'อัพโหลดรูปได้สูงสุด 4 รูป')
    .optional(),
});

const categories = [
  { value: 'general', label: 'ทั่วไป' },
  { value: 'adoption', label: 'การรับเลี้ยง' },
  { value: 'health', label: 'สุขภาพ' },
  { value: 'behavior', label: 'พฤติกรรม' },
  { value: 'nutrition', label: 'อาหารและโภชนาการ' },
];

const MAX_IMAGES = 4;
const BUCKET_ID = 'cat-images';

type FormState = {
  title: string;
  content: string;
  category: string;
};

const initialFormState: FormState = {
  title: '',
  content: '',
  category: '',
};

const REQUIRED_FIELDS: (keyof FormState)[] = ['category', 'title', 'content'];

const titlePrompts: Record<string, string[]> = {
  general: [
    'แชร์ประสบการณ์การเลี้ยงแมวหรือสุนัขในคอนโด',
    'ขอคำแนะนำเรื่องการดูแลสัตว์เลี้ยงสูงวัย',
    'พูดคุยเรื่องนิสัยแปลก ๆ ของน้อง ๆ',
  ],
  adoption: [
    'ประกาศตามหาบ้านใหม่ให้แมวหรือสุนัขที่คุณดูแลอยู่',
    'แชร์ประสบการณ์การรับเลี้ยงจากศูนย์ช่วยเหลือ',
    'ถาม-ตอบเรื่องการเตรียมบ้านก่อนรับเลี้ยงสัตว์เลี้ยง',
  ],
  health: [
    'อัปเดตอาการหลังพาน้องไปพบสัตวแพทย์',
    'สอบถามเรื่องวัคซีนหรือยาถ่ายพยาธิ',
    'วิธีดูแลสัตว์เลี้ยงที่ป่วยหรือเพิ่งผ่าตัด',
  ],
  behavior: [
    'น้องไม่ยอมใช้กระบะทราย/ที่ขับถ่ายควรทำอย่างไร',
    'เรื่องตลก ๆ จากนิสัยของน้อง ๆ',
    'วิธีรับมือกับสัตว์เลี้ยงขี้กังวลหรือขี้ตกใจ',
  ],
  nutrition: [
    'แนะนำอาหารเม็ด/เปียกที่น้อง ๆ ชอบกิน',
    'ถามเรื่องการจัดมื้อสำหรับสัตว์เลี้ยงที่แพ้อาหาร',
    'แชร์สูตรขนมโฮมเมดสำหรับน้องหมาแมว',
  ],
};

const contentPrompts: Record<string, string[]> = {
  general: [
    'เล่าที่มาที่ไปและบริบทสั้น ๆ ให้เพื่อน ๆ เข้าใจสถานการณ์',
    'มีรูปหรือวิดีโอประกอบจะช่วยให้คนอ่านเห็นภาพมากขึ้น',
  ],
  adoption: [
    'ใส่ข้อมูลพื้นฐาน เช่น อายุ สุขภาพ นิสัย และสาเหตุที่หาบ้านใหม่',
    'ระบุช่องทางติดต่อและเงื่อนไขเบื้องต้นให้ชัดเจน',
  ],
  health: [
    'บอกอาการ ระยะเวลา และวิธีรักษาที่ลองไปแล้ว',
    'แนบผลตรวจหรือคำแนะนำจากสัตวแพทย์ (ถ้ามี)',
  ],
  behavior: [
    'เล่าถึงสิ่งกระตุ้น/สถานการณ์ที่ทำให้น้องมีพฤติกรรมดังกล่าว',
    'อธิบายสิ่งที่ลองทำแล้วและผลลัพธ์ เพื่อให้คนอื่นช่วยแนะนำต่อได้ง่ายขึ้น',
  ],
  nutrition: [
    'ระบุสูตรอาหาร/ยี่ห้อที่ใช้ ปริมาณ และความถี่',
    'แบ่งปันเคล็ดลับการเปลี่ยนอาหารหรือกระตุ้นให้น้องกินได้มากขึ้น',
  ],
};

const communityGuidelines = [
  'ใช้ภาษาสุภาพ ให้เกียรติสมาชิกทุกคน และหลีกเลี่ยงการพาดพิงบุคคลอื่นในทางเสียหาย',
  'อย่าโพสต์ข้อมูลติดต่อส่วนตัวของผู้อื่นโดยไม่ได้รับอนุญาต และอย่าเปิดเผยข้อมูลที่สามารถระบุตัวตนได้',
  'หากมีการซื้อขายหรือรับเลี้ยง โปรดใช้ช่องทางที่ปลอดภัยและตรวจสอบข้อมูลให้ครบก่อนทุกครั้ง',
  'รายงานโพสต์ที่ไม่เหมาะสมแทนการโต้เถียงกันเอง เพื่อให้ทีมงานเข้าช่วยดูแลได้รวดเร็ว',
];

const STOP_WORDS = new Set([
  'และ',
  'หรือ',
  'กับ',
  'ของ',
  'ที่',
  'คือ',
  'การ',
  'ได้',
  'ไป',
  'มา',
  'the',
  'this',
  'that',
  'with',
  'for',
  'your',
]);

const CreateForumPost = () => {
  const navigate = useNavigate();
  const { id: editablePostId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(editablePostId);
  const { user } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole();
  const isAdmin = roles?.some((role) => role.role === 'admin');
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { data: editablePost, isLoading: loadingEditablePost } = useForumPost(editablePostId, {
    skipViewIncrement: true,
    enabled: Boolean(isEditMode && editablePostId),
  });

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showValidationHints, setShowValidationHints] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftStorageKey = useMemo(() => {
    if (isEditMode) return null;
    return `forum-draft-${user?.id ?? 'guest'}`;
  }, [isEditMode, user?.id]);

  const formattedSavedTime = useMemo(() => {
    if (!lastSavedAt) return '';
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(lastSavedAt));
  }, [lastSavedAt]);

  const completionRate = useMemo(() => {
    const filled = REQUIRED_FIELDS.reduce((total, field) => {
      return total + (formData[field].trim().length ? 1 : 0);
    }, 0);
    const optional = imageUrls.length ? 1 : 0;
    return Math.min(100, Math.round(((filled + optional) / (REQUIRED_FIELDS.length + 1)) * 100));
  }, [formData, imageUrls]);

  const validationResult = useMemo(
    () => postSchema.safeParse({ ...formData, image_urls: imageUrls }),
    [formData, imageUrls]
  );
  const validationErrors = validationResult.success ? [] : validationResult.error.issues.map((issue) => issue.message);
  const isFormValid = validationResult.success;

  const wordCount = useMemo(() => (formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0), [formData.content]);
  const readingTime = Math.max(1, Math.round(wordCount / 180));

  const seoDescription = useMemo(() => {
    if (!formData.content.trim()) {
      return 'ตัวอย่างเนื้อหาจะปรากฏที่นี่เมื่อคุณเริ่มพิมพ์ เพื่อช่วยให้เห็นว่ากระทู้จะโชว์บน Google และโซเชียลอย่างไร';
    }
    const trimmed = formData.content.trim();
    return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
  }, [formData.content]);

  const keywordSuggestions = useMemo(() => {
    const source = `${formData.title} ${formData.content}`.toLowerCase();
    const tokens = source
      .replace(/[^a-z0-9ก-๙\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const counts = new Map<string, number>();
    tokens.forEach((token) => {
      if (token.length < 3 || STOP_WORDS.has(token)) return;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token]) => token);
  }, [formData.title, formData.content]);

  const dynamicTitlePlaceholder = useMemo(() => {
    const options = titlePrompts[formData.category] ?? titlePrompts.general;
    const index = formData.title.length % options.length;
    return options[index];
  }, [formData.category, formData.title.length]);

  const dynamicContentPrompt = useMemo(() => {
    const options = contentPrompts[formData.category] ?? contentPrompts.general;
    const index = formData.content.length % options.length;
    return options[index];
  }, [formData.category, formData.content.length]);

  useEffect(() => {
    if (isEditMode && !user) {
      navigate('/login');
    }
  }, [isEditMode, user, navigate]);

  useEffect(() => {
    if (!isEditMode) return;
    if (loadingEditablePost || rolesLoading) return;

    if (!editablePost) {
      alert.error('ไม่พบกระทู้ที่ต้องการแก้ไข');
      navigate('/forum');
      return;
    }

    if (user && user.id !== editablePost.user_id && !isAdmin) {
      alert.error('คุณไม่มีสิทธิ์แก้ไขกระทู้นี้');
      navigate(`/forum/${editablePost.id}`);
      return;
    }

    setFormData({
      title: editablePost.title,
      content: editablePost.content,
      category: editablePost.category,
    });
    setImageUrls(editablePost.image_urls ?? []);
  }, [isEditMode, editablePost, user, isAdmin, loadingEditablePost, navigate, rolesLoading]);

  useEffect(() => {
    if (!draftStorageKey || hasLoadedDraft) return;
    const rawDraft = localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      setHasLoadedDraft(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as FormState & { imageUrls?: string[] };
      setFormData({
        title: parsed.title ?? '',
        content: parsed.content ?? '',
        category: parsed.category ?? '',
      });
      setImageUrls(parsed.imageUrls ?? []);
    } catch (error) {
      console.warn('ไม่สามารถอ่านฉบับร่างได้', error);
      localStorage.removeItem(draftStorageKey);
    } finally {
      setHasLoadedDraft(true);
    }
  }, [draftStorageKey, hasLoadedDraft]);

  useEffect(() => {
    if (!draftStorageKey || !hasLoadedDraft) return;
    setAutoSaveState('saving');
    const handler = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            ...formData,
            imageUrls,
          })
        );
        setLastSavedAt(new Date().toISOString());
        setAutoSaveState('saved');
      } catch (error) {
        console.error('บันทึกฉบับร่างไม่สำเร็จ', error);
        setAutoSaveState('idle');
      }
    }, 800);

    return () => window.clearTimeout(handler);
  }, [draftStorageKey, formData, imageUrls, hasLoadedDraft]);

  const clearDraft = useCallback((options?: { silent?: boolean }) => {
    setFormData(initialFormState);
    setImageUrls([]);
    setLastSavedAt(null);
    setAutoSaveState('idle');
    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
    if (!options?.silent) {
      alert.info('ล้างฉบับร่างเรียบร้อยแล้ว');
    }
  }, [draftStorageKey]);

  const handleFilesUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!user) {
        alert.error('กรุณาเข้าสู่ระบบก่อนอัพโหลดรูปภาพ');
        return;
      }

      if (!files || files.length === 0) return;

      const availableSlots = MAX_IMAGES - imageUrls.length;
      if (availableSlots <= 0) {
        alert.error(`สามารถอัพโหลดได้สูงสุด ${MAX_IMAGES} รูปเท่านั้น`);
        return;
      }

      setIsUploading(true);
      const selectedFiles = Array.from(files).slice(0, availableSlots);
      const uploadedUrls: string[] = [];

      try {
        for (const file of selectedFiles) {
          if (!file.type.startsWith('image/')) {
            alert.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            alert.error(`รูป ${file.name} มีขนาดใหญ่เกิน 5MB`);
            continue;
          }

          const extension = file.name.split('.').pop() || 'jpg';
          const filePath = `${user.id}/forum-posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
          const { data, error } = await supabase.storage.from(BUCKET_ID).upload(filePath, file);
          if (error) throw error;

          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET_ID).getPublicUrl(data.path);
          uploadedUrls.push(publicUrl);
        }

        if (uploadedUrls.length) {
          setImageUrls((prev) => [...prev, ...uploadedUrls]);
          alert.success(`อัพโหลดรูปภาพสำเร็จ ${uploadedUrls.length} รูป`);
        }
      } catch (error: any) {
        alert.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ', {
          description: error.message,
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [imageUrls.length, user]
  );

  const handleRemoveImage = useCallback(async (url: string) => {
    setImageUrls((prev) => prev.filter((item) => item !== url));

    try {
      const path = url.split(`${BUCKET_ID}/`).pop()?.split('?')[0];
      if (path) {
        await supabase.storage.from(BUCKET_ID).remove([path]);
      }
    } catch (error: any) {
      console.warn('ไม่สามารถลบไฟล์จาก Storage ได้', error);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (!event.dataTransfer.files?.length) return;
      void handleFilesUpload(event.dataTransfer.files);
    },
    [handleFilesUpload]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationHints(true);

    if (!user) {
      alert.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      navigate('/login');
      return;
    }

    const parsed = postSchema.safeParse({ ...formData, image_urls: imageUrls });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => alert.error(issue.message));
      return;
    }

    if (isEditMode && editablePostId) {
      updatePost.mutate(
        {
          id: editablePostId,
          ...formData,
          image_urls: imageUrls,
        },
        {
          onSuccess: () => {
            navigate(`/forum/${editablePostId}`);
          },
        }
      );
    } else {
      createPost.mutate(
        {
          ...formData,
          user_id: user.id,
          image_urls: imageUrls,
        },
        {
          onSuccess: () => {
            clearDraft({ silent: true });
            navigate('/forum');
          },
        }
      );
    }
  };

  const heading = isEditMode ? 'แก้ไขกระทู้' : 'สร้างกระทู้ใหม่';
  const description = isEditMode ? 'ปรับแก้ไขรายละเอียดกระทู้ของคุณ' : 'แบ่งปันความคิดเห็นหรือถามคำถามกับชุมชน';
  const submitLabel = isEditMode ? 'บันทึกการแก้ไข' : 'สร้างกระทู้';
  const isSubmitting = isEditMode ? updatePost.isPending : createPost.isPending;
  const backTarget = isEditMode && editablePostId ? `/forum/${editablePostId}` : '/forum';

  if (isEditMode && (loadingEditablePost || rolesLoading || !editablePost)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-muted-foreground">กำลังโหลดข้อมูลกระทู้...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate(backTarget)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปเว็บบอร์ด
      </Button>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card className="shadow-card">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">{heading}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                <Clock3 className="mr-1 h-3.5 w-3.5" /> {readingTime} นาที
              </Badge>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {isEditMode
                      ? 'โหมดแก้ไข: จะบันทึกเมื่อกดปุ่มบันทึกเท่านั้น'
                      : autoSaveState === 'saving'
                        ? 'กำลังบันทึกฉบับร่าง...'
                        : lastSavedAt
                          ? `บันทึกล่าสุด ${formattedSavedTime}`
                          : 'เริ่มพิมพ์เพื่อให้ระบบบันทึกอัตโนมัติ'}
                  </p>
                  {!isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      ฉบับร่างจะถูกเก็บไว้ในอุปกรณ์นี้เท่านั้น ({completionRate}% ของแบบฟอร์ม)
                    </p>
                  )}
                </div>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => clearDraft()}
                    disabled={!formData.title && !formData.content && !imageUrls.length}
                  >
                    ล้างฉบับร่าง
                  </Button>
                )}
              </div>
              <Progress value={completionRate} className="mt-3 h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {showValidationHints && validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>กรุณาตรวจสอบข้อมูล</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกหมวดหมู่ เพื่อช่วยให้โพสต์ถูกค้นหาได้ง่าย" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">หัวข้อ *</Label>
                <span className="text-xs text-muted-foreground">{formData.title.length}/200</span>
              </div>
              <Input
                id="title"
                placeholder={dynamicTitlePlaceholder}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">หาหัวข้อที่บอกปัญหาหรือคำถามชัด ๆ เพื่อดึงดูดสายตาสมาชิก</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">เนื้อหา *</Label>
                <span className="text-xs text-muted-foreground">{formData.content.length}/5000</span>
              </div>
              <Textarea
                id="content"
                placeholder={dynamicContentPrompt}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                maxLength={5000}
                required
                className="min-h-[220px]"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{wordCount} คำ</span>
                <span>·</span>
                <span>ประมาณ {readingTime} นาทีในการอ่าน</span>
                <span>·</span>
                <span>แนะนำให้เว้นบรรทัดและขึ้นหัวข้อย่อยเพื่อให้อ่านง่าย</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>รูปภาพประกอบ (ไม่บังคับ)</Label>
              <input
                ref={fileInputRef}
                id="forum-image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => event.target.files && handleFilesUpload(event.target.files)}
                disabled={isUploading || imageUrls.length >= MAX_IMAGES}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                  isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                )}
              >
                <ImagePlus className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">ลากรูปภาพมาวาง หรือลองอัพโหลดได้สูงสุด {MAX_IMAGES} รูป</p>
                  <p className="text-sm text-muted-foreground">ไฟล์ JPG, PNG, WebP ไม่เกิน 5MB ต่อรูป</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || imageUrls.length >= MAX_IMAGES}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังอัพโหลด...
                      </>
                    ) : (
                      'เลือกรูปจากเครื่อง'
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">{imageUrls.length}/{MAX_IMAGES} รูป</span>
                </div>
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {imageUrls.map((url, index) => (
                    <div key={url} className="group relative overflow-hidden rounded-lg border bg-muted/40">
                      <img src={url} alt={`รูปประกอบที่ ${index + 1}`} className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="absolute right-2 top-2 rounded-full bg-destructive/90 px-2 py-1 text-xs text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" size="lg" disabled={!isFormValid || isSubmitting || isUploading} className="flex-1">
                {isSubmitting ? 'กำลังบันทึก...' : submitLabel}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => navigate(backTarget)} className="flex-1">
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>พรีวิว SEO & โพสต์</CardTitle>
              <CardDescription>ดูตัวอย่างว่ากระทู้จะแสดงอย่างไรบน Google หรือแชร์ผ่านโซเชียล</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{buildAppUrl('/forum/preview')}</p>
                <p className="mt-2 font-semibold text-emerald-700">
                  {formData.title || 'หัวข้อกระทู้ของคุณจะปรากฏที่นี่'}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{seoDescription}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">คำหลักที่แนะนำ</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywordSuggestions.length ? (
                    keywordSuggestions.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        <Hash className="h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">เริ่มพิมพ์เพื่อดูคำแนะนำอัตโนมัติ</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>กติกาชุมชน</CardTitle>
              <CardDescription>ช่วยกันดูแล Petskub Forum ให้เป็นพื้นที่ที่อบอุ่นและปลอดภัย</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {communityGuidelines.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-lg border border-dashed border-muted/60 p-3">
                  <Shield className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{rule}</p>
                </div>
              ))}
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                <Sparkles className="mr-2 inline h-4 w-4" /> โพสต์ที่ได้รับการอัพโหวตสูงและปฏิบัติตามกติกาอาจได้แสดงบนหน้าแรกของเว็บบอร์ด
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CreateForumPost;
