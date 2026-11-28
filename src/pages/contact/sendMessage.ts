import type { ContactMessage, SendResult } from './contact.types.ts';

// Sends the contact form to Web3Forms, which emails it to the address the
// access key belongs to. Kept apart from the form so it can be tested.

export const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export async function sendMessage(
  accessKey: string,
  { name, email, message }: ContactMessage,
  // Swappable in tests.
  post: typeof fetch = fetch,
): Promise<SendResult> {
  try {
    const response = await post(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New message from ${name} via jewelrybyjs.com`,
        from_name: name,
        name,
        email,
        message,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };
    if (response.ok && result.success) return { ok: true };
    return {
      ok: false,
      error: result.message || `The message service answered ${response.status}.`,
    };
  } catch {
    return { ok: false, error: 'Couldn’t reach the message service. Check your connection.' };
  }
}
