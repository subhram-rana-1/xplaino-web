/**
 * Shared text normalisation utilities for PDF highlight anchor matching.
 *
 * Both the write path (capturing selection anchors) and the read path
 * (matching anchors back to page text) must use identical transformations
 * so that stored anchors always match the text layer.
 */

/**
 * Strip common markdown formatting from a string, returning plain text.
 * Used as a safety net for old cached citation content that may still
 * contain markdown syntax (##, **, etc.) from before the BE migration
 * to plain-text extraction.
 */
export function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n+/g, ' ');
}

/**
 * Normalise a single character to its canonical ASCII equivalent.
 * Returns '' for invisible zero-width characters that should be stripped.
 */
function normChar(ch: string): string {
  const code = ch.charCodeAt(0);

  // ── Fullwidth ASCII forms (U+FF01–U+FF5E) → ASCII (U+0021–U+007E) ────────
  // This single rule covers every printable ASCII character that PDF.js may
  // emit as a fullwidth variant: $, (, ), ., ,, :, ;, !, ?, -, ", etc.
  // The offset between the two blocks is always 0xFEE0.
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCharCode(code - 0xfee0);
  }

  // ── Zero-width invisible characters — strip entirely ─────────────────────
  // PDF.js sometimes inserts these between text items; they are invisible
  // but break indexOf matching.
  // U+0000 NULL byte (PostgreSQL strips it from text columns, creating a
  // write/read mismatch), U+200B ZERO-WIDTH SPACE, U+200C ZERO-WIDTH
  // NON-JOINER, U+200D ZERO-WIDTH JOINER, U+2060 WORD JOINER,
  // U+FEFF BOM / ZERO-WIDTH NO-BREAK
  if (
    code === 0x0000 ||
    code === 0x200b ||
    code === 0x200c ||
    code === 0x200d ||
    code === 0x2060 ||
    code === 0xfeff
  ) {
    return '';
  }

  // ── Hyphens / dashes → ASCII hyphen-minus (U+002D) ───────────────────────
  // U+00AD SOFT HYPHEN, U+2010 HYPHEN, U+2011 NON-BREAKING HYPHEN,
  // U+2012 FIGURE DASH, U+2013 EN DASH, U+2014 EM DASH, U+2015 HORIZONTAL BAR,
  // U+2212 MINUS SIGN, U+FE63 SMALL HYPHEN-MINUS
  // (U+FF0D FULLWIDTH HYPHEN-MINUS is already handled by the fullwidth block above)
  if (
    code === 0x00ad ||
    (code >= 0x2010 && code <= 0x2015) ||
    code === 0x2212 ||
    code === 0xfe63
  ) {
    return '-';
  }

  // ── Quotes → ASCII apostrophe / double-quote ──────────────────────────────
  // U+2018 LEFT SINGLE, U+2019 RIGHT SINGLE / APOSTROPHE, U+201A LOW-9,
  // U+2039 SINGLE LEFT ANGLE, U+203A SINGLE RIGHT ANGLE,
  // U+02B9 MODIFIER LETTER PRIME, U+0060 GRAVE ACCENT
  // (U+FF02 FULLWIDTH QUOTATION MARK is handled by the fullwidth block above)
  if (
    code === 0x2018 ||
    code === 0x2019 ||
    code === 0x201a ||
    code === 0x2039 ||
    code === 0x203a ||
    code === 0x02b9 ||
    code === 0x0060
  ) {
    return "'";
  }

  // U+201C LEFT DOUBLE, U+201D RIGHT DOUBLE, U+201E LOW-9 DOUBLE,
  // U+00AB LEFT ANGLE DOUBLE, U+00BB RIGHT ANGLE DOUBLE,
  // U+02BA MODIFIER LETTER DOUBLE PRIME
  if (
    code === 0x201c ||
    code === 0x201d ||
    code === 0x201e ||
    code === 0x00ab ||
    code === 0x00bb ||
    code === 0x02ba
  ) {
    return '"';
  }

  // ── Ligatures → multi-char equivalents ───────────────────────────────────
  if (code === 0xfb00) return 'ff';
  if (code === 0xfb01) return 'fi';
  if (code === 0xfb02) return 'fl';
  if (code === 0xfb03) return 'ffi';
  if (code === 0xfb04) return 'ffl';
  if (code === 0xfb05) return 'st';
  if (code === 0xfb06) return 'st';

  // ── Bullet / list-marker glyphs — strip entirely ───────────────────────
  // U+2022 BULLET, U+25CF BLACK CIRCLE, U+25E6 WHITE BULLET,
  // U+2219 BULLET OPERATOR
  if (
    code === 0x2022 ||
    code === 0x25cf ||
    code === 0x25e6 ||
    code === 0x2219
  ) {
    return '';
  }

  // ── Private Use Area (U+E000–U+F8FF) — strip entirely ────────────────
  // PDFs often render bullets, arrows, and decorative glyphs via custom
  // fonts (Symbol, Wingdings, ZapfDingbats) that map them to PUA code
  // points.  The specific code (U+F0B7, U+F076, U+F0A7, etc.) varies by
  // font, so we strip the entire BMP PUA range.  These characters are
  // never meaningful text and only cause anchor-matching mismatches.
  if (code >= 0xe000 && code <= 0xf8ff) {
    return '';
  }

  // ── Special / non-breaking spaces → regular space ────────────────────────
  // U+00A0 NO-BREAK SPACE, U+2002 EN SPACE, U+2003 EM SPACE, U+2004–U+200A
  // thin/hair/etc spaces, U+202F NARROW NO-BREAK, U+205F MEDIUM MATH SPACE,
  // U+3000 IDEOGRAPHIC SPACE
  if (
    code === 0x00a0 ||
    (code >= 0x2002 && code <= 0x200a) ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000
  ) {
    return ' ';
  }

  return ch;
}

