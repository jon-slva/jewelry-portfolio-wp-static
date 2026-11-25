export interface NavItem {
  label: string;
  to: string;
  /** Other URL prefixes that also highlight this item, e.g. pages inside a section. */
  section?: string[];
}

/** Main menu, in display order. Paths are relative to the site base path. */
export const mainNav: NavItem[] = [
  {
    label: 'Portfolio',
    to: '/',
    section: ['/portfolio-category/', '/portfolio-tag/', '/portfolio-item/'],
  },
  { label: 'Contact Me', to: '/contact-me/' },
  { label: 'Resume', to: '/resume/' },
];

/** Whether a menu item should show as active for the current path. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return path === item.to || (item.section ?? []).some((prefix) => path.startsWith(prefix));
}
