import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "petskub.cookie-consent";

const CookieConsent = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsOpen(true);
      }
    } catch (error) {
      // Fallback to showing the banner if storage is unavailable
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ acceptedAt: new Date().toISOString() })
        );
      } catch (error) {
        // Ignore storage errors but still hide the popup
      }
    }

    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie policy notification"
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      <div className="relative w-full max-w-4xl rounded-3xl border border-emerald-100 bg-white/95 p-5 shadow-2xl shadow-emerald-100/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md md:p-7">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Dismiss cookie notice"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex flex-1 items-start gap-4">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 shadow-inner shadow-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">Cookies & Privacy</p>
              <p className="text-sm leading-relaxed text-slate-600">
                Petskub ใช้คุกกี้เพื่อจดจำการเข้าสู่ระบบ ปรับเนื้อหาให้ตรงกับบริบท และรักษาความปลอดภัยของบัญชีผู้ใช้
                การใช้งานเว็บไซต์ต่อถือว่าคุณยินยอมตาม {" "}
                <a href="/privacy" className="font-semibold text-emerald-600 underline-offset-4 hover:underline">
                  นโยบายคุกกี้
                </a>{" "}
                ของเรา ซึ่งสรุปว่ามีคุกกี้ประเภทใดบ้างและวิธีถอนความยินยอมเมื่อไหร่ก็ได้
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">จำเป็นต่อระบบ</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">บันทึกตัวเลือกผู้ใช้</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">สถิติเชิงรวม</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[240px]">
            <button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
            >
              ยอมรับคุกกี้
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              แสดงอีกครั้งในภายหลัง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
