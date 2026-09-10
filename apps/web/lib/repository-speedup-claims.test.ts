// The claims page's per-row status, and that no reader-facing string on it
// (or on the records it links to) names the secondary index the speedup
// class came from. Owner directive 2026-09-10 (ai-ops issue 217 lane):
// "all our info is from primary papers, so get rid of mentions of quantum
// algorithm zoo and other things."
//
// This is `./speedup-claims.test.ts`'s sibling, not a replacement for it:
// that file pins the census partition and the sentence's number ordering;
// this one pins the newer, narrower property -- that neither the sentence
// nor a rendered record names the index. Two different failure modes, two
// files, same fixture shape.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import {
  speedupCensusSentence,
  speedupClaimCensus,
  type SpeedupProvenance,
} from "./repository/speedup-claims.ts";

// ---------------------------------------------------------------------------
// Part 1: fixture-based, no corpus import. Same reason `./speedup-claims.test.ts`
// gives: `public-repository.ts` reaches its entry modules with extensionless
// specifiers and `node --test` resolves paths literally, so a shaped fixture
// is what this half of the file works from.
// ---------------------------------------------------------------------------

const provenance: readonly SpeedupProvenance[] = ([
  { states: "reported", quote: "the authors' own words" },
  { states: "absent", read: "the whole paper, sections 1-6" },
  { states: "absent", read: "the abstract only" },
  { states: "unknown" },
  { states: "unknown" },
  { states: "unknown" },
  { states: "unknown" },
] as const).map((primary, at) => ({
  slug: `record-${at}`,
  title: "A record",
  titleJa: "ある記録",
  zooName: "Some Zoo entry",
  zooSection: "Oracular Algorithms",
  speedup: "Polynomial",
  source: { id: "arxiv:0", title: "A paper", authors: "An author", year: "2000", url: "https://arxiv.org/abs/0" },
  primary,
}));

const census = speedupClaimCensus(provenance);

test("the census sentence names no secondary index, in either locale", () => {
  // The fixture's own `zooName`/`zooSection` values ("Some Zoo entry",
  // "Oracular Algorithms") never appear in the shared, computed sentence --
  // `speedupCensusSentence` does not read them at all -- so this is really
  // asserting the sentence's own vocabulary, not the fixture's.
  for (const locale of ["en", "ja"] as const) {
    const sentence = speedupCensusSentence(census, locale);
    assert.ok(
      !/quantum algorithm zoo/i.test(sentence),
      `${locale}: the census sentence names the index: ${sentence}`,
    );
    assert.ok(
      !/classiq/i.test(sentence),
      `${locale}: the census sentence names the library: ${sentence}`,
    );
  }
});

test("every record the page would show carries exactly one status", () => {
  // `SpeedupClaimsView` derives a row's status word from which of the three
  // census groups it renders inside -- reported/absent/unchecked -- with no
  // per-row field carrying the state directly. So "exactly one status" is
  // the same fact `speedup-claims.test.ts` calls "every record lands in
  // exactly one group": a record present in the union of the three groups,
  // and present in only one of them. Re-asserted here, next to the status
  // vocabulary this file owns, rather than assumed from the sibling file.
  const grouped = new Map<string, string[]>();
  for (const [group, rows] of [
    ["reported", census.reported],
    ["absent", census.absent],
    ["unchecked", census.unchecked],
  ] as const) {
    for (const row of rows) {
      const groups = grouped.get(row.slug) ?? [];
      groups.push(group);
      grouped.set(row.slug, groups);
    }
  }
  assert.equal(grouped.size, census.records, "some record is not in any group, or the fixture has duplicate slugs");
  for (const [slug, groups] of grouped) {
    assert.equal(groups.length, 1, `${slug}: in ${groups.length} groups (${groups.join(", ")}), not exactly one`);
  }
});

