#!/usr/bin/env python3
"""CI gate: every curriculum notebook still runs.

**Nothing executed these before.** `curricula/` holds 25 notebooks — the Qiskit study
group's labs, challenges and certification quizzes — and until this script the only thing
CI did with them was read their answer keys as text. A qiskit release that renamed a method
would have left the whole course broken with every check green, and the first person to
find out would have been a reader partway through week 4.

They execute through `execute_in_local_sandbox` — the product's own path minus the
Firecracker boundary, which is the same runner `check_graders.py` uses. So this adds no new
execution surface: the static guard runs exactly as it does in production, and a notebook
this gate can run is a notebook the product could run.

Measured: 23 notebooks in 56 s.

## The two the guard refuses, and why the exemption cannot rot

`mock_exam` and `practice_questions` import `importlib` and `inspect`, which the notebook
safety guard forbids, so they cannot go through this path at all. They are listed in
`GUARD_EXEMPT` with that reason.

An allowlist decays in one direction — entries stop being needed and nobody notices, and
the list quietly grows into a way of not checking things. So the exemption is checked in
BOTH directions: a notebook refused by the guard and NOT on the list fails, and a notebook
ON the list that the guard now accepts also fails, with a message saying to delete the
entry. The list can only be right or loud.

Usage:
  python scripts/check_curricula_run.py [ROOT ...]   # default: curricula/
  python scripts/check_curricula_run.py --self-test
"""

from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "packages/py/notebooks/src"))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "packages/py/contracts/src"))

from leona_notebooks.local_runner import execute_in_local_sandbox  # noqa: E402
from leona_notebooks.sandbox_program import (  # noqa: E402
    NotebookGuardError,
    compose_notebook_program,
)
from leona_notebooks.source import parse_source  # noqa: E402

#: Everything in `GUARD_EXEMPT` is written relative to this, so an absolute root and a
#: relative one produce the same answer. They did not before: `path.as_posix()` on an
#: absolute root never matched a repository-relative key, and the two exempt notebooks
#: came back as unexpected guard refusals. Greptile, PR 835.
REPO_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_ROOTS = ["curricula"]

#: Notebooks the product's own safety guard refuses, so this gate cannot run them. Keyed by
#: path relative to the repository root, valued with WHY — a bare path would leave the next
#: reader unable to tell a considered exemption from an abandoned one.
GUARD_EXEMPT: dict[str, str] = {
    "curricula/qiskit-study-group/certification/mock_exam.nb.py": (
        "teaches `importlib`, which the notebook guard forbids"
    ),
    "curricula/qiskit-study-group/certification/practice_questions.nb.py": (
        "teaches `inspect`, which the notebook guard forbids"
    ),
}

#: Per notebook. The contract's own ceiling is 120 s and the slowest of the 25 takes ~4 s,
#: so this is a hang detector rather than a budget.
TIMEOUT_S = 120


def _key(path: Path) -> str:
    """The `GUARD_EXEMPT` key for a notebook, however its root was spelled."""
    try:
        return path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        # Outside the repository — a self-test tempdir. Fall back to the path as given,
        # so an exemption can still be expressed for it.
        return path.as_posix()


def _notebooks(roots: list[str]) -> list[Path]:
    out: list[Path] = []
    for raw in roots:
        p = Path(raw)
        out.extend(sorted(p.rglob("*.nb.py")) if p.is_dir() else [p])
    return out


