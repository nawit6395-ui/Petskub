import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, MapPin, Heart, TrendingUp } from "lucide-react";
import { FaHeart, FaCat, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import CatCard from "@/components/CatCard";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-cat-pastel.jpg";
import heroImageCozy from "@/assets/hero-cat.jpg";
import { useCats } from "@/hooks/useCats";
import { useReports } from "@/hooks/useReports";
import ReportMapOverview from "@/components/ReportMapOverview";

const heroSlides = [
  {
    src: heroImage,
    alt: "น้องแมวน่ารักในบ้านที่อบอุ่น",
  },
  {
    src: heroImageCozy,
    alt: "น้องแมวมองกล้องอย่างอ่อนโยน",
  },
];

const Home = () => {
  const { data: cats } = useCats();
  const { data: reports } = useReports();
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const mapButtonClass = "bg-[#fb8b24] text-white hover:bg-[#f97316] shadow-md hover:shadow-lg border-transparent";

  const urgentCats = cats?.filter(cat => cat.is_urgent && !cat.is_adopted).slice(0, 3) || [];
  const totalAdopted = cats?.filter(cat => cat.is_adopted).length || 0;
  const totalAvailable = cats?.filter(cat => !cat.is_adopted).length || 0;
  const totalReports = reports?.length || 0;
  const reportsWithCoordinates = useMemo(
    () => (reports ?? []).filter((report) => typeof report.latitude === "number" && typeof report.longitude === "number"),
    [reports]
  );

  const statCards = [
    {
      label: "แมวหาบ้านเจอแล้ว",
      value: totalAdopted,
      icon: FaHeart,
      accent: "from-rose-50 via-rose-100 to-amber-100",
      iconBg: "bg-rose-100 text-rose-500",
      valueColor: "text-rose-600",
    },
    {
      label: "แมวรอรับเลี้ยง",
      value: totalAvailable,
      icon: FaCat,
      accent: "from-amber-50 via-orange-100 to-rose-100",
      iconBg: "bg-orange-100 text-orange-500",
      valueColor: "text-orange-600",
    },
    {
      label: "จุดแมวจร",
      value: totalReports,
      icon: FaMapMarkerAlt,
      accent: "from-emerald-50 via-teal-100 to-cyan-100",
      iconBg: "bg-emerald-100 text-emerald-500",
      valueColor: "text-emerald-600",
    },
    {
      label: "กรณีด่วน",
      value: urgentCats.length,
      icon: FaExclamationTriangle,
      accent: "from-purple-50 via-fuchsia-100 to-rose-100",
      iconBg: "bg-purple-100 text-purple-500",
      valueColor: "text-purple-600",
    },
  ];

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const heroChips = [
    {
      label: "บ้านใหม่ที่สร้างได้",
      value: `${totalAdopted}+`,
      icon: FaHeart,
      className: "top-8 -left-6 animate-float-slow",
    },
    {
      label: "จุดพบแมวจร",
      value: totalReports,
      icon: FaMapMarkerAlt,
      className: "-bottom-4 left-10 animate-float-delayed",
    },
    {
      label: "เคสเร่งด่วน",
      value: urgentCats.length,
      icon: FaExclamationTriangle,
      className: "top-4 -right-4 animate-float-delayed",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="absolute inset-0 bg-gradient-warm opacity-5"></div>
        <div className="pointer-events-none absolute -top-16 -right-10 hidden lg:block">
          <div className="h-52 w-52 rounded-full bg-rose-200/50 blur-3xl animate-float-slow"></div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-8 hidden lg:block">
          <div className="h-40 w-40 rounded-full bg-amber-200/40 blur-3xl animate-float-delayed"></div>
        </div>
        <div className="pointer-events-none absolute inset-y-12 left-0 hidden md:block w-1/3 opacity-50">
          <div className="h-full w-full bg-gradient-to-r from-white/50 via-white/10 to-transparent animate-shimmer-soft"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-sm">
                <Heart className="h-4 w-4 fill-primary text-primary" />
                <span className="font-prompt text-sm font-medium text-primary">ชุมชนคนรักแมว</span>
              </div>
              <h1 className="font-prompt text-5xl font-bold leading-tight text-foreground md:text-6xl">
                ช่วยแมวจร
                <span className="text-primary"> ให้ได้บ้าน</span>
                ที่อบอุ่น 🐾
              </h1>
              <p className="font-prompt text-xl leading-relaxed text-muted-foreground">
                ร่วมเป็นส่วนหนึ่งของชุมชนที่ใส่ใจแมวจร ช่วยกันหาบ้านที่อบอุ่น ลดปัญหาแมวจรจัดในเมือง
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/adopt">
                  <Button size="lg" className="h-14 gap-2 px-8 text-base font-prompt shadow-hover transition-transform hover:scale-105">
                    <Heart className="h-5 w-5" />
                    หาแมวรับเลี้ยง
                  </Button>
                </Link>
                <Link to="/add-cat">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 gap-2 px-8 text-base font-prompt transition-transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    ลงประกาศหาบ้านให้แมว
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-warm opacity-20 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-white/50 shadow-hover animate-float-slow">
                <div className="relative aspect-[4/3] w-full">
                  {heroSlides.map((slide, index) => (
                    <img
                      key={slide.src}
                      src={slide.src}
                      alt={slide.alt}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-out ${
                        index === activeHeroIndex ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                </div>
                <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
                  {heroSlides.map((_, index) => (
                    <span
                      key={`indicator-${index}`}
                      className={`h-2 w-8 rounded-full transition-all ${
                        index === activeHeroIndex ? "bg-white" : "bg-white/40"
                      }`}
                    ></span>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 rounded-3xl border border-border bg-card px-8 py-6 shadow-card animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-success/10 p-3">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="font-prompt text-2xl font-bold text-foreground">{totalAdopted}+</div>
                    <div className="font-prompt text-sm text-muted-foreground">แมวหาบ้านเจอแล้ว</div>
                  </div>
                </div>
              </div>

              {heroChips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={chip.label}
                    className={`absolute hidden lg:flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-5 py-3 shadow-card backdrop-blur-md ${chip.className}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-prompt text-xs text-muted-foreground">{chip.label}</p>
                      <p className="font-prompt text-lg font-semibold text-foreground">{chip.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statCards.map(({ label, value, icon: Icon, accent, iconBg, valueColor }) => (
              <Card
                key={label}
                className={`relative overflow-hidden rounded-3xl border-none p-4 sm:p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70`}></div>
                <div className="relative flex flex-col items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-inner ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold font-prompt ${valueColor}`}>{value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-prompt">{label}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Urgent Adoption Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-prompt">แมวหาบ้านด่วน 🆘</h2>
              <p className="text-muted-foreground font-prompt">น้องแมวเหล่านี้กำลังรอคุณอยู่</p>
            </div>
            <Link to="/adopt">
              <Button variant="outline" className="font-prompt gap-2">
                ดูทั้งหมด
                <TrendingUp className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {urgentCats && urgentCats.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {urgentCats.map((cat) => (
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
            <div className="text-center py-12 bg-card rounded-2xl p-8">
              <p className="text-lg text-muted-foreground font-prompt mb-4">
                🐾 ยังไม่มีกรณีด่วนในขณะนี้
              </p>
              <p className="text-sm text-muted-foreground font-prompt mb-6">
                ดูแมวทั้งหมดที่รอรับเลี้ยงได้ในหน้าหาบ้านให้แมว
              </p>
              <a href="/adopt">
                <Button className="font-prompt">ดูแมวทั้งหมด</Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 font-prompt">แผนที่จุดพบเจอแมวจร 🗺️</h2>
            <p className="text-muted-foreground font-prompt">ช่วยกันดูแลแมวจรในพื้นที่ของคุณ</p>
          </div>
          
          <Card className="overflow-hidden shadow-hover p-6">
            {reportsWithCoordinates.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground font-prompt">อัปเดตจาก {reportsWithCoordinates.length} พิกัดล่าสุด</p>
                    <h3 className="text-2xl font-bold font-prompt">ภาพรวมจุดแมวจรทั่วประเทศ</h3>
                  </div>
                  <Button asChild className={`gap-2 font-prompt ${mapButtonClass}`}>
                    <Link to="/reports/map">
                      <MapPin className="w-4 h-4" />
                      ดูแผนที่เต็ม
                    </Link>
                  </Button>
                </div>
                <ReportMapOverview reports={reports} heightClass="h-[420px]" />
              </div>
            ) : (
              <div className="bg-muted/50 h-80 flex flex-col items-center justify-center gap-4 rounded-3xl">
                <MapPin className="w-16 h-16 text-primary" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2 font-prompt">ยังไม่มีพิกัดให้แสดง</h3>
                  <p className="text-muted-foreground mb-4 font-prompt">เริ่มแจ้งจุดแมวจรเพื่อดูแผนที่ภาพรวม</p>
                  <Link to="/report">
                    <Button className="font-prompt">แจ้งจุดพบแมวจร</Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-warm text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-prompt">พร้อมที่จะเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-lg mb-8 opacity-90 font-prompt">
            ร่วมเป็นส่วนหนึ่งในการช่วยเหลือแมวจร สร้างความเปลี่ยนแปลงที่ดีต่อชีวิตน้องแมว
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/adopt">
              <Button size="lg" variant="secondary" className="font-prompt gap-2">
                <Heart className="w-5 h-5" />
                เริ่มหาแมวรับเลี้ยง
              </Button>
            </Link>
            <Link to="/add-cat">
              <Button
                size="lg"
                variant="outline"
                className="border-white/80 bg-transparent text-white hover:bg-white/20 hover:text-white font-prompt gap-2"
              >
                <Plus className="w-5 h-5" />
                ลงประกาศหาบ้าน
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
