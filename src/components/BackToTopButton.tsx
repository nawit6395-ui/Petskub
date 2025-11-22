import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 360;
const SCROLL_DELAY_MS = 150;

const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    // small delay keeps the interaction feeling gentle before smooth scrolling kicks in
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, SCROLL_DELAY_MS);
  };

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "fixed bottom-6 right-4 z-40 transition-all duration-300 sm:bottom-8 sm:right-8",
        isVisible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
      )}
    >
      <Button
        size="icon"
        aria-label="Back to top"
        onClick={handleBackToTop}
        className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-amber-500 text-white shadow-[0_15px_30px_rgba(244,114,182,0.35)] hover:scale-105"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default BackToTopButton;
