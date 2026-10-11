import { describe, expect, it } from 'vitest';
import { sql, type SQL } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import {
  corpusMatch,
  corpusRank,
  escapeLikeWildcards,
  substringMatch,
  substringPattern,
} from '../search-patterns';

const docs = pgTable('documents', {
  title: text('title'),
});
const ftsTokens = sql.raw('fts_tokens');

/** Render a drizzle fragment to text: string chunks inline, params inline, columns as ?. */
function sqlText(fragment: SQL<unknown>): string {
  const chunks = fragment.getSQL().queryChunks as unknown[];
  return chunks
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object' && 'value' in c) {
        const v = (c as { value: unknown }).value;
        if (Array.isArray(v)) return v.filter((x) => typeof x === 'string').join('');
        return String(v);
      }
      return '?';
    })
    .join('');
}

describe('search-patterns seam (Trigram substring vs Lexeme corpus)', () => {
  it('escapes LIKE wildcards so terms match literally', () => {
    expect(escapeLikeWildcards('setoran%tunai_tarik\\sisa')).toBe('setoran\\%tunai\\_tarik\\\\sisa');
    expect(escapeLikeWildcards('kas teller')).toBe('kas teller');
    expect(escapeLikeWildcards('')).toBe('');
  });

  it('substringPattern wraps the escaped term for contains search', () => {
    expect(substringPattern('kas')).toBe('%kas%');
    expect(substringPattern('100%_jamin')).toBe('%100\\%\\_jamin%');
  });

  it('substringMatch builds an ILIKE predicate carrying the escaped pattern', () => {
    const rendered = sqlText(substringMatch(docs.title, 'kas%_tunai'));
    expect(rendered.toLowerCase()).toContain('ilike');
    expect(rendered).toContain('%kas\\%\\_tunai%');
  });

  it('corpusMatch locks the @@ plainto_tsquery indonesian predicate', () => {
    const rendered = sqlText(corpusMatch(ftsTokens, 'setoran tunai'));
    expect(rendered).toContain('@@');
    expect(rendered).toContain("plainto_tsquery('indonesian'");
  });

  it('corpusRank locks the ts_rank_cd ordering on the same config', () => {
    const rendered = sqlText(corpusRank(ftsTokens, 'setoran tunai'));
    expect(rendered).toContain('ts_rank_cd');
    expect(rendered).toContain("plainto_tsquery('indonesian'");
  });
});
