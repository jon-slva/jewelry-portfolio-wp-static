import site from '../../content/site.json';
import pageStyles from '../page.module.scss';
import ContactForm from './ContactForm';
import styles from './ContactPage.module.scss';

const linkedIn = site.social.find((link) => link.label.toLowerCase() === 'linkedin');

export function meta() {
  return [
    { title: `Contact Me – ${site.title}` },
    {
      name: 'description',
      content: `Get in touch with ${site.title.replace(/^Jewelry by /, '')}.`,
    },
  ];
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
