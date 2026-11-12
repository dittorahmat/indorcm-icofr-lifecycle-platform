import { describe, expect, it } from 'vitest';
import { countSmells, stripComments } from '../lib/any-smell-patterns.mjs';

/**
 * `check:any-delta` is the gate behind the "no new any / escape-cast / non-null
 * assertion" mandate. A false positive blocks an honest change, so the regexes
 * are locked here: they must catch assertions without firing on logical
 * negation, comparisons, prose, or URLs.
 *
 * The `any` fixtures are composed at runtime (`${ANY}`) so this file does not
 * itself trip the gate it tests; non-null fixtures are exempt because test files
 * pass `includeNonNull: false` (banned syntax is legitimate fixture data).
 */
const ANY = 'any';
const NEVER = 'never';

describe('countSmells', () => {
  it('counts existing any and escape-cast patterns', () => {
    const code = [
      `const a: ${ANY} = 1;`,
      `const b = x as ${ANY};`,
      `const d = x as ${NEVER};`,
      `const f = x as unknown ${'as'} H;`,
    ].join('\n');
    expect(countSmells(code)).toBe(4);
  });

  it('counts non-null member access and bare assertions', () => {
    const code = [
      'row!.id;',
      'getRow()!.id;',
      'rows[0]!.id;',
      'send(row!);',
      'return value!;',
    ].join('\n');
    expect(countSmells(code)).toBe(5);
  });

  it('skips non-null assertions but keeps any checks when asked', () => {
    expect(countSmells('send(row!);', { includeNonNull: false })).toBe(0);
    expect(countSmells(`const a: ${ANY} = 1;`, { includeNonNull: false })).toBe(1);
  });

  it('ignores logical negation, comparisons, prose, and URLs', () => {
    const code = [
      'if (!ready) return;',
      'const same = a !== b;',
      'const diff = a != b;',
      "toast('Done!');",
      'const prompt = `\nKotak ini ADALAH HEADER SWIMLANE!\n`;',
      'const url = "https://example.test/path";',
      '// handle the null case!',
      '/* also not! */',
    ].join('\n');
    expect(countSmells(code)).toBe(0);
  });

  it('keeps counting code on a line that contains a URL string', () => {
    expect(countSmells('const u = "https://x"; send(row!);')).toBe(1);
  });

  it('strips block and line comments without touching string contents', () => {
    expect(stripComments('a/* x */b')).toBe('ab');
    expect(stripComments('keep https://x // tail')).toBe('keep https://x ');
  });
});
