import type { ReactNode } from 'react';
import type { PortfolioData } from './portfolio.data.ts';

export interface PortfolioViewProps {
  data: PortfolioData;
  /** Line under the heading, e.g. which tag is shown. */
  intro?: ReactNode;
  /** Category slug whose filter is highlighted. */
  activeCategory?: string;
  /** Highlight no filter at all (tag pages). */
  noneActive?: boolean;
}
