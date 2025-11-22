import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useForumPost, useDeletePost, useTogglePostReaction } from '@/hooks/useForumPosts';
import { useForumComments, useCreateComment, useDeleteComment } from '@/hooks/useForumComments';
import { useIsAdmin } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Eye, Pin, Lock, Trash2, MessageSquare, Pencil, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { alert } from '@/lib/alerts';
import { z } from 'zod';
import { ImageGallery } from '@/components/ImageGallery';

const commentSchema = z.object({
  content: z.string().min(1, 'กรุณาใส่ความคิดเห็น').max(2000, 'ความคิดเห็นต้องไม่เกิน 2000 ตัวอักษร'),
});

const categories: Record<string, string> = {
  general: 'ทั่วไป',
  adoption: 'การรับเลี้ยง',
  health: 'สุขภาพ',
  behavior: 'พฤติกรรม',
  nutrition: 'อาหารและโภชนาการ',
};

const ForumPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const { data: post, isLoading: postLoading } = useForumPost(id!, { userId: user?.id });
  const { data: comments, isLoading: commentsLoading } = useForumComments(id!);
  const createComment = useCreateComment();
  const deletePost = useDeletePost();
  const toggleReaction = useTogglePostReaction();
  const deleteComment = useDeleteComment();

  const [commentContent, setCommentContent] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert.error('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
      navigate('/login');
      return;
    }

    // Validate comment
    try {
      commentSchema.parse({ content: commentContent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert.error(error.errors[0].message);
        return;
      }
    }

    createComment.mutate(
      {
        post_id: id!,
        content: commentContent,
        user_id: user.id,
      },
      {
        onSuccess: () => {
          setCommentContent('');
        },
      }
    );
  };

  const handleDeletePost = () => {
    if (id) {
      deletePost.mutate(id, {
        onSuccess: () => {
          navigate('/forum');
        },
      });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate({ commentId, postId: id! });
  };

  const handleToggleLike = () => {
    if (!post || !user) {
      alert.error('กรุณาเข้าสู่ระบบเพื่อกดถูกใจ');
      navigate('/login');
      return;
    }

    toggleReaction.mutate({ postId: post.id, userId: user.id, isLiked: Boolean(post.is_liked) });
  };

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-muted-foreground mb-4">ไม่พบกระทู้ที่คุณต้องการ</p>
        <Link to="/forum">
          <Button>กลับไปเว็บบอร์ด</Button>
        </Link>
      </div>
    );
  }

  const canManagePost = user && (user.id === post.user_id || isAdmin);
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      adoption: 'bg-green-500/10 text-green-700 dark:text-green-300',
      health: 'bg-red-500/10 text-red-700 dark:text-red-300',
      behavior: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      nutrition: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/forum')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปเว็บบอร์ด
      </Button>

      {/* Post Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getCategoryColor(post.category)}>
                  {categories[post.category] || post.category}
                </Badge>
                {post.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    ปักหมุด
                  </Badge>
                )}
                {post.is_locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    ล็อค
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl sm:text-3xl">{post.title}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={post.is_liked ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleLike}
                className={post.is_liked ? 'bg-rose-500 hover:bg-rose-600' : ''}
              >
                <Heart className={`h-4 w-4 sm:mr-2 ${post.is_liked ? 'fill-white text-white' : ''}`} />
                <span className="hidden sm:inline">ถูกใจ ({post.like_count})</span>
                <span className="sm:hidden">{post.like_count}</span>
              </Button>
            {canManagePost && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/forum/${post.id}/edit`)}
                >
                  <Pencil className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">แก้ไข</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">ลบ</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ยืนยันการลบกระทู้</AlertDialogTitle>
                      <AlertDialogDescription>
                        คุณแน่ใจหรือไม่ที่จะลบกระทู้นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePost}>ลบกระทู้</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>{post.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.profiles?.full_name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: th,
                })}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {post.views}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              {post.comment_count}
            </div>
          </div>

          <Separator />

          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.image_urls && post.image_urls.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">รูปภาพประกอบ ({post.image_urls.length})</h3>
              <div className="flex flex-wrap gap-4">
                {post.image_urls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(index);
                      setIsGalleryOpen(true);
                    }}
                    className="group relative overflow-hidden rounded-[12px] border border-white/50 bg-muted/40 shadow-sm w-full h-[190px] sm:w-[230px] sm:h-[155px]"
                  >
                    <img
                      src={url}
                      alt={`รูปประกอบที่ ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {post.image_urls && post.image_urls.length > 0 && (
        <ImageGallery
          images={post.image_urls}
          open={isGalleryOpen}
          onOpenChange={setIsGalleryOpen}
          initialIndex={activeImageIndex}
        />
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ความคิดเห็น ({comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          {user && !post.is_locked ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <Textarea
                placeholder="แสดงความคิดเห็น..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={4}
                maxLength={2000}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {commentContent.length}/2000 ตัวอักษร
                </p>
                <Button type="submit" disabled={createComment.isPending || !commentContent.trim()}>
                  {createComment.isPending ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                </Button>
              </div>
            </form>
          ) : post.is_locked ? (
            <p className="text-center text-muted-foreground py-4">
              กระทู้นี้ถูกล็อค ไม่สามารถแสดงความคิดเห็นได้
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              <Link to="/login" className="text-primary hover:underline">
                เข้าสู่ระบบ
              </Link>
              เพื่อแสดงความคิดเห็น
            </p>
          )}

          <Separator />

          {/* Comments List */}
          {commentsLoading ? (
            <p className="text-center text-muted-foreground">กำลังโหลดความคิดเห็น...</p>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const canDeleteComment = user && (user.id === comment.user_id || isAdmin);

                return (
                  <div key={comment.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback>{comment.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{comment.profiles?.full_name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </p>
                        </div>
                        {canDeleteComment && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการลบความคิดเห็น</AlertDialogTitle>
                                <AlertDialogDescription>
                                  คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                  ลบ
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">ยังไม่มีความคิดเห็น</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPost;
