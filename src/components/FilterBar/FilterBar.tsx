import { Link } from 'react-router';
import styles from './FilterBar.module.scss';
import type { FilterBarProps } from './FilterBar.types.ts';

/**
 * Category filters above the portfolio grid. Each filter is a real link to its
 * own pre-rendered page (/portfolio-category/<slug>/), so a filtered view can
 * be bookmarked or shared, and the old WordPress category links keep working.
 */
export default function FilterBar({ categories, active, noneActive = false }: FilterBarProps) {
  const filters = [
    { label: 'Show all', to: '/', current: !active && !noneActive },
    ...categories.map((category) => ({
      label: category.name,
      to: `/portfolio-category/${category.slug}/`,
      current: category.slug === active,
    })),
  ];

  return (
    <nav aria-label="Filter by category">
      <ul className={styles.filters}>
        {filters.map((filter) => (
          <li key={filter.to}>
            <Link
              to={filter.to}
              // Keep the scroll position: only the grid below changes.
              preventScrollReset
              className={filter.current ? styles.active : styles.filter}
              aria-current={filter.current ? 'page' : undefined}
            >
              {filter.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
