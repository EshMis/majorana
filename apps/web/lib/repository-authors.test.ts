// `shortAuthors` — the papers index's author-list truncation. Fixtures use
// the register's real separators (comma, " and ", and its one already-"et
// al." row) rather than inventing a shape the register does not use.
import assert from "node:assert/strict";
import test from "node:test";

import { shortAuthors } from "./repository/authors.ts";

test("one, two or three names are returned exactly as written", () => {
  assert.equal(shortAuthors("Andrew M. Childs"), "Andrew M. Childs");
  assert.equal(shortAuthors("A. R. Calderbank, Peter W. Shor"), "A. R. Calderbank, Peter W. Shor");
  assert.equal(
    shortAuthors("Aleksandrs Belovs, Andris Ambainis, Ashley Montanaro"),
    "Aleksandrs Belovs, Andris Ambainis, Ashley Montanaro",
  );
});

test('four or more names collapse to the first name plus "et al."', () => {
  assert.equal(shortAuthors("Cheng Xue, Yu-Chun Wu, Guo-Ping Guo, Someone Else"), "Cheng Xue et al.");
  assert.equal(
    shortAuthors(
      "Ali JavadiAbhari, Shruti Patil, Daniel Kudrow, Jeff Heckey, Alexey Lvov, Frederic T. Chong, Margaret Martonosi",
    ),
    "Ali JavadiAbhari et al.",
  );
});

test('a row already ending "et al." is returned unchanged, not re-split', () => {
  // The register's one hand-transcribed exception — see paper-register.ts,
  // doi:10.1103/physrevlett.70.1895. Splitting "Charles H. Bennett et al."
  // would count one name (well under the threshold) and return it unchanged
  // anyway, but the explicit check is what protects a future row shaped like
  // "A, B et al." from being mis-split into two names and truncated further.
  assert.equal(shortAuthors("Charles H. Bennett et al."), "Charles H. Bennett et al.");
});

test('an "and"-joined pair keeps its "and" rather than being reformatted', () => {
  // Nielsen & Chuang's textbook row — the register's only "and"-joined
  // authors field, with no comma at all.
  const nielsenChuang = "Michael A. Nielsen and Isaac L. Chuang";
  assert.equal(shortAuthors(nielsenChuang), nielsenChuang);
});

test('mixed comma-and-"and" separators are counted correctly on both sides of the threshold', () => {
  assert.equal(shortAuthors("A, B and C"), "A, B and C");
  assert.equal(shortAuthors("A, B, C and D"), "A et al.");
  assert.equal(shortAuthors("A, B, C, D and E"), "A et al.");
});

test("whitespace around the string and around each split name is trimmed", () => {
  assert.equal(shortAuthors("  Andrew M. Childs  "), "Andrew M. Childs");
  assert.equal(shortAuthors("A ,  B ,C ,   D"), "A et al.");
});

test("a custom max changes the threshold", () => {
  assert.equal(shortAuthors("A, B", 1), "A et al.");
  assert.equal(shortAuthors("A, B, C, D", 4), "A, B, C, D");
});