// ---------------------------------------------------------------------------
// Part 2: one real Zoo-parity record and one real Classiq-parity record,
// loaded from the actual corpus rather than a fixture.
//
// This deliberately diverges from the convention `repository-topics.test.ts`,
// `repository-interface.test.ts`, `repository-families.test.ts` and
// `repository-layers.test.ts` all state in their own headers -- "the corpus
// is not imported here... `node --test` resolves paths literally" -- because
// those files were choosing between a fixture and not testing the property
// at all. This property (does a REAL rendered record still name the index)
// cannot be pinned by any fixture, no matter how it's shaped, so it borrows
// the same esbuild-bundle-then-import technique `scripts/check-zoo-parity.mjs`
// and `scripts/check-classiq-parity.mjs` already use to reach the corpus from
// plain `node`, rather than leaving the property untested. Bundling is slow
// enough (a few seconds) that it happens once, for two named records, not for
// the whole 284-entry corpus -- that full sweep is `check-zoo-parity.mjs` and
// `check-classiq-parity.mjs`'s job (see the "the index is not named to a
// reader" block each of them added in the same pass as this file), and it
// runs in `lint`, not here.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

async function bundleAndLoad(relativePath: string, label: string) {
  const require = createRequire(join(repoRoot, "packages/ts/ui-visual/package.json"));
  const esbuild = require("esbuild");
  const outDir = mkdtempSync(join(tmpdir(), `${label}-`));
  const outFile = join(outDir, `${label}.mjs`);
  try {
    await esbuild.build({
      entryPoints: [join(repoRoot, relativePath)],
      bundle: true,
      format: "esm",
      platform: "neutral",
      outfile: outFile,
      logLevel: "silent",
    });
    return await import(pathToFileURL(outFile).href);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

interface BundledRecord {
  slug: string;
  verification: string;
  explanation: string;
  verificationDetails?: { method?: string; caveat?: string };
  metadata: Array<{ label: string; value: string }>;
  resources: Array<{ label: string; value: string }>;
}

function assertRecordNamesNoIndex(entry: BundledRecord, indexPattern: RegExp, indexLabel: string) {
  const fields: Record<string, string | undefined> = {
    verification: entry.verification,
    explanation: entry.explanation,
    "verificationDetails.method": entry.verificationDetails?.method,
    "verificationDetails.caveat": entry.verificationDetails?.caveat,
  };
  for (const [field, value] of Object.entries(fields)) {
    assert.ok(
      typeof value !== "string" || !indexPattern.test(value),
      `${entry.slug}.${field} names ${indexLabel}: ${value}`,
    );
  }
  for (const row of [...entry.metadata, ...entry.resources]) {
    assert.ok(
      !indexPattern.test(row.label) && !indexPattern.test(row.value),
      `${entry.slug}: a metadata/resources row ("${row.label}") names ${indexLabel}`,
    );
  }
}

test("a real Zoo-parity record's rendered fields do not name the index", { timeout: 60_000 }, async () => {
  const mod = await bundleAndLoad("apps/web/lib/repository/entries-zoo-parity.ts", "entries-zoo-parity-spot-check");
  const entry = (mod.ZOO_PARITY_ENTRIES as BundledRecord[]).find(
    (candidate) => candidate.slug === "irreducible-representation-matrix-elements",
  );
  assert.ok(entry, 'expected slug "irreducible-representation-matrix-elements" in ZOO_PARITY_ENTRIES');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assertRecordNamesNoIndex(entry!, /Quantum Algorithm Zoo/, "the Quantum Algorithm Zoo");
});

test("a real Classiq-parity record's rendered fields do not name the library", { timeout: 60_000 }, async () => {
  const mod = await bundleAndLoad("apps/web/lib/repository/entries-classiq-parity.ts", "entries-classiq-parity-spot-check");
  const entry = (mod.CLASSIQ_PARITY_ENTRIES as BundledRecord[]).find(
    (candidate) => candidate.slug === "quantum-volume-benchmark",
  );
  assert.ok(entry, 'expected slug "quantum-volume-benchmark" in CLASSIQ_PARITY_ENTRIES');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assertRecordNamesNoIndex(entry!, /Classiq/, "Classiq");
});
