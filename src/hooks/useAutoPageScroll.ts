import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 640px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type AutoPageScrollOptions = {
  targetSelector?: string;
  offset?: number;
  durationMs?: number;
  resumeDelayMs?: number;
};

export function useAutoPageScroll(options: AutoPageScrollOptions = {}) {
  const {
    targetSelector,
    offset = 0,
    durationMs = 3000,
    resumeDelayMs = 2500,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    if (!mobileQuery.matches) return;

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    if (reducedMotionQuery.matches) return;

    const resolveTarget = () => {
      if (targetSelector) {
        return document.querySelector<HTMLElement>(targetSelector);
      }
      return null;
    };

    const computeTargetY = () => {
      const targetEl = resolveTarget();
      if (targetSelector && !targetEl) {
        return null;
      }
      if (targetEl) {
        return targetEl.getBoundingClientRect().top + window.scrollY - offset;
      }
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    };

    let rafId: number | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;
    let interactionPaused = false;
    let hoverPaused = false;
    let destroyed = false;

    const cancelAnimation = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const stopAll = () => {
      cancelAnimation();
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }
    };

    const isPaused = () => interactionPaused || hoverPaused || destroyed;

    const runAnimation = () => {
      if (isPaused() || !mobileQuery.matches) {
        cancelAnimation();
        return;
      }

      const targetY = computeTargetY();
      if (targetY === null) {
        return;
      }

      const currentY = window.scrollY;
      const adjustedCurrentY = targetY <= currentY + 1 ? 0 : currentY;
      if (adjustedCurrentY !== currentY) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      const distance = targetY - adjustedCurrentY;
      if (distance <= 0) {
        return;
      }

      const duration = Math.max(durationMs, (distance / window.innerHeight) * durationMs);
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (isPaused()) {
          cancelAnimation();
          return;
        }
        if (!mobileQuery.matches || reducedMotionQuery.matches) {
          cancelAnimation();
          return;
        }

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        window.scrollTo({ top: adjustedCurrentY + distance * eased, behavior: "auto" });

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          cancelAnimation();
          if (!isPaused()) {
            requestAnimationFrame(() => {
              if (!isPaused()) {
                window.scrollTo({ top: 0, behavior: "auto" });
                runAnimation();
              }
            });
          }
        }
      };

      cancelAnimation();
      rafId = requestAnimationFrame(step);
    };

    const scheduleResume = () => {
      if (reducedMotionQuery.matches) return;
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }
      resumeTimeout = setTimeout(() => {
        interactionPaused = false;
        runAnimation();
      }, resumeDelayMs);
    };

    const handleUserInteraction = () => {
      interactionPaused = true;
      cancelAnimation();
      scheduleResume();
    };

    const handlePointerEnter = () => {
      hoverPaused = true;
      cancelAnimation();
    };

    const handlePointerLeave = () => {
      hoverPaused = false;
      if (!interactionPaused) {
        runAnimation();
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "touchstart",
      "touchmove",
      "wheel",
      "pointerdown",
    ];

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { passive: true });
    });

    document.addEventListener("pointerenter", handlePointerEnter);
    document.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver(() => {
      if (!isPaused()) {
        runAnimation();
      }
    });
    resizeObserver.observe(document.body);

    const handleMobileChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        interactionPaused = true;
        hoverPaused = false;
        stopAll();
      } else if (!isPaused()) {
        runAnimation();
      }
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        interactionPaused = true;
        hoverPaused = false;
        destroyed = true;
        stopAll();
      }
    };

    mobileQuery.addEventListener("change", handleMobileChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    runAnimation();

    return () => {
      destroyed = true;
      stopAll();
      resizeObserver.disconnect();
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });
      document.removeEventListener("pointerenter", handlePointerEnter);
      document.removeEventListener("pointerleave", handlePointerLeave);
      mobileQuery.removeEventListener("change", handleMobileChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, [targetSelector, offset, durationMs, resumeDelayMs]);
}
