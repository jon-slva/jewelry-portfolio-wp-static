import { useEffect, useRef, useState } from 'react';
import { pickVariant } from '../../content/media.ts';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';
import styles from './LoopVideo.module.scss';
import type { LoopVideoProps } from './LoopVideo.types.ts';

/**
 * A short, silent, looping video that behaves like a GIF (e.g. a turnaround).
 *
 * - The file only starts downloading when the video scrolls near the screen,
 *   and it pauses when scrolled away.
 * - Until then (and in the pre-rendered HTML) the poster image is shown.
 * - Visitors who ask their device for reduced motion get the poster with
 *   play controls instead of autoplay.
 */
export default function LoopVideo({
  video,
  poster,
  alt,
  displayWidth = 800,
  className,
}: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  // Set once the video first comes near the screen, and kept, so scrolling
  // back doesn't download it again.
  const [loaded, setLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const url = video ? `${import.meta.env.BASE_URL}${video.url}` : undefined;

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) return;

    // Browsers only autoplay muted videos. Set it directly, since React
    // doesn't reliably apply the `muted` attribute.
    element.muted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          // play() fails if the browser blocks autoplay (e.g. in low-power
          // mode). The poster stays visible then, which is fine.
          element.play().catch(() => {});
        } else {
          element.pause();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  if (!url) return null;
  const posterVariant = poster && pickVariant(poster.webp, displayWidth * 2);

  return (
    <video
      ref={ref}
      className={className ? `${styles.video} ${className}` : styles.video}
      src={reducedMotion || loaded ? url : undefined}
      poster={posterVariant ? `${import.meta.env.BASE_URL}${posterVariant.url}` : undefined}
      width={poster?.width}
      height={poster?.height}
      // An empty alt marks the video as decorative, like an <img alt="">.
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={{ backgroundColor: poster?.color }}
      loop
      muted
      playsInline
      preload="none"
      autoPlay={!reducedMotion}
      controls={reducedMotion}
    />
  );
}
