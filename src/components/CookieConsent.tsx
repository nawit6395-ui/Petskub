import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "petskub.cookie-consent";

const CookieConsent = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isPeekVisible, setIsPeekVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const timer = window.setTimeout(() => setIsBannerVisible(true), 900);
        return () => window.clearTimeout(timer);
      }
    } catch (error) {
      // Fallback to showing the banner if storage is unavailable
      setIsBannerVisible(true);
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

    setIsBannerVisible(false);
    setIsPeekVisible(false);
  };

  const handleLater = () => {
    setIsBannerVisible(false);
    setIsPeekVisible(true);
  };

  const handlePeek = () => {
    setIsPeekVisible(false);
    setIsBannerVisible(true);
  };

  return (
    <>
      {isBannerVisible && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie policy notification"
          className="fixed bottom-5 right-5 z-50 max-w-md rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_15px_60px_rgba(15,23,42,0.15)] backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-900">เราดูแลความเป็นส่วนตัวของคุณ</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                เราใช้คุกกี้จำเป็นเพื่อให้คุณเข้าสู่ระบบและปกป้องบัญชี คุณสามารถอ่านรายละเอียดสั้น ๆ ใน {""}
                <a href="/privacy" className="font-semibold text-emerald-600 underline-offset-4 hover:underline">
                  นโยบายคุกกี้
                </a>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  ยอมรับและดำเนินการต่อ
                </button>
                <button
                  type="button"
                  onClick={handleLater}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  เตือนฉันภายหลัง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPeekVisible && (
        <button
          type="button"
          onClick={handlePeek}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg shadow-slate-200 transition hover:bg-white"
        >
          การตั้งค่าคุกกี้
        </button>
      )}
    </>
  );
};

export default CookieConsent;
