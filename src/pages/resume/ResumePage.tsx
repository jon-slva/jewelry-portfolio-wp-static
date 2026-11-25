import site from '../../content/site.json';
import styles from '../page.module.scss';

export function meta() {
  return [{ title: `Resume – ${site.title}` }];
}

export default function ResumePage() {
  return (
    <section>
      <h1 className={styles.title}>Resume</h1>
      {/* TODO(phase 1d): resume preview image linking to the PDF. */}
      <p className={styles.note}>The resume preview and PDF link will appear here.</p>
    </section>
  );
}
