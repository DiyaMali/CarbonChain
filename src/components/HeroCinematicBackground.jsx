import React, { useEffect, useRef, useState } from "react";

/**
 * Cinematic Cropped, Looping Video Background Component
 * 
 * - Video source: /hero.mp4 (with /hero-bg.png as fallback/poster)
 * - Cropped to aspect ratio 882/440 with object-position center 68%
 *   to cleanly display only the illustration (wind turbines, solar panel, green hill)
 * - CSS mask dissolves top and side edges into the background
 * - Custom requestAnimationFrame fade-in (0.5s) and fade-out (0.5s) loop
 * - Respects prefers-reduced-motion
 */
export default function HeroCinematicBackground() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setOpacity(1);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let animFrameId = null;
    let restartTimeoutId = null;

    const updateFade = () => {
      if (!video) return;

      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration && !isNaN(duration)) {
        const FADE_TIME = 0.5; // seconds

        if (currentTime < FADE_TIME) {
          // Fade in at the start
          setOpacity(Math.min(1, Math.max(0, currentTime / FADE_TIME)));
        } else if (currentTime > duration - FADE_TIME) {
          // Fade out before the end
          setOpacity(Math.max(0, (duration - currentTime) / FADE_TIME));
        } else {
          setOpacity(1);
        }
      }

      animFrameId = requestAnimationFrame(updateFade);
    };

    const handleEnded = () => {
      setOpacity(0);
      restartTimeoutId = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    };

    const handlePlay = () => {
      animFrameId = requestAnimationFrame(updateFade);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);

    // Try starting playback
    video.play().then(() => {
      animFrameId = requestAnimationFrame(updateFade);
    }).catch(() => {
      // In case autoplay is blocked or deferred, keep poster visible
      setOpacity(1);
    });

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (restartTimeoutId) clearTimeout(restartTimeoutId);
      if (video) {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("ended", handleEnded);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 w-full max-w-[1400px] mx-auto overflow-hidden pointer-events-none z-0 hero-video-mask"
      style={{
        aspectRatio: "882 / 440",
      }}
      aria-hidden="true"
    >
      {/* Fallback/Poster static image */}
      <img
        src="/hero-bg.png"
        alt="Clean energy illustration"
        className="absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-500"
        style={{
          opacity: opacity > 0 ? 0 : 0.9,
        }}
      />

      {/* Looping video without native loop attribute */}
      {!isReducedMotion && (
        <video
          ref={videoRef}
          src="/hero.mp4"
          poster="/hero-bg.png"
          muted
          playsInline
          autoPlay
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-150"
          style={{
            opacity: opacity,
          }}
        />
      )}

      {/* Gradient overlay to soften transitions into the page background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-transparent to-[#FFFFFF]/90 pointer-events-none" />
    </div>
  );
}
