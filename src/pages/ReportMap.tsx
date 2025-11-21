import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, PlusCircle } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { defaultMapCenter, tileLayerAttribution, tileLayerUrl, locationMarkerIcon } from "@/lib/leaflet";
import type { Coordinates } from "@/lib/leaflet";
import { useReports } from "@/hooks/useReports";
import type { Report } from "@/hooks/useReports";

const statusConfig: Record<Report["status"], { label: string; variant: "secondary" | "outline" | "default" }> = {
  pending: { label: "รอดำเนินการ", variant: "secondary" },
  in_progress: { label: "กำลังติดตาม", variant: "default" },
  resolved: { label: "ปิดรายงานแล้ว", variant: "outline" },
};

const ReportMap = () => {
  const { data: reports, isLoading } = useReports();
  const [searchParams] = useSearchParams();
  const focusParam = searchParams.get("focus");
  const [activeReportId, setActiveReportId] = useState<string | null>(focusParam);

  const reportsWithCoordinates = useMemo(
    () => (reports ?? []).filter((report): report is Report & { latitude: number; longitude: number } => typeof report.latitude === "number" && typeof report.longitude === "number"),
    [reports]
  );

  useEffect(() => {
    if (!focusParam) return;
    const exists = reportsWithCoordinates.some((report) => report.id === focusParam);
    if (exists) {
      setActiveReportId(focusParam);
    }
  }, [focusParam, reportsWithCoordinates]);

  const activeReport = reportsWithCoordinates.find((report) => report.id === activeReportId) ?? reportsWithCoordinates[0] ?? null;
  const showEmptyState = !isLoading && reportsWithCoordinates.length === 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary font-prompt">รายงานสัตว์จร</p>
          <h1 className="text-3xl font-bold font-prompt">แผนที่รายงานทั้งหมด</h1>
          <p className="text-muted-foreground font-prompt">ดูจุดที่พบแมวและสุนัขจรและติดตามการดำเนินงานแบบเรียลไทม์</p>
        </div>
        <Button asChild className="gap-2 font-prompt">
          <Link to="/report">
            <PlusCircle className="h-4 w-4" />
            แจ้งรายงานใหม่
          </Link>
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-card">
        {showEmptyState ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold font-prompt">ยังไม่มีพิกัดสำหรับแสดง</p>
            <p className="text-sm text-muted-foreground font-prompt">เริ่มแจ้งสัตว์จรเพื่อแสดงผลบนแผนที่</p>
          </div>
        ) : (
          <div className="h-[480px]">
            <MapContainer
              center={activeReport ? { lat: activeReport.latitude, lng: activeReport.longitude } : defaultMapCenter}
              zoom={activeReport ? 15 : 6}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer url={tileLayerUrl} attribution={tileLayerAttribution} />
              <MapFocus coordinates={activeReport ? { lat: activeReport.latitude, lng: activeReport.longitude } : null} />
              {reportsWithCoordinates.map((report) => (
                <Marker
                  key={report.id}
                  icon={locationMarkerIcon}
                  position={{ lat: report.latitude, lng: report.longitude }}
                  eventHandlers={{
                    click: () => setActiveReportId(report.id),
                  }}
                >
                  <Popup>
                    <div className="space-y-1 font-prompt">
                      <p className="text-sm font-semibold">{report.location}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.province} · {report.district}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        lat {report.latitude.toFixed(4)}, lng {report.longitude.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        รายงานเมื่อ {new Date(report.created_at).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-prompt">รายการรายงานทั้งหมด</h2>
          <p className="text-sm text-muted-foreground font-prompt">
            {reports?.length ? `${reports.length} รายงาน` : isLoading ? "กำลังโหลด..." : "ยังไม่มีข้อมูล"}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {(reports ?? []).map((report) => {
            const status = statusConfig[report.status];
            const isActive = report.id === activeReportId;

            return (
              <Card
                key={report.id}
                className={`p-4 transition hover:border-primary/40 ${isActive ? "border-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-prompt">{report.province} · {report.district}</p>
                    <h3 className="text-lg font-semibold font-prompt">{report.location}</h3>
                    <p className="text-xs text-muted-foreground font-prompt">{new Date(report.created_at).toLocaleString("th-TH")}</p>
                  </div>
                  <Badge variant={status.variant} className="font-prompt">
                    {status.label}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground font-prompt line-clamp-2">
                  {report.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-prompt">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>พบสัตว์จร {report.cat_count} ตัว</span>
                  </div>
                  {typeof report.latitude === "number" && typeof report.longitude === "number" ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="gap-1 px-0"
                      onClick={() => setActiveReportId(report.id)}
                    >
                      ดูบนแผนที่
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">ยังไม่ระบุพิกัด</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportMap;

const MapFocus = ({ coordinates }: { coordinates: Coordinates | null }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates) {
      map.setView(coordinates, 15, { animate: true });
    }
  }, [coordinates, map]);

  return null;
};
