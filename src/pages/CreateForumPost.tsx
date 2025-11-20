import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost, useForumPost, useUpdatePost } from '@/hooks/useForumPosts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useUserRole } from '@/hooks/useUserRole';

const postSchema = z.object({
  title: z.string().min(5, 'หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร').max(200, 'หัวข้อต้องไม่เกิน 200 ตัวอักษร'),
  content: z.string().min(10, 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร').max(5000, 'เนื้อหาต้องไม่เกิน 5000 ตัวอักษร'),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
});

const categories = [
  { value: 'general', label: 'ทั่วไป' },
  { value: 'adoption', label: 'การรับเลี้ยง' },
  { value: 'health', label: 'สุขภาพ' },
  { value: 'behavior', label: 'พฤติกรรม' },
  { value: 'nutrition', label: 'อาหารและโภชนาการ' },
];

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

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    if (isEditMode && !user) {
      navigate('/login');
    }
  }, [isEditMode, user, navigate]);

  useEffect(() => {
    if (!isEditMode) return;
    if (loadingEditablePost || rolesLoading) return;

    if (!editablePost) {
      toast.error('ไม่พบกระทู้ที่ต้องการแก้ไข');
      navigate('/forum');
      return;
    }

    if (user && user.id !== editablePost.user_id && !isAdmin) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขกระทู้นี้');
      navigate(`/forum/${editablePost.id}`);
      return;
    }

    setFormData({
      title: editablePost.title,
      content: editablePost.content,
      category: editablePost.category,
    });
  }, [isEditMode, editablePost, user, isAdmin, loadingEditablePost, navigate, rolesLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      navigate('/login');
      return;
    }

    // Validate form data
    try {
      postSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
        return;
      }
    }

    if (isEditMode && editablePostId) {
      updatePost.mutate(
        {
          id: editablePostId,
          ...formData,
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
        },
        {
          onSuccess: () => {
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(backTarget)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปเว็บบอร์ด
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">{heading}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
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

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">หัวข้อ *</Label>
              <Input
                id="title"
                placeholder="ใส่หัวข้อกระทู้ของคุณ"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 ตัวอักษร
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">เนื้อหา *</Label>
              <Textarea
                id="content"
                placeholder="เขียนรายละเอียดกระทู้ของคุณ..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                maxLength={5000}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/5000 ตัวอักษร
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'กำลังบันทึก...' : submitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(backTarget)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateForumPost;
