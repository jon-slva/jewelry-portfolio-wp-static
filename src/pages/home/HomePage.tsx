import site from '../../content/site.json';
import styles from '../page.module.scss';

export function meta() {
  return [
    { title: `${site.title} – ${site.tagline}` },
    { name: 'description', content: site.tagline },
  ];
}

export default function HomePage() {
  return (
    <section>
      <h1 className={styles.title}>Portfolio</h1>
      {/* TODO(phase 1d): category/tag filter bar + portfolio grid driven by grid.json. */}
      <p className={styles.note}>The portfolio grid and filters will appear here.</p>
    </section>
  );
}