/**
 * Normalise a string by:
 * 1. Stripping zero-width invisible characters.
 * 2. Replacing each character with its canonical equivalent (fullwidth→ASCII,
 *    hyphens, quotes, ligatures, special spaces).
 * 3. Collapsing all runs of whitespace to a single space.
 * 4. Trimming leading / trailing whitespace.
 */
export function normalisePdfText(s: string): string {
  let result = '';
  let lastWasSpace = true; // treat virtual leading space so we trim the start

  for (let i = 0; i < s.length; i++) {
    const ch = normChar(s[i]);

    // Stripped zero-width character — skip entirely
    if (ch === '') continue;

    if (ch.length > 1) {
      // Ligature expanded to multiple chars — treat as non-space
      result += ch;
      lastWasSpace = false;
    } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (!lastWasSpace) {
        result += ' ';
        lastWasSpace = true;
      }
    } else {
      result += ch;
      lastWasSpace = false;
    }
  }

  // Trim trailing space
  if (result.endsWith(' ')) result = result.slice(0, -1);
  return result;
}

/**
 * Build a normalised string from `fullText` AND an index array `normToOrig`
 * such that `normToOrig[i]` is the index in `fullText` that contributed the
 * i-th character of the returned normalised string.
 *
 * This replaces the imprecise ratio-based position mapping used previously.
 */
export function buildNormalisedWithIndexMap(fullText: string): {
  normText: string;
  normToOrig: number[];
} {
  let normText = '';
  const normToOrig: number[] = [];
  let lastWasSpace = true; // treat virtual leading space so we trim the start

  for (let i = 0; i < fullText.length; i++) {
    const ch = normChar(fullText[i]);

    // Stripped zero-width character — skip entirely, no index map entry
    if (ch === '') continue;

    if (ch.length > 1) {
      // Ligature: each expanded char maps to the same original index
      for (let k = 0; k < ch.length; k++) {
        normToOrig.push(i);
        normText += ch[k];
      }
      lastWasSpace = false;
    } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (!lastWasSpace) {
        normToOrig.push(i);
        normText += ' ';
        lastWasSpace = true;
      }
      // else: skip duplicate whitespace (don't push to normToOrig)
    } else {
      normToOrig.push(i);
      normText += ch;
      lastWasSpace = false;
    }
  }

  // Trim trailing space
  if (normText.endsWith(' ')) {
    normText = normText.slice(0, -1);
    normToOrig.pop();
  }

  return { normText, normToOrig };
}
