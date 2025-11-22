import { useCats } from "@/hooks/useCats";
import CatCard from "@/components/CatCard";
import { Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";

const SuccessStories = () => {
  const { data: cats, isLoading } = useCats();
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");

  // Filter only adopted cats
  const adoptedCats = cats?.filter(cat => cat.is_adopted) || [];

  // Apply search and province filters
  const filteredCats = adoptedCats.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = provinceFilter === "all" || cat.province === provinceFilter;
    return matchesSearch && matchesProvince;
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-success animate-pulse" />
            <h1 className="text-4xl font-bold font-prompt bg-gradient-to-r from-success to-success/60 bg-clip-text text-transparent">
              เรื่องราวความสำเร็จ
            </h1>
            <Heart className="w-8 h-8 text-success fill-success animate-pulse" />
          </div>
          <p className="text-muted-foreground font-prompt text-lg max-w-2xl mx-auto">
            น้องแมวและสุนัขที่ได้บ้านใหม่แล้ว 🏡 ขอบคุณทุกท่านที่ให้ความรักและโอกาสครั้งใหม่กับพวกเขา
          </p>
          {adoptedCats.length > 0 && (
            <p className="text-success font-prompt font-semibold mt-2">
              🎉 {adoptedCats.length} ชีวิตที่ได้รับความรัก
            </p>
          )}
        </div>

        {/* Filters */}
        {adoptedCats.length > 0 && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="🔍 ค้นหาชื่อสัตว์เลี้ยง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="font-prompt"
              />
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="font-prompt">
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all" className="font-prompt">ทุกจังหวัด</SelectItem>
                  {THAI_PROVINCES.map((province) => (
                    <SelectItem key={province} value={province} className="font-prompt">
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && adoptedCats.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border-2 border-dashed">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2 font-prompt">ยังไม่มีเรื่องราวความสำเร็จ</h3>
            <p className="text-muted-foreground font-prompt">
              เมื่อมีสัตว์เลี้ยงได้บ้านใหม่ เรื่องราวจะปรากฏที่นี่
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && adoptedCats.length > 0 && filteredCats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">ไม่พบผลลัพธ์ที่ค้นหา</p>
          </div>
        )}

        {/* Cat Cards Grid */}
        {filteredCats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCats.map((cat) => (
              <CatCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                age={cat.age}
                gender={cat.gender}
                province={cat.province}
                district={cat.district}
                images={cat.image_url}
                story={cat.story}
                isAdopted={cat.is_adopted}
                urgent={cat.is_urgent}
                contactName={cat.contact_name}
                contactPhone={cat.contact_phone}
                contactLine={cat.contact_line}
                userId={cat.user_id}
                healthStatus={cat.health_status}
                isSterilized={cat.is_sterilized}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStories;
