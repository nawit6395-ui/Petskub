import { useState, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Send, Navigation, Map as MapIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateReport, useReports } from "@/hooks/useReports";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import type { Coordinates } from "@/lib/leaflet";
import { defaultMapCenter, tileLayerUrl, tileLayerOptions, locationMarkerIcon } from "@/lib/leaflet";
import ReportMapOverview from "@/components/ReportMapOverview";

const reportSchema = z.object({
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  district: z.string().trim().min(1, "กรุณากรอกเขต/อำเภอ").max(100, "เขต/อำเภอต้องไม่เกิน 100 ตัวอักษร"),
  location: z.string().trim().min(1, "กรุณากรอกสถานที่").max(200, "สถานที่ต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร").optional(),
});

const Report = () => {
  const { user } = useAuth();
  const { data: reports } = useReports();
  const createReport = useCreateReport();
  const mapButtonClass = "bg-[#b54708] text-white hover:bg-[#93310a] shadow-md hover:shadow-lg border-transparent";
  
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (coords: Coordinates) => {
    try {
      const query = new URL("https://nominatim.openstreetmap.org/reverse");
      query.searchParams.set("format", "jsonv2");
      query.searchParams.set("lat", coords.lat.toString());
      query.searchParams.set("lon", coords.lng.toString());
      query.searchParams.set("zoom", "14");
      query.searchParams.set("accept-language", "th");

      const response = await fetch(query.toString());
      if (!response.ok) return;
      const data = await response.json();
      const address = data.address ?? {};

      if (!province && address.state) {
        setProvince(address.state);
      }
      if (!district && (address.district || address.county || address.city)) {
        setDistrict(address.district || address.county || address.city);
      }
      if (!location && data.display_name) {
        setLocation(data.display_name);
      }
    } catch (error) {
      console.warn("ไม่สามารถดึงข้อมูลที่อยู่ได้", error);
    }
  }, [province, district, location]);

  const handleCoordinatesChange = useCallback((coords: Coordinates, options?: { reverse?: boolean }) => {
    setCoordinates(coords);
    setGeoStatus(`ละติจูด ${coords.lat.toFixed(5)}, ลองจิจูด ${coords.lng.toFixed(5)}`);
    if (options?.reverse) {
      void reverseGeocode(coords);
    }
  }, [reverseGeocode]);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        handleCoordinatesChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }, { reverse: true });
      },
      (error) => {
        setIsLocating(false);
        toast.error("ไม่สามารถดึงตำแหน่งได้", {
          description: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [handleCoordinatesChange]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!coordinates) {
      toast.error("กรุณาเลือกตำแหน่งบนแผนที่ก่อนส่งรายงาน");
      return;
    }

    try {
      const validatedData = reportSchema.parse({
        province,
        district,
        location,
        description,
      });

      await createReport.mutateAsync({
        province: validatedData.province,
        district: validatedData.district,
        location: validatedData.location,
        description: validatedData.description || undefined,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        cat_count: 1,
        status: 'pending',
        user_id: user.id,
      });

      setProvince("");
      setDistrict("");
      setLocation("");
      setDescription("");
      setCoordinates(null);
      setGeoStatus(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-prompt">แจ้งเจอสัตว์จร 📍</h1>
          <p className="text-muted-foreground font-prompt">ช่วยกันบันทึกข้อมูลการพบแมวและสุนัขจรในพื้นที่</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild className={`gap-2 font-prompt ${mapButtonClass}`}>
              <Link to="/reports/map">
                <MapIcon className="h-4 w-4" />
                ดูรายงานบนแผนที่
              </Link>
            </Button>
            <Button type="button" variant="secondary" className="gap-2 font-prompt" onClick={handleGetLocation} disabled={isLocating}>
              <Navigation className="h-4 w-4" />
              {isLocating ? "กำลังระบุตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
            </Button>
          </div>
        </div>

        <Card className="p-6 shadow-card mb-8">
          {!user && (
            <div className="mb-4 p-4 bg-accent/10 border border-accent rounded-lg">
              <p className="text-sm font-prompt text-center">
                🐾 <Link to="/login" className="font-semibold text-primary hover:underline">เข้าสู่ระบบ</Link> เพื่อแจ้งเจอสัตว์จรในพื้นที่ของคุณ
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="province" className="font-prompt">จังหวัด *</Label>
              <Select value={province} onValueChange={setProvince} required>
                <SelectTrigger className="font-prompt"><SelectValue placeholder="เลือกจังหวัด" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="กรุงเทพมหานคร" className="font-prompt">กรุงเทพมหานคร</SelectItem>
                  <SelectItem value="เชียงใหม่" className="font-prompt">เชียงใหม่</SelectItem>
                  <SelectItem value="ภูเก็ต" className="font-prompt">ภูเก็ต</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="font-prompt">เขต/อำเภอ *</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} required className="font-prompt" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-prompt">สถานที่ *</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} required className="font-prompt" />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="font-prompt">ตำแหน่งบนแผนที่ *</Label>
                <div className="flex flex-wrap items-center gap-3 text-xs font-prompt text-muted-foreground">
                  {geoStatus && <span>{geoStatus}</span>}
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={handleGetLocation} disabled={isLocating}>
                    <Navigation className="h-3.5 w-3.5" />
                    {isLocating ? "กำลังค้นหา..." : "จับตำแหน่งอัตโนมัติ"}
                  </Button>
                </div>
              </div>
              <div className="h-64 overflow-hidden rounded-2xl border">
                <MapContainer
                  key={`${coordinates?.lat ?? defaultMapCenter.lat}-${coordinates?.lng ?? defaultMapCenter.lng}`}
                  center={coordinates ?? defaultMapCenter}
                  zoom={coordinates ? 16 : 6}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
                  {coordinates && (
                    <Marker icon={locationMarkerIcon} position={coordinates}>
                      <Popup>
                        จุดที่พบสัตว์จร <br /> {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                      </Popup>
                    </Marker>
                  )}
                  <MapClickHandler onSelect={(latlng) => handleCoordinatesChange(latlng)} />
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground font-prompt">
                แตะที่แผนที่หรือใช้ปุ่มจับตำแหน่งเพื่อระบุจุดที่พบสัตว์จร หากไม่อนุญาต GPS สามารถลาก pin เพื่อเลือกตำแหน่งได้เอง
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-prompt">รายละเอียด</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="font-prompt" />
            </div>

            <Button type="submit" className="w-full font-prompt gap-2" disabled={createReport.isPending}>
              <Send className="w-4 h-4" />
              {createReport.isPending ? "กำลังส่ง..." : "ส่งรายงาน"}
            </Button>
          </form>
        </Card>

        {reports && reports.length > 0 && (
          <Card className="p-6 shadow-card mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground font-prompt">ภาพรวมจาก {reports.length} รายงาน</p>
                <h2 className="text-xl sm:text-2xl font-bold font-prompt">แผนที่จุดพบสัตว์จรล่าสุด</h2>
              </div>
              <Button asChild className={`gap-2 font-prompt ${mapButtonClass}`}>
                <Link to="/reports/map">
                  <MapIcon className="h-4 w-4" />
                  ดูแผนที่เต็ม
                </Link>
              </Button>
            </div>
            <ReportMapOverview reports={reports} heightClass="h-[420px]" />
          </Card>
        )}

        {reports && reports.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-prompt">รายงานล่าสุด</h2>
              <Button asChild variant="ghost" className="gap-2 font-prompt">
                <Link to="/reports/map">
                  <MapIcon className="h-4 w-4" />
                  ดูทั้งหมดบนแผนที่
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.slice(0, 3).map((report) => (
                <Card key={report.id} className="p-4 shadow-card space-y-3">
                  {report.latitude && report.longitude ? (
                    <ReportPreviewMap latitude={report.latitude} longitude={report.longitude} />
                  ) : (
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground font-prompt">
                      ยังไม่มีการระบุตำแหน่ง
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1 font-prompt">พบสัตว์จร {report.cat_count} ตัว</h3>
                      <p className="text-sm text-muted-foreground font-prompt">{report.location}</p>
                      {report.latitude && report.longitude && (
                        <p className="text-xs text-muted-foreground font-prompt">
                          lat {report.latitude.toFixed(3)}, lng {report.longitude.toFixed(3)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="secondary" className="w-full font-prompt">
                    <Link to={`/reports/map?focus=${report.id}`}>
                      ดูบนแผนที่
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;

const MapClickHandler = ({ onSelect }: { onSelect: (coords: Coordinates) => void }) => {
  useMapEvents({
    click(event) {
      onSelect(event.latlng);
    },
  });
  return null;
};

const ReportPreviewMap = ({ latitude, longitude }: { latitude: number; longitude: number }) => (
  <MapContainer
    key={`${latitude}-${longitude}`}
    center={{ lat: latitude, lng: longitude }}
    zoom={15}
    scrollWheelZoom={false}
    dragging={false}
    doubleClickZoom={false}
    zoomControl={false}
    className="h-36 w-full rounded-2xl"
  >
    <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
    <Marker icon={locationMarkerIcon} position={{ lat: latitude, lng: longitude }} />
  </MapContainer>
);
