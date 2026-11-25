import { describe, expect, it } from 'vitest';
import { extractItemText, stripShortcodes, toParagraphs } from './content-text.ts';

describe('stripShortcodes', () => {
  it('removes Visual Composer shortcodes, opening and closing', () => {
    expect(stripShortcodes('[vc_row a="b"][vc_column]Hi[/vc_column][/vc_row]').trim()).toBe('Hi');
  });

  it('leaves other square brackets alone', () => {
    expect(stripShortcodes('A [note] here')).toBe('A [note] here');
  });
});

describe('toParagraphs', () => {
  it('splits on blank lines and keeps single line breaks', () => {
    expect(toParagraphs(['', 'One', 'still one', '', '', 'Two', ''])).toBe('One\nstill one\n\nTwo');
  });
});

describe('extractItemText', () => {
  it('splits a Visual Composer post into fields', () => {
    const body = [
      '[vc_row enable_hue_rotation="no"][vc_column][vc_column_text]',
      '<h2 class="entry-title">Wall-E &amp; Friends</h2>',
      '<h4>Rocklove X Pixar</h4>',
      '[/vc_column_text][vc_empty_space][vc_column_text]',
      '',
      'First paragraph.',
      '',
      '[vc_empty_space]',
      '',
      '<strong>Software</strong>: Zbrush, Rhinoceros 3D,  Matrix &nbsp;',
      '',
      '<strong>Client</strong>: Pixar, Rocklove',
      '',
      '[/vc_column_text][/vc_column][/vc_row]',
    ].join('\n');

    expect(extractItemText(body, 'Post title')).toEqual({
      title: 'Wall-E & Friends',
      subtitle: 'Rocklove X Pixar',
      description: 'First paragraph.',
      software: ['Zbrush', 'Rhinoceros 3D', 'Matrix'],
      client: 'Pixar, Rocklove',
      leftovers: [],
    });
  });

  it('handles a simple post and drops browser-extension junk', () => {
    const body = [
      '<h2>Emerald Earrings</h2>',
      '[vc_empty_space]',
      '',
      '<strong>Software</strong>: Rhinoceros 3D, Matrix',
      '<strong>Client</strong>: Private client',
      '',
      '&nbsp;',
      '<div id="gtx-trans" style="position: absolute;">',
      '<div class="gtx-trans-icon"></div>',
      '</div>',
    ].join('\n');

    const text = extractItemText(body, 'Emerald Earrings');
    expect(text.description).toBe('');
    expect(text.software).toEqual(['Rhinoceros 3D', 'Matrix']);
    expect(text.client).toBe('Private client');
    expect(text.subtitle).toBe('');
  });

  it('falls back to the post title when the body has no heading', () => {
    expect(extractItemText('Just text.', ' Post Title ').title).toBe('Post Title');
  });

  it('reports markup it could not clean', () => {
    expect(extractItemText('<h2>T</h2>\n[gallery ids="1,2"]', 'T').leftovers).toEqual([
      '[gallery ids="1,2"]',
    ]);
  });
});
