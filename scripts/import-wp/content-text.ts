import { parse } from 'node-html-parser';
import type { ItemText } from './types.ts';

// Turns a portfolio item's WordPress post body into clean fields.
//
// The bodies look like this (Visual Composer shortcodes + simple HTML):
//   [vc_row ...][vc_column][vc_column_text]
//   <h2>Wall-E Necklace</h2>
//   <h4>Rocklove X Pixar</h4>
//   [/vc_column_text][vc_empty_space][vc_column_text]
//   A piece in the likeness of ...
//   <strong>Software</strong>: Zbrush, Rhinoceros 3D, Matrix
//   <strong>Client</strong>: Pixar, Rocklove
//   [/vc_column_text][/vc_column][/vc_row]

/** Visual Composer shortcodes, opening or closing: [vc_row ...], [/vc_column]. */
const SHORTCODE = /\[\/?vc_[a-z_]*(?:\s[^\]]*)?\]/g;

/** "<strong>Software</strong>: ..." style lines. */
const LABELLED_LINE = /^\s*<strong>\s*(software|client)\s*<\/strong>\s*:?\s*(.*)$/i;

export function stripShortcodes(html: string): string {
  return html.replace(SHORTCODE, '\n');
}

/** HTML fragment -> plain text, with entities decoded and non-breaking spaces removed. */
export function htmlToText(html: string): string {
  return parse(html)
    .text.replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function extractItemText(body: string, fallbackTitle: string): ItemText {
  const root = parse(stripShortcodes(body));

  // Junk a browser translation extension saved into some posts.
  root.querySelectorAll('#gtx-trans').forEach((el) => el.remove());

  const h2 = root.querySelector('h2');
  const h4 = root.querySelector('h4');
  const title = h2 ? htmlToText(h2.innerHTML) : fallbackTitle.trim();
  const subtitle = h4 ? htmlToText(h4.innerHTML) : '';
  h2?.remove();
  h4?.remove();

  let software: string[] = [];
  let client = '';
  const descriptionLines: string[] = [];

  for (const line of root.toString().split('\n')) {
    const labelled = LABELLED_LINE.exec(line);
    if (labelled) {
      const value = htmlToText(labelled[2]);
      if (labelled[1].toLowerCase() === 'software') {
        software = value
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean);
      } else {
        client = value;
      }
    } else {
      descriptionLines.push(htmlToText(line));
    }
  }

  const description = toParagraphs(descriptionLines);
  const leftovers = /[<[\]>]/.test(description) ? [description] : [];

  return { title, subtitle, description, software, client, leftovers };
}

/**
 * Joins lines into paragraphs separated by a blank line, the way WordPress
 * displays them: a blank line starts a new paragraph, a single newline is a
 * line break inside one.
 */
export function toParagraphs(lines: string[]): string {
  const paragraphs: string[][] = [[]];
  for (const line of lines) {
    if (line) paragraphs[paragraphs.length - 1].push(line);
    else if (paragraphs[paragraphs.length - 1].length) paragraphs.push([]);
  }
  return paragraphs
    .filter((lines) => lines.length)
    .map((lines) => lines.join('\n'))
    .join('\n\n');
}
