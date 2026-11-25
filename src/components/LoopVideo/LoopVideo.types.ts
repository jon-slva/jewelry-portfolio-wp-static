import type { ImageInfo, VideoInfo } from '../../content/media.ts';

export interface LoopVideoProps {
  /** From getVideo() in src/content. Renders nothing when missing. */
  video: VideoInfo | undefined;
  /** Still image shown before the video plays (from getImage()). */
  poster: ImageInfo | undefined;
  /** Describes the video for screen readers. Empty when nearby text already does. */
  alt: string;
  /** Roughly how wide it's shown, in pixels, to pick a sharp enough poster. */
  displayWidth?: number;
  className?: string;
}
