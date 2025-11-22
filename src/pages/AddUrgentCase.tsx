import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCreateUrgentCase } from "@/hooks/useUrgentCases";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { z } from "zod";
import { alert } from "@/lib/alerts";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";

const urgentCaseSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(200, "หัวข้อต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().trim().min(1, "กรุณากรอกรายละเอียด").max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร"),
  location: z.string().trim().min(1, "กรุณากรอกสถานที่").max(200, "สถานที่ต้องไม่เกิน 200 ตัวอักษร"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  caseType: z.string().min(1, "กรุณาเลือกประเภทเคส"),
  contactName: z.string().trim().min(1, "กรุณากรอกชื่อผู้ติดต่อ").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  contactPhone: z.string().trim().regex(/^[0-9]{9,10}$/, "กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก"),
  contactLine: z.string().trim().max(50, "Line ID ต้องไม่เกิน 50 ตัวอักษร").optional(),
});

const AddUrgentCase = () => {
  const { user } = useAuth();
  const createUrgentCase = useCreateUrgentCase();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [caseType, setCaseType] = useState<"injured" | "sick" | "kitten" | "other">("injured");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLine, setContactLine] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-prompt">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-muted-foreground mb-6 font-prompt">คุณต้องเข้าสู่ระบบก่อนเพื่อแจ้งกรณีฉุกเฉิน</p>
          <Link to="/login"><Button className="font-prompt">เข้าสู่ระบบ</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = urgentCaseSchema.parse({
        title,
        description,
        location,
        province,
        caseType,
        contactName,
        contactPhone,
        contactLine,
      });

      await createUrgentCase.mutateAsync({
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        province: validatedData.province,
        image_url: imageUrls.length > 0 ? imageUrls : undefined,
        case_type: validatedData.caseType as "injured" | "sick" | "kitten" | "other",
        is_resolved: false,
        contact_name: validatedData.contactName,
        contact_phone: validatedData.contactPhone,
        contact_line: validatedData.contactLine || undefined,
        user_id: user.id,
      });

      navigate("/help");
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          alert.error(err.message);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-prompt text-urgent">แจ้งกรณีฉุกเฉิน 🆘</h1>
          <p className="text-muted-foreground font-prompt">แจ้งเหตุแมวหรือสุนัขบาดเจ็บ ป่วย หรือต้องการความช่วยเหลือทันที</p>
        </div>

        <Card className="p-6 shadow-card border-l-4 border-l-urgent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-prompt">หัวข้อกรณีฉุกเฉิน *</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="เช่น สุนัขถูกรถชน, เจอแมวจรป่วยหนัก"
                required 
                className="font-prompt" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseType" className="font-prompt">ประเภทกรณี *</Label>
              <Select value={caseType} onValueChange={(value: any) => setCaseType(value)} required>
                <SelectTrigger className="font-prompt">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="injured" className="font-prompt">บาดเจ็บ</SelectItem>
                  <SelectItem value="sick" className="font-prompt">ป่วย</SelectItem>
                  <SelectItem value="kitten" className="font-prompt">ลูกสัตว์เลี้ยงเล็ก</SelectItem>
                  <SelectItem value="other" className="font-prompt">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-prompt">รายละเอียดอาการ *</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4} 
                className="font-prompt" 
                placeholder="อธิบายอาการและสถานการณ์โดยละเอียด"
                required 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="province" className="font-prompt">จังหวัด *</Label>
                <Select value={province} onValueChange={setProvince} required>
                  <SelectTrigger className="font-prompt">
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {THAI_PROVINCES.map((provinceName) => (
                      <SelectItem key={provinceName} value={provinceName} className="font-prompt">
                        {provinceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="font-prompt">สถานที่ (ละเอียด) *</Label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="เช่น ซอยลาดพร้าว 101"
                  required 
                  className="font-prompt" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="font-prompt">รูปภาพประกอบ (สูงสุด 3 รูป)</Label>
              <MultiImageUpload
                maxImages={3}
                imageUrls={imageUrls}
                onImagesChange={setImageUrls}
                userId={user.id}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 font-prompt flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-urgent" />
                ข้อมูลติดต่อผู้แจ้ง
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="font-prompt">ชื่อผู้แจ้ง *</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required className="font-prompt" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="font-prompt">เบอร์โทรศัพท์ *</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="font-prompt" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactLine" className="font-prompt">LINE ID</Label>
                  <Input value={contactLine} onChange={(e) => setContactLine(e.target.value)} className="font-prompt" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full font-prompt gap-2" size="lg" disabled={createUrgentCase.isPending}>
              <AlertCircle className="w-5 h-5" />
              {createUrgentCase.isPending ? "กำลังส่งข้อมูล..." : "ส่งแจ้งกรณีฉุกเฉิน"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddUrgentCase;
