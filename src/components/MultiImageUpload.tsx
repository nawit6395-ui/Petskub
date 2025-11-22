import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2 } from 'lucide-react';
import { alert } from '@/lib/alerts';

interface MultiImageUploadProps {
  maxImages?: number;
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
  userId: string;
}

export const MultiImageUpload = ({ 
  maxImages = 3, 
  imageUrls, 
  onImagesChange,
  userId 
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed max images
    if (imageUrls.length + files.length > maxImages) {
      alert.error(`สามารถอัพโหลดได้สูงสุด ${maxImages} รูปเท่านั้น`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
          continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert.error(`รูป ${file.name} มีขนาดใหญ่เกิน 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('cat-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('cat-images')
          .getPublicUrl(data.path);

        newUrls.push(publicUrl);
      }

      onImagesChange([...imageUrls, ...newUrls]);
      alert.success(`อัพโหลดรูปภาพสำเร็จ ${newUrls.length} รูป`);
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ', {
        description: error.message
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const urlParts = urlToRemove.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'cat-images');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Delete from storage
        await supabase.storage
          .from('cat-images')
          .remove([filePath]);
      }

      // Remove from list
      onImagesChange(imageUrls.filter(url => url !== urlToRemove));
      alert.success('ลบรูปภาพสำเร็จ');
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาดในการลบรูปภาพ', {
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || imageUrls.length >= maxImages}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              กำลังอัพโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              เลือกรูปภาพ ({imageUrls.length}/{maxImages})
            </>
          )}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploading || imageUrls.length >= maxImages}
        />
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`รูปที่ ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
