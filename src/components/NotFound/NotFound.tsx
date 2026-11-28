import { Link } from 'react-router';
import styles from './NotFound.module.scss';

/** Used by the catch-all route and by the root error boundary for 404s. */
export default function NotFound() {
  return (
    <section className={styles.notFound}>
      <h1>Page not found</h1>
      <p>The page you are looking for doesn't exist or has moved.</p>
      <Link to="/" className={styles.back}>
        Back to the portfolio
      </Link>
    </section>
  );
}
