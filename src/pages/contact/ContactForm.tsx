import { useState, type FormEvent } from 'react';
import type { ContactFormProps } from './contact.types.ts';
import styles from './ContactForm.module.scss';
import { sendMessage, WEB3FORMS_URL } from './sendMessage.ts';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Name / email / message form, delivered by Web3Forms.
 *
 * It also works without JavaScript: it's a normal form that posts to
 * Web3Forms, which then shows its own confirmation page. With JavaScript the
 * page stays put and shows the result here instead.
 */
export default function ContactForm({ accessKey }: ContactFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // Spam trap: real visitors never see or tick this box.
    if (data.get('botcheck')) return;

    setStatus('sending');
    const result = await sendMessage(accessKey, {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    });
    if (result.ok) {
      form.reset();
      setStatus('sent');
    } else {
      setError(result.error);
      setStatus('error');
    }
  }

  return (
    <form className={styles.form} action={WEB3FORMS_URL} method="POST" onSubmit={onSubmit}>
      <input type="hidden" name="access_key" value={accessKey} />
      <input
        type="checkbox"
        name="botcheck"
        className={styles.trap}
        tabIndex={-1}
        aria-hidden="true"
      />

      <label className={styles.field}>
        <span>Name</span>
        <input name="name" type="text" autoComplete="name" required maxLength={200} />
      </label>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required maxLength={200} />
      </label>
      <label className={styles.field}>
        <span>Message</span>
        <textarea name="message" rows={7} required maxLength={5000} />
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {/* Announced by screen readers when it changes. */}
        <p className={styles.status} role="status">
          {status === 'sent' && 'Thanks, your message was sent. I’ll get back to you soon.'}
          {status === 'error' && `Sorry, it didn’t send: ${error}`}
        </p>
      </div>
    </form>
  );
}
