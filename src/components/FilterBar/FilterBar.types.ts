import type { Term } from '../../content/schema.ts';

export interface FilterBarProps {
  /** Categories to offer, in filter-bar order. */
  categories: Term[];
  /** Slug of the category being shown. None means "Show all" is active. */
  active?: string;
  /** Set on tag pages, where neither "Show all" nor a category is active. */
  noneActive?: boolean;
}
