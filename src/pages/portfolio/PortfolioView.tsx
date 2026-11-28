import FilterBar from '../../components/FilterBar/FilterBar';
import PortfolioGrid from '../../components/PortfolioGrid/PortfolioGrid';
import styles from './PortfolioView.module.scss';
import type { PortfolioViewProps } from './portfolio.types.ts';

/** Heading, category filters and the tile grid: the home, category and tag pages. */
export default function PortfolioView({
  data,
  intro,
  activeCategory,
  noneActive,
}: PortfolioViewProps) {
  return (
    <section>
      <h1 className={styles.title}>Portfolio</h1>
      <FilterBar
        categories={data.filterCategories}
        active={activeCategory}
        noneActive={noneActive}
      />
      {intro && <p className={styles.intro}>{intro}</p>}
      <PortfolioGrid tiles={data.tiles} columns={data.columns} gap={data.gap} />
    </section>
  );
}
