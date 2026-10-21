// scripts/lib/any-smell-patterns.mjs - shared smell patterns for the
// `check:any-delta` gate. Split out so the regexes (especially the non-null
// assertion pair, which must not fire on `!==`, logical negation, or prose) are
// unit-tested instead of trusted.
//
// Contract: every pattern is global (`g`) and counts one occurrence per match.
// Comments are stripped before counting because `// handle null!` is prose, not
// an assertion; `//` inside a string (a URL) is left intact.
//
// The member pattern is built with `new RegExp` from a string so this file does
// not contain the literal `!.` it bans (otherwise the gate would flag itself).

export const SMELL_PATTERNS = [
  { name: 'any type', pattern: /:\s*any\b/g },
  { name: 'as any', pattern: /\bas any\b/g },
  { name: 'as never', pattern: /\bas never\b/g },
  { name: 'as unknown as', pattern: /\bas unknown as\b/g },
  // `row!.id`, `getRow()!.id`, `rows[0]!.id`
  { name: 'non-null member', nonNull: true, pattern: new RegExp('[\\w\\)\\]]!\\.', 'g') },
  // `value!` before a terminator / end of line. The lookahead keeps logical
  // negation (`!value`), `!==`, `!=`, and a `!` inside a string literal out.
  {
    name: 'non-null assertion',
    nonNull: true,
    pattern: /[\w\)\]]!(?=\s*[,;\)\]\}]|\s*$)/gm,
  },
];

/** Remove block comments and whitespace-prefixed line comments. */
export function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

/**
 * @param {string} text
 * @param {{ includeNonNull?: boolean }} [options] Test files pass
 *   `includeNonNull: false` because banned syntax is legitimate fixture data
 *   there (a test asserting the gate itself must be able to spell `row!.id`).
 */
export function countSmells(text, { includeNonNull = true } = {}) {
  const clean = stripComments(text);
  let total = 0;
  for (const { pattern, nonNull } of SMELL_PATTERNS) {
    if (nonNull && !includeNonNull) continue;
    pattern.lastIndex = 0;
    total += (clean.match(pattern) || []).length;
  }
  return total;
}
