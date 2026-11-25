import site from '../../content/site.json';
import styles from '../page.module.scss';
import type { Route } from './+types/ItemPage';

export function meta({ params }: Route.MetaArgs) {
  // TODO(phase 1e): real title, description and Open Graph image from the item file.
  return [{ title: `${params.slug} – ${site.title}` }];
}

export default function ItemPage({ params }: Route.ComponentProps) {
  // TODO(phase 1d): load the item from src/content/items and render its layout.
  return (
    <section>
      <h1 className={styles.title}>{params.slug}</h1>
      <p className={styles.note}>Portfolio item page – images and details will appear here.</p>
    </section>
  );
}
