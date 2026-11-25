import { describe, expect, it, vi } from 'vitest';
import { sendMessage, WEB3FORMS_URL } from './sendMessage.ts';

const message = { name: 'Ada', email: 'ada@example.com', message: 'Hello!' };
const reply = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('sendMessage', () => {
  it('posts the message with the access key and reports success', async () => {
    const post = reply(200, { success: true });
    expect(await sendMessage('key-123', message, post)).toEqual({ ok: true });

    const [url, init] = post.mock.calls[0];
    expect(url).toBe(WEB3FORMS_URL);
    expect(JSON.parse(init.body)).toMatchObject({
      access_key: 'key-123',
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello!',
    });
  });

  it('passes on the service’s error message', async () => {
    const post = reply(400, { success: false, message: 'Invalid access key' });
    expect(await sendMessage('bad', message, post)).toEqual({
      ok: false,
      error: 'Invalid access key',
    });
  });

  it('reports a network failure', async () => {
    const post = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await sendMessage('key', message, post);
    expect(result.ok).toBe(false);
  });
});
