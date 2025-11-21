import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, Plus } from "lucide-react";
import { useUrgentCases } from "@/hooks/useUrgentCases";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { UrgentCaseCard } from "@/components/UrgentCaseCard";

const Help = () => {
  const { data: urgentCases, isLoading } = useUrgentCases();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 font-prompt text-urgent">ช่วยเหลือด่วน 🆘</h1>
            <p className="text-muted-foreground font-prompt">
              กรณีฉุกเฉิน แมวหรือสุนัขบาดเจ็บ หรือต้องการความช่วยเหลือทันที
            </p>
          </div>
          {user && (
            <Link to="/add-urgent-case">
              <Button className="font-prompt gap-2">
                <Plus className="w-4 h-4" />
                แจ้งกรณีฉุกเฉิน
              </Button>
            </Link>
          )}
        </div>

        {/* Emergency Contact Card */}
        <Card className="mb-8 p-6 bg-urgent/5 border-urgent shadow-card">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-urgent flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 font-prompt">ติดต่อฉุกเฉิน</h2>
              <p className="text-muted-foreground mb-4 font-prompt">
                หากพบแมวหรือสุนัขบาดเจ็บหรือป่วยหนัก กรุณาติดต่อศูนย์ช่วยเหลือสัตว์ฉุกเฉิน
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="font-prompt gap-2">
                  <Phone className="w-4 h-4" />
                  โทร 1669 (ฉุกเฉิน)
                </Button>
                <Button variant="outline" className="font-prompt gap-2">
                  <Phone className="w-4 h-4" />
                  สายด่วนสัตว์ป่วย
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Urgent Cases Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">กำลังโหลด...</p>
          </div>
        ) : urgentCases && urgentCases.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {urgentCases.map((urgentCase) => (
              <UrgentCaseCard key={urgentCase.id} {...urgentCase} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">ไม่มีกรณีฉุกเฉินในขณะนี้</p>
          </div>
        )}

        {/* Help Guidelines */}
        <Card className="mt-12 p-4 sm:p-6 bg-secondary/50">
          <h2 className="text-lg sm:text-xl font-bold mb-4 font-prompt">🤝 แนวทางการช่วยเหลือ</h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-semibold mb-2 font-prompt">สิ่งที่ควรทำ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-prompt">
                <li>✓ ตรวจสอบอาการเบื้องต้น</li>
                <li>✓ ถ่ายรูปบันทึกหลักฐาน</li>
                <li>✓ ติดต่อสัตวแพทย์ใกล้เคียง</li>
                <li>✓ แจ้งตำแหน่งที่ชัดเจน</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 font-prompt">สิ่งที่ไม่ควรทำ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-prompt">
                <li>✗ ย้ายสัตว์บาดเจ็บเอง</li>
                <li>✗ ให้ยาโดยไม่ปรึกษาสัตวแพทย์</li>
                <li>✗ เพิกเฉยกรณีบาดเจ็บหนัก</li>
                <li>✗ ให้อาหารไม่เหมาะสม</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Help;
