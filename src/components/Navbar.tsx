import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, LogOut, Menu, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import Logo from "@/assets/Logo.png";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavScrollRef = useRef<HTMLDivElement | null>(null);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinks = [
    { path: "/", iconClass: "fa-solid fa-house", color: "#2E8BFD", label: "หน้าแรก" },
    { path: "/adopt", iconClass: "fa-solid fa-magnifying-glass", color: "#F472B6", label: "หาบ้านให้สัตว์เลี้ยง" },
    { path: "/success-stories", iconClass: "fa-solid fa-wand-magic-sparkles", color: "#F59E0B", label: "เรื่องราวความสำเร็จ" },
    { path: "/report", iconClass: "fa-solid fa-location-dot", color: "#22C55E", label: "แจ้งเจอสัตว์จร" },
    { path: "/help", iconClass: "fa-solid fa-triangle-exclamation", color: "#EF4444", label: "ช่วยเหลือด่วน" },
    { path: "/knowledge", iconClass: "fa-solid fa-book-open", color: "#A855F7", label: "ความรู้" },
    { path: "/forum", iconClass: "fa-regular fa-comments", color: "#F97316", label: "เว็บบอร์ด" },
  ];

  const mobileNavItems = [...navLinks, ...navLinks];

  const adminLinks = isAdmin ? [{ path: "/admin", label: "Admin" }] : [];
  const quickAction = { path: "/report", label: "แจ้งสัตว์จรทันที" };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = mobileNavScrollRef.current;
    if (!container) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileWidthQuery = window.matchMedia("(max-width: 640px)");
    let rafId: number | null = null;
    let resumeTimeout: number | null = null;
    let lastTimestamp: number | null = null;
    let isAutoScrolling = false;
    let isPaused = false;
    let loopWidth = 0;

    const SCROLL_DURATION = 20000; // ~20s per loop
    const RESUME_DELAY = 2500;

    const measureLoopWidth = () => {
      if (!container) return 0;
      const children = Array.from(container.children);
      if (children.length === 0) return 0;
      const half = Math.floor(children.length / 2);
      if (half === 0) return 0;
      let total = 0;
      for (let i = 0; i < half; i++) {
        const child = children[i] as HTMLElement;
        total += child.getBoundingClientRect().width;
      }
      loopWidth = total;
      return total;
    };

    const hasOverflow = () => {
      const baseWidth = loopWidth || measureLoopWidth();
      return container.clientWidth < baseWidth;
    };

    const ensureInitialPosition = () => {
      if (!loopWidth) return;
      if (container.scrollLeft <= 0 || container.scrollLeft >= loopWidth * 2) {
        container.scrollLeft = loopWidth;
      }
    };

    const stopAnimation = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTimestamp = null;
    };

    const startAnimation = () => {
      if (!mobileWidthQuery.matches || reduceMotionQuery.matches) {
        stopAnimation();
        return;
      }
      if (!hasOverflow()) {
        stopAnimation();
        container.scrollLeft = 0;
        return;
      }
      if (rafId !== null || isPaused) return;
      ensureInitialPosition();
      lastTimestamp = null;
      const step = (timestamp: number) => {
        if (!container || isPaused || !mobileWidthQuery.matches || reduceMotionQuery.matches) {
          stopAnimation();
          return;
        }
        if (!hasOverflow()) {
          stopAnimation();
          container.scrollLeft = 0;
          return;
        }
        if (!lastTimestamp) {
          lastTimestamp = timestamp;
        }
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        const cycleWidth = loopWidth || measureLoopWidth();
        const increment = (cycleWidth / SCROLL_DURATION) * delta;
        isAutoScrolling = true;
        let nextPosition = container.scrollLeft - increment;
        while (nextPosition < 0) {
          nextPosition += cycleWidth;
        }
        container.scrollLeft = nextPosition;
        isAutoScrolling = false;
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    const pauseAnimation = () => {
      isPaused = true;
      stopAnimation();
    };

    const scheduleResume = () => {
      if (reduceMotionQuery.matches) return;
      if (resumeTimeout) {
        window.clearTimeout(resumeTimeout);
      }
      resumeTimeout = window.setTimeout(() => {
        if (!hasOverflow()) return;
        isPaused = false;
        startAnimation();
      }, RESUME_DELAY);
    };

    const handlePointerDown = () => {
      pauseAnimation();
      if (resumeTimeout) {
        window.clearTimeout(resumeTimeout);
      }
    };

    const handlePointerUp = () => {
      scheduleResume();
    };

    const handleWheel = () => {
      pauseAnimation();
      scheduleResume();
    };

    const handleScroll = () => {
      if (isAutoScrolling) return;
      pauseAnimation();
      scheduleResume();
    };

    const handleMediaChange = () => {
      if (mobileWidthQuery.matches && !reduceMotionQuery.matches) {
        measureLoopWidth();
        isPaused = false;
        startAnimation();
      } else {
        pauseAnimation();
      }
    };

    const handleReduceMotionChange = () => {
      if (reduceMotionQuery.matches) {
        pauseAnimation();
      } else {
        scheduleResume();
      }
    };

    const addMediaListener = (mediaQuery: MediaQueryList, listener: () => void) => {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", listener);
      } else {
        // Safari <14 fallback
        mediaQuery.addListener(listener);
      }
    };

    const removeMediaListener = (mediaQuery: MediaQueryList, listener: () => void) => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerUp);
    container.addEventListener("touchend", handlePointerUp);
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("scroll", handleScroll);
    addMediaListener(mobileWidthQuery, handleMediaChange);
    addMediaListener(reduceMotionQuery, handleReduceMotionChange);

    const resizeObserver = new ResizeObserver(() => {
      loopWidth = 0;
      if (!hasOverflow()) {
        pauseAnimation();
        container.scrollLeft = 0;
      } else {
        scheduleResume();
      }
    });
    resizeObserver.observe(container);

    handleMediaChange();

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
      container.removeEventListener("touchend", handlePointerUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
      removeMediaListener(mobileWidthQuery, handleMediaChange);
      removeMediaListener(reduceMotionQuery, handleReduceMotionChange);
      resizeObserver.disconnect();
      if (resumeTimeout) {
        window.clearTimeout(resumeTimeout);
      }
      stopAnimation();
    };
  }, []);

  const getNavClasses = (path: string) =>
    cn(
      "group flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-prompt transition-all",
      isActive(path)
        ? "bg-white text-foreground shadow-sm border border-primary/10"
        : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
    );

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-2xl border-2 border-emerald-100 bg-emerald-600 text-white shadow-[0_5px_15px_rgba(16,185,129,0.35)] transition hover:scale-105 hover:bg-emerald-500"
                  aria-label="เปิดเมนูนำทาง"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-white/95">
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-prompt gap-2"
                          aria-current={isActive(link.path) ? "page" : undefined}
                        >
                          <i
                            className={`${link.iconClass} text-base`}
                            style={{ color: link.color, minWidth: "1rem" }}
                            aria-hidden="true"
                          />
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                  {adminLinks.length > 0 && (
                    <div className="flex flex-col gap-2 border-t pt-4">
                      {adminLinks.map((link) => (
                        <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant={isActive(link.path) ? "secondary" : "ghost"}
                            className="w-full justify-start font-prompt"
                          >
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <Button
                      asChild
                      className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 font-prompt text-white shadow-[0_10px_25px_rgba(234,88,12,0.4)]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to={quickAction.path}>
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {quickAction.label}
                        </div>
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link
            to="/"
            className="flex items-center gap-3 sm:gap-4 font-bold text-xl text-primary shrink-0"
            aria-label="Petskub homepage"
          >
            <img
              src={Logo}
              alt="Petskub logo"
              className="h-12 w-auto drop-shadow-[0_6px_18px_rgba(249,115,22,0.4)] sm:h-14 lg:h-16"
              loading="eager"
            />
            <span className="font-prompt text-xl sm:text-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-transparent bg-clip-text hidden lg:inline">
              Petskub
            </span>
          </Link>

          <div className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-2 px-3 min-w-0">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className={getNavClasses(link.path)}
                  aria-current={isActive(link.path) ? "page" : undefined}
                >
                  <i
                    className={`${link.iconClass} text-base`}
                    style={{ color: link.color, minWidth: "1rem" }}
                    aria-hidden="true"
                  />
                  {link.label}
                </Button>
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className={getNavClasses(link.path)}
                  aria-current={isActive(link.path) ? "page" : undefined}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <Button
            asChild
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 px-4 py-2 font-prompt text-white shadow-[0_10px_25px_rgba(234,88,12,0.4)] hover:scale-[1.02]"
          >
            <Link to={quickAction.path}>
              <MapPin className="h-4 w-4" />
              {quickAction.label}
            </Link>
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="font-prompt gap-2 h-auto py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium">
                    {profile?.full_name || user.email?.split("@")[0] || "ผู้ใช้"}
                  </span>
                </Button>
              </Link>
              <Button
                onClick={signOut}
                size="sm"
                className="font-prompt gap-1 sm:gap-2 rounded-full border-2 border-emerald-100 bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="font-prompt gap-1 sm:gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Button>
            </Link>
          )}
          </div>

          <div className="md:hidden flex flex-col gap-2">
            <div
              ref={mobileNavScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {mobileNavItems.map((link, index) => {
                const isClone = index >= navLinks.length;
                return (
                  <Link
                    key={`${link.path}-${index}`}
                    to={link.path}
                    className="flex-shrink-0 w-[140px]"
                    tabIndex={isClone ? -1 : undefined}
                    aria-hidden={isClone ? "true" : undefined}
                  >
                    <Button
                      variant="ghost"
                      className={cn(getNavClasses(link.path), "w-full justify-center text-xs")}
                      aria-current={!isClone && isActive(link.path) ? "page" : undefined}
                    >
                      <i className={`${link.iconClass} text-sm`} style={{ color: link.color }} aria-hidden="true" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            <Button
              asChild
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 font-prompt text-white shadow-[0_10px_25px_rgba(234,88,12,0.4)]"
            >
              <Link to={quickAction.path}>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {quickAction.label}
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
