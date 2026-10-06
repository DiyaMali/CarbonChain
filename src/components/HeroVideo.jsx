import { useEffect, useRef } from "react";

const FADE = 0.5; // seconds

/**
 * HeroVideo  -  exact implementation from sprout-hero reference.
 * - Placed absolute at the bottom of the hero section.
 * - Custom fade-in / fade-out loop via requestAnimationFrame.
 * - CSS mask dissolves edges into the white background.
 * - Respects prefers-reduced-motion.
 */
export default function HeroVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      video.pause();
      video.style.opacity = "1";
      return;
    }

    let raf = 0;
    let timeout;

    const tick = () => {
      const { currentTime: t, duration: d } = video;
      if (d && isFinite(d)) {
        const fadeIn = t / FADE;
        const fadeOut = (d - t) / FADE;
        video.style.opacity = String(Math.max(0, Math.min(1, fadeIn, fadeOut)));
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      video.style.opacity = "0";
      timeout = setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener("ended", onEnded);
    video.play().catch(() => {});
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 z-0 w-full overflow-visible pointer-events-none flex items-end justify-center">
      <video
        ref={videoRef}
        className="w-full h-auto max-h-[85vh] object-contain object-bottom"
        style={{
          opacity: 0,
          filter: "saturate(1.15) contrast(1.1) brightness(1.02)",
        }}
        src="/hero.mp4"
        poster="/poster.jpg"
        muted
        playsInline
        autoPlay
        preload="auto"
      />
      {/* Light edge blending only */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-transparent" />
    </div>
  );
}
