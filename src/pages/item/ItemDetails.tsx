import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Term } from '../../content/schema.ts';
import type { ItemDetailsProps } from './item.types.ts';
import styles from './ItemDetails.module.scss';

/** Title, description and the facts about the piece (software, client, categories, tags). */
export default function ItemDetails({
  title,
  subtitle,
  description,
  software,
  client,
  categories,
  tags,
}: ItemDetailsProps) {
  return (
    <div className={styles.details}>
      <header className={styles.intro}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {description &&
          description.split('\n\n').map((paragraph) => (
            <p key={paragraph} className={styles.description}>
              {paragraph}
            </p>
          ))}
      </header>

      <dl className={styles.facts}>
        {software.length > 0 && <Fact label="Software">{software.join(', ')}</Fact>}
        {client && <Fact label="Client">{client}</Fact>}
      </dl>

      <dl className={styles.facts}>
        {categories.length > 0 && (
          <Fact label="Category">
            <TermLinks terms={categories} base="/portfolio-category/" />
          </Fact>
        )}
        {tags.length > 0 && (
          <Fact label="Tags">
            <TermLinks terms={tags} base="/portfolio-tag/" />
          </Fact>
        )}
      </dl>
      {/* TODO(phase 1e): LinkedIn share link, once the site's final address is known. */}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt>{label}:</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Comma-separated links to category or tag pages. */
function TermLinks({ terms, base }: { terms: Term[]; base: string }) {
  return terms.map((term, i) => (
    <span key={term.slug}>
      {i > 0 && ', '}
      <Link to={`${base}${term.slug}/`} className={styles.termLink}>
        {term.name}
      </Link>
    </span>
  ));
}
