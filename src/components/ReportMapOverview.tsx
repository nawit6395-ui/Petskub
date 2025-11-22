import { memo, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Report } from "@/hooks/useReports";
import { locationMarkerIcon, defaultMapCenter, tileLayerUrl, tileLayerOptions } from "@/lib/leaflet";

interface ReportMapOverviewProps {
  reports?: Report[];
  heightClass?: string;
  limit?: number;
  scrollWheelZoom?: boolean;
}

const ReportMapOverview = ({
  reports,
  heightClass = "h-[280px] sm:h-[360px] lg:h-[420px]",
  limit,
  scrollWheelZoom = true,
}: ReportMapOverviewProps) => {
  const points = useMemo(
    () =>
      (reports ?? [])
        .filter((report): report is Report & { latitude: number; longitude: number } =>
          typeof report.latitude === "number" && typeof report.longitude === "number"
        )
        .slice(0, typeof limit === "number" ? limit : undefined),
    [reports, limit]
  );

  if (points.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-3xl border bg-muted/40 text-center">
        <p className="font-semibold font-prompt">ยังไม่มีพิกัดสำหรับแสดงผล</p>
        <p className="text-sm text-muted-foreground font-prompt">เริ่มแจ้งจุดพบสัตว์จรเพื่อดูแผนที่ภาพรวม</p>
      </div>
    );
  }

  const center = { lat: points[0].latitude, lng: points[0].longitude };

  return (
    <MapContainer
      center={center ?? defaultMapCenter}
      zoom={points.length > 5 ? 11 : 14}
      scrollWheelZoom={scrollWheelZoom}
      className={`w-full rounded-3xl ${heightClass}`}
    >
      <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
      {points.map((report) => (
        <Marker
          key={report.id}
          icon={locationMarkerIcon}
          position={{ lat: report.latitude!, lng: report.longitude! }}
        >
          <Popup>
            <div className="space-y-1 font-prompt">
              <p className="text-sm font-semibold">{report.location}</p>
              <p className="text-xs text-muted-foreground">{report.province} · {report.district}</p>
              <p className="text-xs text-muted-foreground">
                lat {report.latitude?.toFixed(3)}, lng {report.longitude?.toFixed(3)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default memo(ReportMapOverview);
