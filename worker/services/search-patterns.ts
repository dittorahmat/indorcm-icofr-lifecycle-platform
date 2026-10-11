import { ilike, sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * search-patterns — two explicit search seams (SK-5 platform search policy).
 *
 * - Substring seam (Trigram Search, GIN gin_trgm_ops): short code/name
 *   columns (rcms.sub_process, bpm_processes.name, documents.title,
 *   rcms.id suffix). ILIKE '%term%' preserves contains-semantics.
 * - Corpus seam (Lexeme FTS, GIN tsvector, config indonesian): document
 *   corpus only (documents/document_chunks fts_tokens).
 *
 * New queries choose the seam by signature. Never use tsvector for
 * code/name substring search (stemming changes contains into token
 * match); never use ILIKE for the document corpus (loses stemming and
 * the tsvector index).
 */

/** Escape LIKE wildcards so the term matches literally. */
export function escapeLikeWildcards(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** `%term%` with wildcards escaped. The Trigram GIN index still applies. */
export function substringPattern(term: string): string {
  return `%${escapeLikeWildcards(term)}%`;
}

/** Trigram-optimized substring predicate for short code/name columns. */
export function substringMatch(column: PgColumn, term: string): SQL<unknown> {
  return ilike(column, substringPattern(term));
}

/** Lexeme predicate for the document corpus only. Config indonesian is
 *  inline (byte-identical to the proven query); both corpus helpers live
 *  here so the config has exactly one home, locked by tests. */
export function corpusMatch(tsvectorColumn: SQL | PgColumn, term: string): SQL<unknown> {
  return sql`${tsvectorColumn} @@ plainto_tsquery('indonesian', ${term})`;
}

/** ts_rank_cd ordering paired with corpusMatch. */
export function corpusRank(tsvectorColumn: SQL | PgColumn, term: string): SQL<unknown> {
  return sql`ts_rank_cd(${tsvectorColumn}, plainto_tsquery('indonesian', ${term}))`;
}
