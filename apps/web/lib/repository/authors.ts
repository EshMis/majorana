// Compact author lists for the papers index.
//
// `RegisteredPaper.authors` (`./papers.ts`) is one hand-authored string per
// row, names in source order, never truncated at the data layer — the
// register's identity rule is one row, one set of metadata, and turning
// `authors` into a real array is the shape change that module's own header
// defers to its own PR. `shortAuthors` reads the string the register already
// has and never asks the register to change; it is display-time truncation
// only, used by the index row. The paper detail page renders `paper.authors`
// in full and never calls this.

/**
 * Splits a register `authors` string into individual names.
 *
 * Three separators are in use: `", "` (nearly every row), `" and "` (used
 * for a two-author row with no comma at all — the Nielsen & Chuang textbook,
 * `"Michael A. Nielsen and Isaac L. Chuang"`), and a full-width `"、"` —
 * checked for and not found anywhere in the register as of this writing, but
 * split on anyway in case a future row is transcribed with one. A name is
 * never counted twice: "A, B and C" and "A, B, C" both split into three
 * names.
 */
function splitAuthorNames(authors: string): string[] {
  return authors
    .split(/\s*,\s*|\s+and\s+|\s*、\s*/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * The register's `authors` string, shortened for a compact listing.
 *
 * One to `max` names are returned exactly as written: this function never
 * reformats a list it is not truncating, so an "and"-joined pair keeps its
 * "and" rather than being rewritten with a comma. Four or more names collapse
 * to the first name plus "et al.".
 *
 * A string that already ends in "et al." is returned unchanged rather than
 * split and re-truncated — the register has one such row, hand-transcribed
 * because that is how the source citation itself reads ("Charles H. Bennett
 * et al.", the teleportation paper). The register does not record how many
 * authors that citation actually has, so this function does not guess.
 */
export function shortAuthors(authors: string, max = 3): string {
  const trimmed = authors.trim();
  if (trimmed.endsWith("et al.")) return trimmed;
  const names = splitAuthorNames(trimmed);
  if (names.length <= max) return trimmed;
  return `${names[0]} et al.`;
}
