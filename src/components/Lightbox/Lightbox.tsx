import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import Picture from '../Picture/Picture';
import styles from './Lightbox.module.scss';
import type { LightboxProps } from './Lightbox.types.ts';

/** How far a swipe must travel, in pixels, to change image. */
const SWIPE_DISTANCE = 50;

/**
 * Full-screen image viewer, built on the browser's <dialog> element.
 *
 * showModal() gives the accessibility essentials for free: the rest of the
 * page can't be clicked or tabbed into, Escape closes it, and focus returns
 * to the image that opened it. On top of that: arrow keys and swiping move
 * between images, and clicking the dark backdrop closes it.
 */
export default function Lightbox({ images, index, onIndexChange }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<number | null>(null);
  const open = index !== null;

  // Keep the <dialog> in sync with `index`.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // Start keyboard focus on Close. (React's autoFocus would run before
      // the dialog is open, and the browser would pick the first button.)
      closeButton.current?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);
  // The page behind stops scrolling while the viewer is open: see the
  // `html:has(dialog[open])` rule in src/styles/global.scss.

  const current = index === null ? undefined : images[index];
  const count = images.length;
  // Wraps around: next after the last image is the first.
  const step = (by: number) => {
    if (index !== null) onIndexChange((index + by + count) % count);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  };
  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) > SWIPE_DISTANCE) step(distance < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialog}
      className={styles.lightbox}
      aria-label="Image viewer"
      // Escape (or the browser's own close) closes the dialog; tell the page.
      onClose={() => onIndexChange(null)}
      onKeyDown={onKeyDown}
      // A click on the backdrop lands on the <dialog> itself, not its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onIndexChange(null);
      }}
    >
      {current && index !== null && (
        <>
          <figure className={styles.figure} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            <Picture
              key={index}
              image={current.image}
              alt={current.alt}
              sizes="100vw"
              priority
              className={styles.picture}
            />
            <figcaption className={styles.counter} aria-live="polite">
              {index + 1} / {count}
            </figcaption>
          </figure>

          {count > 1 && (
            <>
              <button
                type="button"
                className={`${styles.button} ${styles.previous}`}
                onClick={() => step(-1)}
                aria-label="Previous image"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.next}`}
                onClick={() => step(1)}
                aria-label="Next image"
              />
            </>
          )}
          <button
            ref={closeButton}
            type="button"
            className={`${styles.button} ${styles.close}`}
            onClick={() => onIndexChange(null)}
            aria-label="Close"
          />
        </>
      )}
    </dialog>
  );
}
