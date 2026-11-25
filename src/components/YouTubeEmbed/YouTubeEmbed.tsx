import { useState } from 'react';
import styles from './YouTubeEmbed.module.scss';
import type { YouTubeEmbedProps } from './YouTubeEmbed.types.ts';

/**
 * A YouTube video that loads only when clicked ("click to play").
 *
 * A real YouTube player downloads close to 1 MB of scripts and sets tracking
 * cookies as soon as the page opens. Until clicked, this is just the video's
 * thumbnail and a play button. The player then comes from youtube-nocookie.com,
 * YouTube's privacy-enhanced domain, and starts playing straight away.
 */
export default function YouTubeEmbed({ id, title, className }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const classes = className ? `${styles.embed} ${className}` : styles.embed;

  if (playing) {
    return (
      <div className={classes}>
        <iframe
          className={styles.frame}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button type="button" className={classes} onClick={() => setPlaying(true)}>
      <img
        className={styles.thumbnail}
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className={styles.play} aria-hidden="true" />
      <span className={styles.visuallyHidden}>Play video: {title}</span>
    </button>
  );
}
