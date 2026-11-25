import { defaultShareImage } from '../../content';
import site from '../../content/site.json';
import { pageMeta } from '../../seo.ts';
import pageStyles from '../page.module.scss';
import ContactForm from './ContactForm';
import type { Route } from './+types/ContactPage';
import styles from './ContactPage.module.scss';

const linkedIn = site.social.find((link) => link.label.toLowerCase() === 'linkedin');

// Only for the share image; runs at build time.
export function loader() {
  return { shareImage: defaultShareImage() };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta({
    title: 'Contact Me',
    description: `Get in touch with ${site.title.replace(/^Jewelry by /, '')} about commissions, collaborations or CAD/CAM work.`,
    path: '/contact-me/',
    image: loaderData?.shareImage,
  });
}

export default function ContactPage() {
  return (
    <section>
      <h1 className={pageStyles.title}>Contact Me</h1>
      <p className={pageStyles.intro}>
        For commissions, collaborations or questions, send me a message
        {linkedIn && (
          <>
            {' '}
            or find me on{' '}
            <a
              href={linkedIn.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              LinkedIn
            </a>
          </>
        )}
        .
      </p>
      {site.contactFormKey ? (
        <ContactForm accessKey={site.contactFormKey} />
      ) : (
        // TODO: add the Web3Forms access key to site.json (contactFormKey) to switch the form on.
        <p className={styles.unavailable}>The contact form isn’t set up yet.</p>
      )}
    </section>
  );
}
