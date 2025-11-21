import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, MessageCircle, Eye, Check, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { ImageGallery } from "@/components/ImageGallery";
import { useUpdateCat } from "@/hooks/useCats";
import { useIsAdmin } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useCreateConversation } from "@/hooks/useConversations";
import { useNavigate } from "react-router-dom";

interface CatCardProps {
  id?: string;
  name: string;
  age: string;
  province: string;
  district?: string;
  image?: string[];
  images?: string[];
  story?: string;
  gender: "ชาย" | "หญิง" | "ไม่ระบุ";
  isAdopted?: boolean;
  urgent?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactLine?: string;
  userId?: string;
  healthStatus?: string;
  isSterilized?: boolean;
}

const CatCard = ({ id, name, age, province, district, image, images, story, gender, isAdopted, urgent, contactName, contactPhone, contactLine, userId, healthStatus, isSterilized }: CatCardProps) => {
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const updateCat = useUpdateCat();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  const isOwner = user?.id === userId;
  const canManageStatus = isOwner || isAdmin;
  const canStartChat = Boolean(id && userId && !isOwner && !isAdopted);

  const handleMarkAsAdopted = async () => {
    if (!id || !canManageStatus) return;
    try {
      await updateCat.mutateAsync({ id, is_adopted: true });
      toast.success('🎉 ยินดีด้วย!', {
        description: `${name} ได้บ้านใหม่แล้ว ขอบคุณที่ให้ความรักกับน้อง ๆ`
      });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด', {
        description: 'ไม่สามารถอัพเดทสถานะได้'
      });
    }
  };

  const handleMarkAsAvailable = async () => {
    if (!id || !canManageStatus) return;
    try {
      await updateCat.mutateAsync({ id, is_adopted: false });
      toast.success('อัพเดทสถานะสำเร็จ', {
        description: `${name} พร้อมรับเลี้ยงอีกครั้ง`
      });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด', {
        description: 'ไม่สามารถอัพเดทสถานะได้'
      });
    }
  };
  
  // Use new images array if available, fallback to old image prop
  const displayImages = images && images.length > 0 
    ? images 
    : (image && Array.isArray(image) 
      ? image 
      : (typeof image === 'string' ? [image] : []));
  const firstImage = displayImages[0] || '/placeholder.svg';
  
  return (
    <>
      <Card className={`overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 ${isAdopted ? 'relative' : ''}`}>
        <div className="relative">
          <img 
            src={firstImage} 
            alt={name}
            className={`w-full h-40 sm:h-48 object-cover ${displayImages.length > 1 ? 'cursor-pointer' : ''} ${isAdopted ? 'brightness-75' : ''}`}
            onClick={() => displayImages.length > 1 && setGalleryOpen(true)}
          />
          
          {/* Adopted Overlay */}
          {isAdopted && (
            <div className="absolute inset-0 bg-gradient-to-t from-success/90 via-success/50 to-transparent flex items-center justify-center">
              <div className="text-center text-white">
                <Check className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold font-prompt">รับเลี้ยงแล้ว</p>
                <p className="text-sm font-prompt">Happy Ending 🎉</p>
              </div>
            </div>
          )}

          {displayImages.length > 1 && (
            <Badge 
              className="absolute bottom-2 left-2 bg-background/80 text-foreground border-0 font-prompt cursor-pointer z-10 text-xs px-2 py-0.5"
              onClick={() => setGalleryOpen(true)}
            >
              📷 {displayImages.length}
            </Badge>
          )}

          {urgent && !isAdopted && (
            <Badge className="absolute top-2 right-2 bg-urgent text-white border-0 font-prompt animate-pulse text-xs px-2 py-0.5">
              ⚠️ ด่วน
            </Badge>
          )}
        </div>
      
      <div className="p-2 sm:p-3">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="font-semibold text-sm sm:text-base font-prompt">{name}</h3>
          <div className="flex gap-1 flex-wrap">
            <Badge variant="secondary" className="font-prompt text-[10px] sm:text-xs px-1.5 py-0">
              {gender}
            </Badge>
            {isSterilized && (
              <Badge variant="outline" className="font-prompt text-[10px] sm:text-xs px-1.5 py-0 bg-success/10 text-success border-success/20">
                ✓
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground font-prompt">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{province}{district ? ` • ${district}` : ''}</span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground font-prompt">
            อายุ: {age}
          </div>
          {healthStatus && (
            <div className="text-xs sm:text-sm text-muted-foreground font-prompt truncate">
              สุขภาพ: {healthStatus}
            </div>
          )}
        </div>
        
        {story && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 font-prompt">
            {story}
          </p>
        )}

        {user && showContact && contactPhone && (
          <div className="bg-muted/50 rounded-lg p-2 mb-2">
            <p className="text-[10px] sm:text-xs font-semibold mb-0.5 font-prompt">ติดต่อ:</p>
            {contactName && <p className="text-xs font-prompt">{contactName}</p>}
            <p className="text-xs font-prompt">📱 {contactPhone}</p>
            {contactLine && <p className="text-xs font-prompt">LINE: {contactLine}</p>}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {/* Status Management for Owner and Admin */}
          {canManageStatus && (
            <div className="flex flex-col sm:flex-row gap-2">
              {!isAdopted ? (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleMarkAsAdopted}
                  disabled={updateCat.isPending}
                  className="flex-1 font-prompt gap-1 text-[10px] sm:text-xs h-7 sm:h-8 bg-success hover:bg-success/90"
                >
                  <Check className="w-3 h-3" />
                  {updateCat.isPending ? 'บันทึก...' : 'รับเลี้ยงแล้ว'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleMarkAsAvailable}
                  disabled={updateCat.isPending}
                  className="flex-1 font-prompt gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  <RotateCcw className="w-3 h-3" />
                  {updateCat.isPending ? 'บันทึก...' : 'เปิดรับเลี้ยงอีกครั้ง'}
                </Button>
              )}
              {isAdmin && (
                <Badge variant="secondary" className="font-prompt gap-1 px-2 text-[10px] sm:text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </Badge>
              )}
            </div>
          )}
          
          {/* Contact Buttons */}
          {!isAdopted && (
            <div className="flex gap-2">
              {!showContact ? (
                <Button 
                  size="sm"
                  className="flex-1 font-prompt gap-1 text-xs sm:text-sm h-7 sm:h-9" 
                  onClick={() => {
                    if (!user) {
                      toast.error('กรุณาเข้าสู่ระบบเพื่อดูข้อมูลติดต่อ');
                      return;
                    }
                    setShowContact(true);
                  }}
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">แสดงข้อมูลติดต่อ</span>
                  <span className="sm:hidden">ติดต่อ</span>
                </Button>
              ) : (
                <Button 
                  size="sm"
                  className="flex-1 font-prompt gap-1 text-xs sm:text-sm h-7 sm:h-9" 
                  asChild
                >
                  <a href={`tel:${contactPhone}`}>
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">ติดต่อรับเลี้ยง</span>
                    <span className="sm:hidden">โทร</span>
                  </a>
                </Button>
              )}
              {canStartChat && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 font-prompt gap-1 text-xs sm:text-sm h-7 sm:h-9"
                  disabled={createConversation.isPending}
                  onClick={() => {
                    if (!user) {
                      toast.error('กรุณาเข้าสู่ระบบเพื่อเริ่มแชท');
                      navigate('/login');
                      return;
                    }
                    if (!id || !userId) {
                      toast.error('ไม่พบข้อมูลเจ้าของสัตว์เลี้ยง');
                      return;
                    }
                    createConversation.mutate(
                      { catId: id, ownerId: userId, adopterId: user.id },
                      {
                        onSuccess: (conversation) => {
                          toast.success('เปิดห้องแชทกับเจ้าของแล้ว');
                          navigate(`/chat?conversationId=${conversation.id}`);
                        },
                      }
                    );
                  }}
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">แชทกับเจ้าของ</span>
                  <span className="sm:hidden">แชท</span>
                </Button>
              )}
            </div>
          )}

          {/* Adopted Status Info */}
          {isAdopted && !canManageStatus && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-2 text-center">
              <p className="text-xs sm:text-sm font-semibold text-success font-prompt">
                ✨ น้อง{name}ได้บ้านใหม่แล้ว
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-prompt mt-0.5">
                ขอบคุณทุกคนที่ให้ความสนใจ
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>

    <ImageGallery 
      images={displayImages}
      open={galleryOpen}
      onOpenChange={setGalleryOpen}
    />
    </>
  );
};

export default CatCard;
