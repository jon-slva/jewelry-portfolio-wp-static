import LoopVideo from '../../components/LoopVideo/LoopVideo';
import Picture from '../../components/Picture/Picture';
import YouTubeEmbed from '../../components/YouTubeEmbed/YouTubeEmbed';
import type { MediaTileProps } from './item.types.ts';
import styles from './ItemMedia.module.scss';

/** One gallery entry: an image that opens the lightbox, a looping video, or a YouTube video. */
export default function MediaTile({
  media,
  sizes,
  imageIndex,
  imageCount,
  priority = false,
  onOpenImage,
}: MediaTileProps) {
  switch (media.type) {
    case 'image':
      return (
        <button
          type="button"
          className={styles.imageButton}
          onClick={() => imageIndex !== undefined && onOpenImage(imageIndex)}
          aria-label={`View larger (${(imageIndex ?? 0) + 1} of ${imageCount}): ${media.alt}`}
        >
          <Picture image={media.image} alt={media.alt} sizes={sizes} priority={priority} />
        </button>
      );
    case 'video':
      return <LoopVideo video={media.video} poster={media.poster} alt={media.alt} />;
    case 'youtube':
      return <YouTubeEmbed id={media.id} title={media.title} />;
  }
}
