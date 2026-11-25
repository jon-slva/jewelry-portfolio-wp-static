import { useState, type PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router';
import logo from '../../content/media/site/logo.png';
import site from '../../content/site.json';
import { isNavActive, mainNav } from './navigation';
import styles from './SiteLayout.module.scss';

/**
 * Page frame from the Anders theme: fixed left sidebar on desktop,
 * top bar with a menu button on smaller screens.
 */
export default function SiteLayout({ children }: PropsWithChildren) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const closeMenu = () => setMenuOpen(false);
  const year = new Date().getFullYear();

  return (
    <div className={styles.frame}>
      <header className={styles.sidebar}>
        <div className={styles.topRow}>
          <Link to="/" className={styles.logo} onClick={closeMenu}>
            <img src={logo} alt={site.title} width={639} height={156} />
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.menuIcon} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Menu</span>
          </button>
        </div>

        <div id="site-menu" className={styles.menu} data-open={menuOpen}>
          <nav aria-label="Main">
            <ul className={styles.navList}>
              {mainNav.map((item) => {
                const active = isNavActive(item, pathname);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={active ? styles.navActive : styles.navLink}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* TODO(phase 1d): swap text labels for LinkedIn / Behance SVG icons. */}
          <ul className={styles.social}>
            {site.social.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <p className={styles.copyright}>
            {site.copyright}
            <br />
            {/* The year is rendered at build time and again in the browser. They can differ
                after New Year until the next rebuild, which is fine, so skip the mismatch warning. */}
            ©Jonathan Silva <span suppressHydrationWarning>{year}</span>
          </p>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
