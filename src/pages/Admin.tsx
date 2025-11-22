import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCats, useUpdateCat } from "@/hooks/useCats";
import { useReports } from "@/hooks/useReports";
import { useUrgentCases } from "@/hooks/useUrgentCases";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, MapPin, Heart, Shield } from "lucide-react";

const Admin = () => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: cats } = useCats();
  const { data: reports } = useReports();
  const { data: urgentCases } = useUrgentCases();
  const updateCat = useUpdateCat();

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-prompt">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-muted-foreground mb-6 font-prompt">คุณต้องเข้าสู่ระบบเพื่อเข้าถึงหน้าผู้ดูแลระบบ</p>
          <Link to="/login"><Button className="font-prompt">เข้าสู่ระบบ</Button></Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-3xl font-bold mb-4 font-prompt">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground mb-6 font-prompt">คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ</p>
          <Link to="/"><Button className="font-prompt">กลับสู่หน้าแรก</Button></Link>
        </div>
      </div>
    );
  }

  const handleMarkAdopted = async (catId: string) => {
    await updateCat.mutateAsync({ id: catId, is_adopted: true });
  };

  const pendingCats = cats?.filter(cat => !cat.is_adopted) || [];
  const adoptedCats = cats?.filter(cat => cat.is_adopted) || [];
  const pendingReports = reports?.filter(r => r.status === 'pending') || [];
  const activeUrgentCases = urgentCases?.filter(c => !c.is_resolved) || [];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-prompt">ระบบจัดการ Admin 🛡️</h1>
          <p className="text-muted-foreground font-prompt">จัดการข้อมูลสัตว์เลี้ยง รายงาน และกรณีฉุกเฉิน</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold font-prompt">{pendingCats.length}</div>
                <div className="text-sm text-muted-foreground font-prompt">สัตว์เลี้ยงรอรับเลี้ยง</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-success" />
              <div>
                <div className="text-2xl font-bold font-prompt">{adoptedCats.length}</div>
                <div className="text-sm text-muted-foreground font-prompt">รับเลี้ยงแล้ว</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-warning" />
              <div>
                <div className="text-2xl font-bold font-prompt">{pendingReports.length}</div>
                <div className="text-sm text-muted-foreground font-prompt">รายงานใหม่</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-urgent" />
              <div>
                <div className="text-2xl font-bold font-prompt">{activeUrgentCases.length}</div>
                <div className="text-sm text-muted-foreground font-prompt">กรณีฉุกเฉิน</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="cats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cats" className="font-prompt">สัตว์เลี้ยงรับเลี้ยง</TabsTrigger>
            <TabsTrigger value="reports" className="font-prompt">รายงานจุดพบเจอ</TabsTrigger>
            <TabsTrigger value="urgent" className="font-prompt">กรณีฉุกเฉิน</TabsTrigger>
          </TabsList>

          <TabsContent value="cats" className="space-y-4">
            <h2 className="text-2xl font-bold font-prompt">จัดการสัตว์เลี้ยงที่รับเลี้ยง</h2>
            {pendingCats.length > 0 ? (
              <div className="space-y-4">
                {pendingCats.map((cat) => (
                  <Card key={cat.id} className="p-4 shadow-card">
                    <div className="flex items-start gap-4">
                      {cat.image_url && cat.image_url.length > 0 && (
                        <img
                          src={cat.image_url[0]}
                          alt={cat.name}
                          loading="lazy"
                          width={160}
                          height={160}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold font-prompt">{cat.name}</h3>
                            <p className="text-sm text-muted-foreground font-prompt">
                              {cat.gender} • {cat.age} • {cat.province}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {cat.is_urgent && <Badge variant="destructive" className="font-prompt">ด่วน</Badge>}
                            {cat.is_sterilized && <Badge variant="secondary" className="font-prompt">ทำหมัน</Badge>}
                          </div>
                        </div>
                        <p className="text-sm mb-3 font-prompt">{cat.story}</p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleMarkAdopted(cat.id)}
                            size="sm" 
                            className="font-prompt"
                            disabled={updateCat.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            ทำเครื่องหมายว่ารับเลี้ยงแล้ว
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center shadow-card">
                <p className="text-muted-foreground font-prompt">ไม่มีสัตว์เลี้ยงรอรับเลี้ยง</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <h2 className="text-2xl font-bold font-prompt">รายงานจุดพบสัตว์จร</h2>
            {pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <Card key={report.id} className="p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 font-prompt">
                          พบสัตว์จร {report.cat_count} ตัว
                        </h3>
                        <p className="text-sm text-muted-foreground font-prompt mb-2">
                          📍 {report.location}, {report.district}, {report.province}
                        </p>
                        {report.description && (
                          <p className="text-sm font-prompt mb-2">{report.description}</p>
                        )}
                        <div className="flex gap-2">
                          <Badge variant="outline" className="font-prompt">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(report.created_at).toLocaleDateString('th-TH')}
                          </Badge>
                          <Badge className="font-prompt">{report.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center shadow-card">
                <p className="text-muted-foreground font-prompt">ไม่มีรายงานใหม่</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            <h2 className="text-2xl font-bold font-prompt">กรณีฉุกเฉิน</h2>
            {activeUrgentCases.length > 0 ? (
              <div className="space-y-4">
                {activeUrgentCases.map((urgentCase) => (
                  <Card key={urgentCase.id} className="p-4 shadow-card border-l-4 border-l-urgent">
                    <div className="flex items-start gap-4">
                      {urgentCase.image_url && urgentCase.image_url.length > 0 && (
                        <img src={urgentCase.image_url[0]} alt={urgentCase.title} className="w-24 h-24 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold font-prompt">{urgentCase.title}</h3>
                          <Badge variant="destructive" className="font-prompt">{urgentCase.case_type}</Badge>
                        </div>
                        <p className="text-sm mb-2 font-prompt">{urgentCase.description}</p>
                        <p className="text-sm text-muted-foreground font-prompt mb-3">
                          📍 {urgentCase.location}, {urgentCase.province}
                        </p>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-semibold mb-1 font-prompt">ติดต่อ:</p>
                          <p className="text-sm font-prompt">{urgentCase.contact_name}</p>
                          <p className="text-sm font-prompt">📱 {urgentCase.contact_phone}</p>
                          {urgentCase.contact_line && (
                            <p className="text-sm font-prompt">LINE: {urgentCase.contact_line}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center shadow-card">
                <p className="text-muted-foreground font-prompt">ไม่มีกรณีฉุกเฉิน</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
