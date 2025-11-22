import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MOBILE_QUERY = "(max-width: 640px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type AutoRouteCarouselOptions = {
  delayMs?: number;
  resumeDelayMs?: number;
  enabled?: boolean;
};

export const useAutoRouteCarousel = (
  routes: string[],
  { delayMs = 3000, resumeDelayMs = 2500, enabled = true }: AutoRouteCarouselOptions = {}
) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!routes.length) return;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    if (!mobileQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    let routeTimer: number | null = null;
    let resumeTimer: number | null = null;
    let paused = false;

    const clearRouteTimer = () => {
      if (routeTimer) {
        window.clearTimeout(routeTimer);
        routeTimer = null;
      }
    };

    const clearResumeTimer = () => {
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const scheduleNextRoute = () => {
      if (paused) return;
      clearRouteTimer();

      const currentIndex = routes.indexOf(location.pathname);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % routes.length;

      routeTimer = window.setTimeout(() => {
        navigate(routes[nextIndex]);
      }, delayMs);
    };

    const handleInteraction = () => {
      paused = true;
      clearRouteTimer();
      clearResumeTimer();
      resumeTimer = window.setTimeout(() => {
        paused = false;
        scheduleNextRoute();
      }, resumeDelayMs);
    };

    const handlePointerEnter = () => {
      paused = true;
      clearRouteTimer();
    };

    const handlePointerLeave = () => {
      paused = false;
      scheduleNextRoute();
    };

    const handleMobileChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        paused = true;
        clearRouteTimer();
      } else if (!paused && !reducedMotionQuery.matches) {
        scheduleNextRoute();
      }
    };

    const handleReduceMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        paused = true;
        clearRouteTimer();
        clearResumeTimer();
      } else if (mobileQuery.matches) {
        paused = false;
        scheduleNextRoute();
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "touchstart",
      "touchmove",
      "wheel",
      "pointerdown",
    ];

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    document.addEventListener("pointerenter", handlePointerEnter);
    document.addEventListener("pointerleave", handlePointerLeave);
    const addMediaListener = (mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) => {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", listener);
      } else {
        mediaQuery.addListener(listener);
      }
    };

    const removeMediaListener = (mediaQuery: MediaQueryList, listener: (event: MediaQueryListEvent) => void) => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };

    addMediaListener(mobileQuery, handleMobileChange);
    addMediaListener(reducedMotionQuery, handleReduceMotionChange);

    scheduleNextRoute();

    return () => {
      clearRouteTimer();
      clearResumeTimer();
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
      document.removeEventListener("pointerenter", handlePointerEnter);
      document.removeEventListener("pointerleave", handlePointerLeave);
      removeMediaListener(mobileQuery, handleMobileChange);
      removeMediaListener(reducedMotionQuery, handleReduceMotionChange);
    };
  }, [enabled, routes, delayMs, resumeDelayMs, location.pathname, navigate]);
};