def check(roots: list[str]) -> tuple[list[str], int, int]:
    """`(problems, executed, exempt)`."""
    problems: list[str] = []
    executed = exempt = 0
    notebooks = _notebooks(roots)
    if not notebooks:
        return (
            [
                f"no .nb.py notebooks found under {', '.join(roots)} — refusing to report a "
                "clean run over nothing; a gate that passes on an empty set is worse than "
                "no gate"
            ],
            0,
            0,
        )
    for path in notebooks:
        key = _key(path)
        try:
            spec = parse_source(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            problems.append(f"{key}: does not parse — {exc}")
            continue
        try:
            compose_notebook_program(spec)
        except NotebookGuardError as exc:
            if key in GUARD_EXEMPT:
                exempt += 1
                continue
            problems.append(
                f"{key}: refused by the notebook safety guard, so it was NOT run — {exc}. "
                "Either fix the notebook or add it to GUARD_EXEMPT with a reason."
            )
            continue
        if key in GUARD_EXEMPT:
            # The direction an allowlist rots in. Loud, because a stale entry is a
            # notebook silently outside the gate for as long as nobody looks.
            problems.append(
                f"{key}: listed in GUARD_EXEMPT ({GUARD_EXEMPT[key]}) but the guard now "
                "ACCEPTS it — delete the entry so it is actually run."
            )
            continue
        report = execute_in_local_sandbox(spec, timeout_s=TIMEOUT_S)
        executed += 1
        # A cell tagged `raises-exception` is MEANT to raise — the authoring guide
        # documents it, and the runner deliberately records `status="error"` for it while
        # leaving `report.ok` true and carrying on. Counting those would have failed the
        # gate on the documented pattern; no curriculum uses it today, so the false
        # positive was latent rather than visible. Greptile, PR 835.
        intentional = {cell.id for cell in spec.cells if "raises-exception" in (cell.tags or [])}
        failures = [c for c in report.cells if c.status == "error" and c.id not in intentional]
        if failures or not report.ok:
            detail = "; ".join(
                f"{c.id}: {c.error.ename}: {(c.error.evalue or '')[:120]}"
                for c in failures[:3]
                if c.error
            )
            problems.append(
                f"{key}: {len(failures)} cell(s) raised"
                + (f" — {detail}" if detail else f" — {report.note[:160]}")
            )
    return problems, executed, exempt


def _self_test() -> int:
    """Each arm proved against a real notebook, because the parse and the guard are the
    parts most likely to change under this script."""
    good = (
        "# ---\n# slug: g\n# title: G\n# ---\n\n"
        "# %% role=setup\nx = 1\n\n"
        "# %% role=run\nassert x == 1\n"
    )
    raises = (
        "# ---\n# slug: b\n# title: B\n# ---\n\n"
        "# %% role=setup\nx = 1\n\n"
        "# %% role=run\nassert x == 2, 'deliberate'\n"
    )
    refused = (
        "# ---\n# slug: r\n# title: R\n# ---\n\n"
        "# %% role=setup\nimport importlib\n\n"
        "# %% role=run\nprint(importlib)\n"
    )
    failures: list[str] = []

    def run(files: dict[str, str], exempt: dict[str, str] | None = None) -> list[str]:
        global GUARD_EXEMPT
        saved = GUARD_EXEMPT
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, text in files.items():
                (root / name).write_text(text, encoding="utf-8")
            GUARD_EXEMPT = {(root / k).as_posix(): v for k, v in (exempt or {}).items()}
            try:
                return check([str(root)])[0]
            finally:
                GUARD_EXEMPT = saved

    if run({"ok.nb.py": good}):
        failures.append(f"a working notebook was reported as a problem: {run({'ok.nb.py': good})}")
    # Not just "was it caught" — the message must NAME the failing cell. Excusing every
    # cell as intentional still fails the run through `report.ok`, so a check for the word
    # "raised" alone stays green while the report loses the one detail a reader needs.
    raised_problems = run({"bad.nb.py": raises})
    if not any("raised" in p for p in raised_problems):
        failures.append("a notebook whose cell raises was NOT caught")
    elif not any("deliberate" in p or "AssertionError" in p for p in raised_problems):
        failures.append(f"a raising cell was caught but not NAMED in the report: {raised_problems}")
    if not any("safety guard" in p for p in run({"r.nb.py": refused})):
        failures.append("a notebook the guard refuses was NOT caught as unrun")
    if run({"r.nb.py": refused}, exempt={"r.nb.py": "on purpose"}):
        failures.append("an exempted notebook was still reported")
    # The rot direction, and the arm an allowlist normally ships without.
    if not any("ACCEPTS it" in p for p in run({"ok.nb.py": good}, exempt={"ok.nb.py": "stale"})):
        failures.append("a STALE exemption on a runnable notebook was NOT caught")
    with tempfile.TemporaryDirectory() as empty:
        if not check([empty])[0]:
            failures.append("a run that discovered ZERO notebooks reported success")

    # A cell that is MEANT to raise must not fail the gate. `report.ok` stays true for it,
    # so this arm and the "a raising cell is caught" arm above differ only by the tag —
    # which is the whole distinction being tested.
    intentional = (
        "# ---\n# slug: i\n# title: I\n# ---\n\n"
        "# %% role=setup\nx = 1\n\n"
        '# %% role=run tags=["raises-exception"]\nraise ValueError("on purpose")\n'
    )
    if run({"i.nb.py": intentional}):
        failures.append(
            "a cell tagged raises-exception was reported as a failure: "
            f"{run({'i.nb.py': intentional})}"
        )

    # An ABSOLUTE root must honour the repository-relative exemptions. Pointed at the
    # certification directory, whose two notebooks are both exempt, so it executes nothing
    # and costs no time — and with the key bug it reports two unexpected guard refusals.
    certification = (REPO_ROOT / "curricula/qiskit-study-group/certification").resolve()
    if certification.is_dir():
        absolute_problems = check([str(certification)])[0]
        if absolute_problems:
            failures.append(f"an absolute root did not match the exemptions: {absolute_problems}")

    if failures:
        print("check_curricula_run self-test FAILED:")
        for line in failures:
            print(f"  {line}")
        return 1
    print(
        "check_curricula_run self-test passed (a working notebook accepted; a raising cell, "
        "an unrun guard refusal, a stale exemption and an empty discovery all caught)"
    )
    return 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return _self_test()
    roots = [a for a in argv if not a.startswith("-")] or DEFAULT_ROOTS
    started = time.monotonic()
    problems, executed, exempt = check(roots)
    elapsed = time.monotonic() - started
    if problems:
        print("Curriculum notebooks that did not run clean:")
        for line in problems:
            print(f"  {line}")
        return 1
    print(
        f"check_curricula_run: clean ({executed} notebook(s) executed in {elapsed:.0f}s, "
        f"{exempt} exempt from the guard)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
