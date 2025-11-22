import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CatCard from "@/components/CatCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCats } from "@/hooks/useCats";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";

const Adopt = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("available");
  const { data: cats, isLoading } = useCats();

  const filteredCats = cats?.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = provinceFilter === "all" || cat.province === provinceFilter;
    const matchesGender = genderFilter === "all" || cat.gender === genderFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && !cat.is_adopted) ||
      (statusFilter === "adopted" && cat.is_adopted);
    return matchesSearch && matchesProvince && matchesGender && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 font-prompt">หาบ้านให้สัตว์เลี้ยง 🏠</h1>
          <p className="text-muted-foreground font-prompt mb-4">
            ดูข้อมูลแมวและสุนัขทั้งหมดได้เลย ไม่ต้องสมัครสมาชิก
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
            <span className="text-sm font-prompt">💡 ต้องการโพสต์หาบ้านให้แมวหรือสุนัข?</span>
            <a href="/login" className="text-sm font-semibold text-primary hover:underline font-prompt">
              เข้าสู่ระบบ
            </a>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 font-prompt">ค้นหาและกรองสัตว์เลี้ยง</h2>
          <p className="text-muted-foreground font-prompt">พบกับน้องแมวและสุนัขที่รอคุณอยู่</p>
        </div>

        {/* Filter Section */}
        <div className="bg-card rounded-2xl shadow-card p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="font-semibold font-prompt">กรองการค้นหา</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อสัตว์เลี้ยง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-prompt"
              />
            </div>

            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="font-prompt">
                <SelectValue placeholder="จังหวัด" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all" className="font-prompt">
                  ทุกจังหวัด
                </SelectItem>
                {THAI_PROVINCES.map((province) => (
                  <SelectItem key={province} value={province} className="font-prompt">
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="font-prompt">
                <SelectValue placeholder="เพศ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-prompt">
                  ทุกเพศ
                </SelectItem>
                <SelectItem value="ชาย" className="font-prompt">
                  ชาย
                </SelectItem>
                <SelectItem value="หญิง" className="font-prompt">
                  หญิง
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="font-prompt">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-prompt">
                  ทุกสถานะ
                </SelectItem>
                <SelectItem value="available" className="font-prompt">
                  พร้อมรับเลี้ยง
                </SelectItem>
                <SelectItem value="adopted" className="font-prompt">
                  รับเลี้ยงแล้ว
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            </div>
          </div>
        ) : !cats || cats.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl p-8">
            <p className="text-muted-foreground font-prompt mb-4">ยังไม่มีข้อมูลสัตว์เลี้ยงในระบบ</p>
            <a href="/add-cat">
              <Button className="font-prompt">เพิ่มข้อมูลสัตว์เลี้ยงตัวแรก</Button>
            </a>
          </div>
        ) : (
          <>
            <div className="mb-4 font-prompt text-muted-foreground">พบ {filteredCats?.length || 0} ตัว</div>

            {filteredCats && filteredCats.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCats.map((cat) => (
                  <CatCard
                    key={cat.id}
                    id={cat.id}
                    name={cat.name}
                    age={cat.age}
                    province={cat.province}
                    district={cat.district}
                    images={cat.image_url}
                    story={cat.story}
                    gender={cat.gender}
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
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-prompt">ไม่พบสัตว์เลี้ยงที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Adopt;
