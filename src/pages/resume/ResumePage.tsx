import Picture from '../../components/Picture/Picture';
import { getFile, getImage } from '../../content';
import site from '../../content/site.json';
import { pageMeta } from '../../seo.ts';
import pageStyles from '../page.module.scss';
import type { Route } from './+types/ResumePage';
import styles from './ResumePage.module.scss';

export function loader() {
  return {
    preview: getImage(site.resume.preview),
    pdf: getFile(site.resume.pdf),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta({
    title: 'Resume',
    description: `Resume of ${site.tagline.replace(/^Portfolio of /, '')}: experience, education and skills.`,
    path: '/resume/',
    image: loaderData?.preview,
  });
}

export default function ResumePage({ loaderData }: Route.ComponentProps) {
  const { preview, pdf } = loaderData;
  const pdfUrl = pdf ? `${import.meta.env.BASE_URL}${pdf.url}` : undefined;

  return (
    <section>
      <h1 className={pageStyles.title}>Resume</h1>
      {pdfUrl && (
        <>
          {/* The preview opens the full PDF in a new tab. */}
          <a href={pdfUrl} target="_blank" rel="noopener" className={styles.preview}>
            <Picture
              image={preview}
              alt="First page of the resume (opens the PDF)"
              sizes="(min-width: 1024px) 560px, calc(100vw - 32px)"
              priority
            />
          </a>
          <p className={styles.links}>
            <a href={pdfUrl} target="_blank" rel="noopener">
              Open the PDF
            </a>
            <a href={pdfUrl} download>
              Download
            </a>
          </p>
        </>
      )}
    </section>
  );
}
