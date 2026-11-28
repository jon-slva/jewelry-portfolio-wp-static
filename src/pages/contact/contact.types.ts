export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export interface ContactFormProps {
  /** Web3Forms access key from site.json. */
  accessKey: string;
}
