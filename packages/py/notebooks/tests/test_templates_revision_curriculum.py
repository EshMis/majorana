"""Structure checks, revision operations, Atlas seeding and the curriculum builder."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from leona_notebooks import NotebookKind, RevisionOp, RevisionPlan, apply_revision, parse_source
from leona_notebooks.atlas import corpus_prose_to_markdown, seed_from_record
from leona_notebooks.curriculum import build_curriculum, builds_for, load_curriculum
from leona_notebooks.prompts import (
    NotebookOutline,
    render_draft_user_prompt,
    render_outline_user_prompt,
)
from leona_notebooks.revision import RevisionError
from leona_notebooks.templates import STARTER_BRIEFS, check_structure, structure_for

from leona_notebook_fixtures import LESSON

# --------------------------------------------------------------------------- structure


def test_lesson_structure_holds_for_the_fixture_and_fails_when_the_loop_is_broken() -> None:
    spec = parse_source(LESSON)
    assert check_structure(spec) == []
    without_predict = spec.with_cells(
        [c for c in spec.cells if c.role is None or c.role.value != "predict"]
    )
    failures = check_structure(without_predict)
    assert any("predict → run → observe → explain → modify" in f for f in failures)


def test_a_checkpoint_without_an_assert_fails_structure() -> None:
    spec = parse_source(LESSON)
    cells = [
        c.model_copy(update={"source": "print('fine')\n"})
        if c.role and c.role.value == "checkpoint"
        else c
        for c in spec.cells
    ]
    failures = check_structure(spec.with_cells(cells))
    assert any("checkpoint" in f and "assert" in f for f in failures)


def test_hardware_cells_must_not_auto_execute() -> None:
    text = "# ---\n# title: T\n# kind: hardware\n# ---\n# %% [markdown] role=objective\n# x\n# %% role=run\nfrom qiskit_ibm_runtime import QiskitRuntimeService\n# %% [markdown] role=summary\n# y\n"
    failures = check_structure(parse_source(text))
    assert any("execute=false" in f for f in failures)


def test_every_kind_has_prompt_text_and_the_prompt_matches_the_checks() -> None:
    for kind in NotebookKind:
        assert structure_for(kind)
    assert len(STARTER_BRIEFS) >= 5
    assert {b["kind"] for b in STARTER_BRIEFS} <= {k.value for k in NotebookKind}


# --------------------------------------------------------------------------- revision


def test_replace_keeps_the_id_and_untouched_cells_byte_identical() -> None:
    spec = parse_source(LESSON)
    plan = RevisionPlan(
        reply="Done.",
        summary="simpler explanation",
        ops=[
            RevisionOp(
                op="replace",
                cell_id="c07",
                cells_source="# %% [markdown] role=explain\n# H makes a superposition.\n",
            )
        ],
    )
    revised = apply_revision(spec, plan)
    assert [c.id for c in revised.cells] == [c.id for c in spec.cells]
    assert revised.cell_by_id("c07").source == "H makes a superposition.\n"
    assert all(a == b for a, b in zip(revised.cells, spec.cells, strict=True) if a.id != "c07")


def test_insert_delete_move_and_set_field() -> None:
    spec = parse_source(LESSON)
    plan = RevisionPlan(
        reply="ok",
        ops=[
            RevisionOp(
                op="insert_after",
                cell_id="c02",
                cells_source="# %% [markdown] role=note\n# Note.\n# %% role=run\nprint(1)\n",
            ),
            RevisionOp(op="delete", cell_id="c03"),
            RevisionOp(op="move", cell_id="c01", after_id="c02"),
            RevisionOp(op="set_field", field="title", value="Renamed"),
            RevisionOp(op="set_field", field="style", value={"analogies": False, "tone": "formal"}),
        ],
    )
    revised = apply_revision(spec, plan)
    ids = [c.id for c in revised.cells]
    assert "c03" not in ids
    assert ids[:4] == [
        "c02",
        "c01",
        "c11",
        "c12",
    ]  # moved c01 after c02; inserted cells got fresh ids
    assert revised.title == "Renamed"
    assert revised.style.tone == "formal" and revised.style.analogies is False
    assert revised.cell_by_id("c12").source == "print(1)\n"


def test_bad_operation_fails_loudly_and_leaves_the_spec_alone() -> None:
    spec = parse_source(LESSON)
    with pytest.raises(RevisionError, match="no cell 'zzz'"):
        apply_revision(spec, RevisionPlan(reply="", ops=[RevisionOp(op="delete", cell_id="zzz")]))
    with pytest.raises(ValueError, match="needs cells_source"):
        RevisionOp(op="replace", cell_id="c01")


# --------------------------------------------------------------------------- atlas


def test_corpus_prose_keeps_math_and_escapes_markdown_characters() -> None:
    text = "needs $||u_{in}||$ bounded and _x_ | y [[approximation: first order in $t$]]"
    out = corpus_prose_to_markdown(text)
    assert "$||u_{in}||$" in out
    assert "\\_x\\_ \\| y" in out
    assert "**approximation:** first order in $t$" in out


def test_seed_from_record_uses_the_records_code_and_citations() -> None:
    record = {
        "slug": "quantum-fourier-transform",
        "title": "Quantum Fourier transform",
        "category": "algorithms",
        "codeVariants": [
            {
                "framework": "Qiskit",
                "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(3)\nqc.h(0)\nFINAL_CIRCUIT = qc\n",
            }
        ],
        "explanationMd": "The QFT maps $|x\\rangle$ to a phase pattern.",
        "literature": [
            {
                "title": "Quantum Computation and Quantum Information",
                "authors": "Nielsen, Chuang",
                "year": 2010,
                "url": "https://example.org",
            }
        ],
    }
    seed, material, run_cell, refs = seed_from_record(record)
    assert seed.kind == "atlas-record" and seed.ref == "quantum-fourier-transform"
    assert "FINAL_CIRCUIT = qc" in run_cell and "draw('text')" in run_cell
    assert "CITATIONS" in material and refs[0].year == 2010
    with pytest.raises(ValueError, match="no code variant"):
        seed_from_record({"slug": "x", "codeVariants": []})


# --------------------------------------------------------------------------- prompts


def test_prompts_render_and_the_outline_schema_validates_a_minimal_outline() -> None:
    outline = NotebookOutline.model_validate(
        {
            "title": "T",
            "kind": "lesson",
            "summary": "s",
            "objectives": ["o"],
            "duration_minutes": 30,
            "sections": [
                {
                    "heading": "h",
                    "purpose": "p",
                    "cells": [{"kind": "markdown", "role": "objective", "intent": "i"}],
                }
            ],
        }
    )
    user = render_outline_user_prompt(
        brief="teach me",
        kind_hint=None,
        audience=None,
        style=None,
        framework=None,
        seeds=[],
        seed_material="",
    )
    assert (
        "structure_requirements" in user
        and json.loads(user.split("\n\nSEED")[0])["brief"] == "teach me"
    )
    draft = render_draft_user_prompt(
        outline, brief="teach me", seed_material="", response_locale="ja"
    )
    assert "Japanese" in draft and "StatevectorSampler" in draft and "# %%" in draft


# --------------------------------------------------------------------------- curriculum


def _joined(source: str | list[str]) -> str:
    """nbformat writes multi-line sources as lists of lines."""
    return "".join(source) if isinstance(source, list) else source


def test_curriculum_build_emits_stubbed_challenge_and_separate_solution(tmp_path: Path) -> None:
    src = tmp_path / "src"
    (src / "week01_x").mkdir(parents=True)
    (src / "static" / "scripts").mkdir(parents=True)
    (src / "curriculum.yaml").write_text(
        "slug: demo\ntitle: Demo course\nunits:\n  - id: week01\n    directory: week01_x\n    title: One\n",
        encoding="utf-8",
    )
    (src / "week01_x" / "README.md").write_text("# guide\n", encoding="utf-8")
    (src / "week01_x" / "CHECKLIST.md").write_text("- [ ] did it\n", encoding="utf-8")
    (src / "static" / "scripts" / "validate.py").write_text("print('v')\n", encoding="utf-8")
    (src / "week01_x" / "lab.nb.py").write_text(
        LESSON.replace("kind: lesson", "kind: lab"), encoding="utf-8"
    )
    (src / "week01_x" / "challenge.nb.py").write_text(
        "# ---\n# title: C\n# kind: challenge\n# ---\n# %% [markdown] role=objective\n# o\n# %% [markdown] role=exercise\n# do\n"
        '# %% role=solution stub="answer = None\\n"\nanswer = 1\n# %% [markdown] role=hint\n# h\n# %% role=checkpoint\nif answer is not None:\n    assert answer == 1\n# %% [markdown] role=summary\n# s\n',
        encoding="utf-8",
    )
    manifest = build_curriculum(src, tmp_path / "out")
    out = tmp_path / "out"
    assert (out / "week01_x" / "lab.ipynb").exists()
    assert (out / "week01_x" / "challenge.ipynb").exists()
    assert (out / "solutions" / "week01_x" / "challenge_solution.ipynb").exists()
    assert (out / "solutions" / "week01_x" / "SELF_EVALUATION.md").read_text() == "- [ ] did it\n"
    assert (out / "scripts" / "validate.py").exists()
    assert (out / "week01_x" / "README.md").exists()
    challenge = json.loads((out / "week01_x" / "challenge.ipynb").read_text())
    sources = [_joined(c["source"]) for c in challenge["cells"]]
    assert "answer = None\n" in sources and "answer = 1\n" not in sources
    solution = json.loads((out / "solutions" / "week01_x" / "challenge_solution.ipynb").read_text())
    assert "answer = 1\n" in [_joined(c["source"]) for c in solution["cells"]]
    # the lab fixture lacks the second checkpoint a lab needs, and the manifest says so
    assert not manifest.ok
    assert any("lab.nb.py" in f and "checkpoint" in f for f in manifest.failures())
    spec = load_curriculum(src)
    assert spec.units[0].directory == "week01_x"
    assert [b for b, _ in builds_for(parse_source(LESSON), Path("w/lab.nb.py"), spec)] == ["full"]


def test_authoring_metadata_stays_out_of_the_build(tmp_path: Path) -> None:
    src = tmp_path / "src"
    src.mkdir()
    (src / "curriculum.yaml").write_text("slug: demo\ntitle: D\n", encoding="utf-8")
    (src / "AUTHORING.md").write_text("# rules for agents\n", encoding="utf-8")
    (src / "BRIEF-from-quanmatic.md").write_text("# their README\n", encoding="utf-8")
    (src / "README.md").write_text("# the course\n", encoding="utf-8")
    manifest = build_curriculum(src, tmp_path / "out")
    copied = {str(p.relative_to(manifest.out_dir)) for p in manifest.copied}
    assert copied == {"README.md"}
    assert not (tmp_path / "out" / "AUTHORING.md").exists()


def test_build_never_copies_an_environment(tmp_path: Path) -> None:
    src = tmp_path / "src"
    (src / "static" / ".venv" / "bin").mkdir(parents=True)
    (src / "static" / ".venv" / "bin" / "python").write_text("binary", encoding="utf-8")
    (src / "static" / "README.md").write_text("# r\n", encoding="utf-8")
    (src / "week01_x" / "__pycache__").mkdir(parents=True)
    (src / "week01_x" / "__pycache__" / "x.pyc").write_text("", encoding="utf-8")
    (src / "week01_x" / "README.md").write_text("# w\n", encoding="utf-8")
    (src / "curriculum.yaml").write_text("slug: demo\ntitle: D\n", encoding="utf-8")
    manifest = build_curriculum(src, tmp_path / "out")
    copied = {str(p.relative_to(manifest.out_dir)) for p in manifest.copied}
    assert copied == {"README.md", "week01_x/README.md"}
    assert not (tmp_path / "out" / ".venv").exists()


# ------------------------------------------------------- what each audience is owed
#
# `Audience.level` was carried on every spec, dumped into the outline prompt as JSON,
# and reached no rule, no prompt branch and no check anywhere. A notebook asked for a
# newcomer and one asked for a researcher were held to byte-identical requirements.


def _spec_at(level: str, **overrides):
    from majorana_contracts.notebooks import Audience, Cell, CellRole, NotebookSpec

    cells = overrides.pop(
        "cells",
        [
            Cell(id="c01", kind="markdown", role=CellRole.OBJECTIVE, source="## Go"),
            Cell(id="c02", kind="code", role=CellRole.RUN, source="x = 1"),
            Cell(id="c03", kind="markdown", role=CellRole.SUMMARY, source="Done."),
        ],
    )
    return NotebookSpec(
        slug="s",
        title="S",
        kind="scratch",
        audience=Audience(level=level),
        cells=cells,
        **overrides,
    )


def test_the_level_actually_changes_the_requirements() -> None:
    """The whole point. Before this, all four returned the same list."""
    from leona_notebooks.spec import NotebookKind

    by_level = {
        level: set(structure_for(NotebookKind.LESSON, level))
        for level in ("newcomer", "student", "engineer", "researcher")
    }
    assert by_level["newcomer"] != by_level["researcher"]
    assert by_level["newcomer"] > by_level["engineer"]
    assert by_level["researcher"] > by_level["engineer"]
    # `engineer` is the default every pre-existing notebook carries, so it must add
    # nothing — otherwise this change retroactively fails content that was correct.
    assert by_level["engineer"] == set(structure_for(NotebookKind.LESSON))


def test_every_level_the_contract_allows_has_rules_and_guidance() -> None:
    """A level added to the contract and nowhere else is a KeyError at request time.

    `render_draft_user_prompt` indexes `AUDIENCE_GUIDANCE` by the level directly, so the
    failure would be a 500 on generation rather than a worse notebook — and it would
    happen in the worker, not here, unless something ties the three lists together.
    """
    import typing

    from majorana_contracts.notebooks import Audience

    from leona_notebooks.prompts import AUDIENCE_GUIDANCE
    from leona_notebooks.templates import _LEVEL_RULES

    declared = set(typing.get_args(Audience.model_fields["level"].annotation))
    assert declared == set(AUDIENCE_GUIDANCE), "a level with no writing guidance"
    assert declared == set(_LEVEL_RULES), "a level with no structure rules entry"


def test_a_newcomer_notebook_must_explain_at_least_as_much_as_it_runs() -> None:
    from majorana_contracts.notebooks import Cell, CellRole

    code_heavy = _spec_at(
        "newcomer",
        cells=[
            Cell(id="c01", kind="markdown", role=CellRole.OBJECTIVE, source="## Go"),
            Cell(id="c02", kind="code", role=CellRole.RUN, source="a = 1"),
            Cell(id="c03", kind="code", role=CellRole.MODIFY, source="b = 2"),
            Cell(id="c04", kind="code", role=CellRole.OBSERVE, source="c = 3"),
            Cell(id="c05", kind="markdown", role=CellRole.SUMMARY, source="Done."),
        ],
    )
    failures = check_structure(code_heavy)
    assert any("as many markdown cells as code cells" in f for f in failures)
    assert any("No two code cells run back to back" in f for f in failures)
    # The same notebook at the default level is not held to either.
    assert (
        check_structure(code_heavy.model_copy(update={"audience": _spec_at("engineer").audience}))
        == []
    )


def test_a_research_notebook_must_seed_its_sampling() -> None:
    """Reproducibility, checked on the AST rather than on the word 'seed'.

    The negative control matters more than the positive one here: the same notebook with
    `seed=42` added must pass, or the rule is just 'contains no sampler'.
    """
    from majorana_contracts.notebooks import Cell, CellRole, Reference

    def at(source: str):
        return _spec_at(
            "researcher",
            references=[Reference(title="A paper", year=2024)],
            cells=[
                Cell(id="c01", kind="markdown", role=CellRole.OBJECTIVE, source="## Go"),
                Cell(id="c02", kind="code", role=CellRole.RUN, source=source),
                Cell(id="c03", kind="markdown", role=CellRole.EXPLAIN, source="It means X."),
                Cell(id="c04", kind="markdown", role=CellRole.REFERENCES, source="- A paper"),
            ],
        )

    unseeded = "sampler = StatevectorSampler()"
    seeded = "sampler = StatevectorSampler(seed=42)"
    assert any("explicit seed" in f for f in check_structure(at(unseeded)))
    assert check_structure(at(seeded)) == []
    # ...and a numpy RNG seeded positionally counts, which is how numpy spells it.
    assert check_structure(at("rng = default_rng(7)")) == []
    assert any("explicit seed" in f for f in check_structure(at("rng = default_rng()")))


def test_a_research_notebook_must_cite_and_must_interpret_its_last_result() -> None:
    from majorana_contracts.notebooks import Cell, CellRole, Reference

    ends_on_a_number = _spec_at(
        "researcher",
        references=[Reference(title="A paper", year=2024)],
        cells=[
            Cell(id="c01", kind="markdown", role=CellRole.OBJECTIVE, source="## Go"),
            Cell(id="c02", kind="markdown", role=CellRole.REFERENCES, source="- A paper"),
            Cell(id="c03", kind="code", role=CellRole.RUN, source="value = 1"),
            Cell(id="c04", kind="markdown", role=CellRole.OBSERVE, source="It printed 1."),
        ],
    )
    failures = check_structure(ends_on_a_number)
    # `observe` is not `explain`: describing what appeared is not saying what it means.
    assert any("interpreted after it is produced" in f for f in failures)

    uncited = ends_on_a_number.model_copy(update={"references": []})
    assert any("cited" in f for f in check_structure(uncited))


def test_the_solution_rule_checks_the_ordering_its_prose_promises() -> None:
    """Prose and predicate, back in step.

    The rule has said "each is preceded by the exercise it answers" since it was written,
    while its check was `_has_role(SOLUTION)` — satisfied by a notebook that is nothing
    but solutions in a row. This module's docstring is why that matters: every
    requirement is meant to be "both a sentence in the prompt and a predicate", written
    side by side "so they cannot drift apart unnoticed". The sentence is the half the
    model is given, so the drift taught the generator a rule nothing enforced.
    """
    from majorana_contracts.notebooks import Cell, CellRole, NotebookSpec

    def solution_notebook(*roles: CellRole) -> NotebookSpec:
        cells = [Cell(id="obj", kind="markdown", role=CellRole.OBJECTIVE, source="## Answers")]
        for index, role in enumerate(roles):
            cells.append(
                Cell(
                    id=f"c{index:02d}",
                    kind="code" if role is CellRole.SOLUTION else "markdown",
                    role=role,
                    source="x = 1" if role is CellRole.SOLUTION else "Do the thing.",
                )
            )
        cells.append(Cell(id="sum", kind="markdown", role=CellRole.SUMMARY, source="Done."))
        return NotebookSpec(slug="s", title="Solutions", kind="solution", cells=cells)

    paired = solution_notebook(
        CellRole.EXERCISE, CellRole.SOLUTION, CellRole.EXERCISE, CellRole.SOLUTION
    )
    assert not [f for f in check_structure(paired) if "preceded by the exercise" in f]

    # A solution with nothing before it to answer.
    orphan = solution_notebook(CellRole.SOLUTION, CellRole.EXERCISE)
    assert [f for f in check_structure(orphan) if "preceded by the exercise" in f]

    # Two solutions sharing one exercise: the notebook has stopped saying which answer
    # belongs to which question, which is what the ordering was for. `_has_role` alone
    # passes this, which is how the drift stayed invisible.
    doubled = solution_notebook(CellRole.EXERCISE, CellRole.SOLUTION, CellRole.SOLUTION)
    assert [f for f in check_structure(doubled) if "preceded by the exercise" in f]
