import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForumPosts, useTogglePostReaction, useTrendingPosts } from '@/hooks/useForumPosts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Eye, Pin, Lock, Plus, Flame, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { alert } from '@/lib/alerts';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const categories = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'general', label: 'ทั่วไป' },
  { value: 'adoption', label: 'การรับเลี้ยง' },
  { value: 'health', label: 'สุขภาพ' },
  { value: 'behavior', label: 'พฤติกรรม' },
  { value: 'nutrition', label: 'อาหารและโภชนาการ' },
];

const Forum = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: posts, isLoading } = useForumPosts(selectedCategory, { userId: user?.id });
  const { data: trendingPosts } = useTrendingPosts(6, user?.id);
  const toggleReaction = useTogglePostReaction();

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

  const handleToggleLike = (event: React.MouseEvent, postId: string, isLiked?: boolean) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      alert.error('กรุณาเข้าสู่ระบบเพื่อกดถูกใจ');
      navigate('/login');
      return;
    }

    toggleReaction.mutate({ postId, userId: user.id, isLiked: Boolean(isLiked) });
  };

  const renderImagePreview = (imageUrls?: string[]) => {
    if (!imageUrls || imageUrls.length === 0) return null;
    const preview = imageUrls.slice(0, 3);
    const remaining = imageUrls.length - preview.length;

    return (
      <div className="mt-4 -mx-1 flex gap-3 overflow-x-auto pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {preview.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative h-[185px] w-[240px] flex-shrink-0 overflow-hidden rounded-[12px] border border-white/40 bg-muted/50 shadow-sm sm:h-[155px] sm:w-[230px] sm:flex-shrink"
          >
            <img
              src={url}
              alt={`แนบรูปที่ ${index + 1}`}
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
            />
            {index === preview.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white">
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">เว็บบอร์ด</h1>
          <p className="text-muted-foreground">แบ่งปันประสบการณ์และถามตอบเกี่ยวกับแมวและสุนัข</p>
        </div>
        {user && (
          <Link to="/forum/create">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              สร้างกระทู้ใหม่
            </Button>
          </Link>
        )}
      </div>

      {trendingPosts && trendingPosts.length > 0 && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-primary" />
              โพสต์กำลังมาแรง
            </CardTitle>
            <CardDescription>อิงจากการกดถูกใจ ความคิดเห็น และยอดเข้าชมล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {trendingPosts.map((post) => (
                <Link key={post.id} to={`/forum/${post.id}`} className="min-w-[240px]">
                  <div className="rounded-2xl border border-primary/20 bg-white/70 p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge className="bg-primary/10 text-primary">{categories.find((c) => c.value === post.category)?.label || post.category}</Badge>
                      <span className="text-xs">คะแนน {post.trend_score.toFixed(1)}</span>
                    </div>
                    <p className="font-semibold line-clamp-2 mb-3">{post.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${post.is_liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-border'}`}
                        onClick={(e) => handleToggleLike(e, post.id, post.is_liked)}
                      >
                        <Heart className={`h-3.5 w-3.5 ${post.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        {post.like_count}
                      </button>
                      <span className="flex items-center gap-1 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comment_count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-2 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 p-2 shadow-inner">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="flex-shrink-0 rounded-full border border-transparent bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-rose-200 hover:text-rose-500 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-400 data-[state=active]:to-orange-300 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">กำลังโหลด...</p>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link key={post.id} to={`/forum/${post.id}`}>
                  <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getCategoryColor(post.category)}>
                              {categories.find((c) => c.value === post.category)?.label || post.category}
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
                          <CardTitle className="text-xl hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.content}
                          </CardDescription>
                          {renderImagePreview(post.image_urls)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {post.profiles?.full_name || 'ผู้ใช้ไม่ระบุชื่อ'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.comment_count || 0}
                        </span>
                        <button
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${post.is_liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-border'}`}
                          onClick={(e) => handleToggleLike(e, post.id, post.is_liked)}
                        >
                          <Heart className={`h-3.5 w-3.5 ${post.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          {post.like_count}
                        </button>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">ยังไม่มีกระทู้ในหมวดนี้</p>
                {user && (
                  <Link to="/forum/create">
                    <Button>สร้างกระทู้แรก</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {!user && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              <Link to="/login" className="text-primary hover:underline font-medium">
                เข้าสู่ระบบ
              </Link>
              เพื่อสร้างกระทู้และแสดงความคิดเห็น
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Forum;
