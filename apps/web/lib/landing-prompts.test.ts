import assert from "node:assert/strict";
import test from "node:test";
import { HOME_COPY } from "./public-copy.ts";

const LOCALES = ["en", "ja"] as const;

/**
 * The cover's box types these out one character at a time, exactly as the
 * workspace composer does with its own list (`run-example-prompts.test.ts`), so
 * the same three rules hold here: short enough to watch, mostly free of quantum
 * vocabulary so a first-time reader recognises a problem, and the same number
 * of prompts in both languages so neither rotation is quietly shorter.
 */
const MAX_TYPED_LENGTH = { en: 64, ja: 34 } as const;

const jargon = new RegExp(
  [
    "grover|qaoa|vqe|qubo|qft|qae|qubit|quantum",
    "bell|ghz|hadamard|entangl|superposition|amplitude|ansatz|ground.state|h₂|circuit",
    "量子|回路|ビット|ベル|基底状態|分子|振幅|重ね合わせ",
  ].join("|"),
  "i",
);

for (const locale of LOCALES) {
  const { prompts } = HOME_COPY[locale].promptDemo;

  test(`${locale}: the cover offers more than one prompt to rotate through`, () => {
    assert.ok(prompts.length >= 3, `${locale} has ${prompts.length} prompt(s); a rotation needs several`);
  });

  test(`${locale}: every cover prompt is short enough to type out`, () => {
    for (const prompt of prompts) {
      assert.ok(
        prompt.length <= MAX_TYPED_LENGTH[locale],
        `${locale}: ${prompt.length} characters, over ${MAX_TYPED_LENGTH[locale]}: ${prompt}`,
      );
      assert.ok(prompt.trim().length > 0, `${locale} has a blank prompt`);
    }
  });

  test(`${locale}: most cover prompts assume no prior knowledge`, () => {
    const plain = prompts.filter((prompt) => !jargon.test(prompt));
    assert.ok(
      plain.length >= Math.ceil(prompts.length / 2),
      `${locale}: only ${plain.length} of ${prompts.length} prompts avoid quantum jargon`,
    );
  });

  test(`${locale}: the cover lists each prompt once`, () => {
    assert.equal(new Set(prompts).size, prompts.length, "duplicate prompt");
  });
}

test("both locales rotate through the same number of cover prompts", () => {
  assert.equal(HOME_COPY.en.promptDemo.prompts.length, HOME_COPY.ja.promptDemo.prompts.length);
});
