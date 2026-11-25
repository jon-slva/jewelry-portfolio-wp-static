import site from '../../content/site.json';
import styles from '../page.module.scss';

export function meta() {
  return [{ title: `Contact Me – ${site.title}` }];
}

export default function ContactPage() {
  return (
    <section>
      <h1 className={styles.title}>Contact Me</h1>
      {/* TODO(phase 1d): Web3Forms contact form + LinkedIn link. */}
      <p className={styles.note}>The contact form will appear here.</p>
    </section>
  );
}
