#!/usr/bin/env node
/**
 * A direct dependency's version is what its package.json says — unless an override
 * says otherwise, and then nothing tells you.
 *
 * An unscoped entry under `overrides:` in pnpm-workspace.yaml (`katex: 0.18.4`)
 * rewrites EVERY edge to that package, the workspace's own direct dependencies
 * included. pnpm records the rewritten specifier in the lockfile, `--frozen-lockfile`
 * compares against the rewritten one, and so the install is green while the
 * package.json beside it is fiction. That is what happened to katex: PR 820 bumped
 * apps/web to `^0.18.5`, the override held it at 0.18.4, the lockfile's importer
 * entry read `specifier: 0.18.4`, and the bump shipped as a no-op that every check
 * passed. PR 859 would have done it again at `^0.18.7`.
 *
 * The signal is exact and needs no list of packages to watch: for every importer in
 * pnpm-lock.yaml, each dependency's recorded `specifier` must equal, byte for byte,
 * the one in the package.json it came from. A mismatch means something between the
 * manifest and the resolver changed what was asked for. The usual fix is to scope
 * the override to the transitive range it exists for (`katex@^0.16.0: ...`), or to
 * put the version in the `catalog:` block so both halves read one number.
 *
 * Usage: node scripts/check-override-shadowing.mjs [--self-test]
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GROUPS = ["dependencies", "devDependencies", "optionalDependencies"];

const unquote = (text) => text.trim().replace(/^(['"])(.*)\1$/, "$2");

/**
 * The `importers:` block of a v9 lockfile as
 * `{ [importerPath]: { [group]: { [name]: specifier } } }`.
 *
 * Line-based rather than a YAML dependency, because the block's shape is fixed by
 * pnpm and this script must run before `pnpm install` has put anything on disk.
 * Indentation is the structure: importer at 2, group at 4, package at 6, fields at 8.
 */
export function lockfileImporters(lock) {
  const importers = {};
  let inBlock = false;
  let importer = null;
  let group = null;
  let name = null;

  for (const line of lock.split("\n")) {
    if (/^\S/.test(line)) {
      inBlock = line.startsWith("importers:");
      importer = group = name = null;
      continue;
    }
    if (!inBlock || line.trim() === "") continue;

    const indent = line.length - line.trimStart().length;
    const body = line.trim();
    if (indent === 2 && body.endsWith(":")) {
      importer = unquote(body.slice(0, -1));
      importers[importer] = {};
      group = name = null;
    } else if (indent === 4 && importer !== null && body.endsWith(":")) {
      group = body.slice(0, -1);
      importers[importer][group] = {};
      name = null;
    } else if (indent === 6 && group !== null && body.endsWith(":")) {
      name = unquote(body.slice(0, -1));
    } else if (indent === 8 && name !== null && body.startsWith("specifier:")) {
      importers[importer][group][name] = unquote(body.slice("specifier:".length));
    }
  }
  return importers;
}

/** Every (importer, group, name) whose lockfile specifier differs from its manifest. */
export function shadowed(importers, readManifest) {
  const found = [];
  for (const [importer, groups] of Object.entries(importers)) {
    const manifest = readManifest(importer);
    if (manifest === null) continue;
    for (const group of GROUPS) {
      for (const [name, declared] of Object.entries(manifest[group] ?? {})) {
        const recorded = groups[group]?.[name];
        if (recorded !== undefined && recorded !== declared) {
          found.push({ importer, group, name, declared, recorded });
        }
      }
    }
  }
  return found;
}

function readManifestFrom(root) {
  return (importer) => {
    const path = join(root, importer, "package.json");
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  };
}

function main() {
  const lock = readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf8");
  const importers = lockfileImporters(lock);
  const checked = Object.values(importers).reduce(
    (total, groups) => total + Object.values(groups).reduce((n, deps) => n + Object.keys(deps).length, 0),
    0,
  );
  // A parse that finds nothing would pass every manifest. Fail rather than certify an
  // empty read — the importers block is never empty in this repository.
  if (checked === 0) {
    console.error("check-override-shadowing: read 0 dependencies from pnpm-lock.yaml's importers block");
    return 1;
  }

  const found = shadowed(importers, readManifestFrom(ROOT));
  if (found.length) {
    console.error("check-override-shadowing: the lockfile resolved something other than what package.json asks for\n");
    for (const { importer, group, name, declared, recorded } of found) {
      console.error(`  ${importer} ${group} ${name}: package.json says ${declared}, lockfile recorded ${recorded}`);
    }
    console.error(
      "\nAn override in pnpm-workspace.yaml is rewriting a direct dependency. Scope it to the " +
        "transitive range it exists for, or move the version into the `catalog:` block and " +
        'write "catalog:" in both places.',
    );
    return 1;
  }
  console.error(`check-override-shadowing: ${checked} direct dependencies resolve as declared`);
  return 0;
}

function selfTest() {
  const lock = [
    "lockfileVersion: '9.0'",
    "",
    "overrides:",
    "  katex: 0.18.4",
    "",
    "importers:",
    "",
    "  .:",
    "    devDependencies:",
    "      turbo:",
    "        specifier: ^2.10.12",
    "        version: 2.10.12",
    "",
    "  apps/web:",
    "    dependencies:",
    "      '@workos-inc/node':",
    "        specifier: ^10.13.0",
    "        version: 10.13.0",
    "      katex:",
    "        specifier: 0.18.4",
    "        version: 0.18.4",
    "    devDependencies:",
    "      jose:",
    "        specifier: 'catalog:'",
    "        version: 6.2.10",
    "",
    "packages:",
    "",
    "  katex@0.18.4:",
    "    specifier: not-an-importer",
    "",
  ].join("\n");
  const manifests = {
    ".": { devDependencies: { turbo: "^2.10.12" } },
    "apps/web": {
      dependencies: { "@workos-inc/node": "^10.13.0", katex: "^0.18.5" },
      devDependencies: { jose: "catalog:" },
    },
  };
  const read = (importer) => manifests[importer] ?? null;
  const importers = lockfileImporters(lock);

  const cases = [
    [
      "reads quoted names and quoted specifiers, and nothing past the importers block",
      () =>
        importers["apps/web"].dependencies["@workos-inc/node"] === "^10.13.0" &&
        importers["apps/web"].devDependencies.jose === "catalog:" &&
        Object.keys(importers).join() === ".,apps/web",
    ],
    [
      "the PR 820 shape — an override holding a direct dep below its declared range — is caught",
      () => {
        const found = shadowed(importers, read);
        return found.length === 1 && found[0].name === "katex" && found[0].recorded === "0.18.4";
      },
    ],
    [
      "a catalog: dependency whose lockfile records catalog: is not a mismatch",
      () => !shadowed(importers, read).some((entry) => entry.name === "jose"),
    ],
    [
      "the real lockfile parses to a non-empty importers block, so a pass is not vacuous",
      () => Object.keys(lockfileImporters(readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf8"))).length > 1,
    ],
  ];

  let failed = 0;
  for (const [name, run] of cases) {
    const ok = run();
    if (!ok) failed += 1;
    console.error(`${ok ? "ok" : "FAIL"} — ${name}`);
  }
  return failed === 0 ? 0 : 1;
}

process.exit(process.argv.includes("--self-test") ? selfTest() : main());
