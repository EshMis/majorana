"use client";

/**
 * The program a run produced, in whichever framework the reader wants, with its
 * export.
 *
 * The Run surface used to end at a single code block in the one framework the
 * model happened to generate — the only place in the product where code appeared
 * without the conversions beside it. The artifact page had them, Studio had them, Atlas had
 * them, Run did not.
 *
 * The conversions cannot come from the run's own event stream. Events carry the
 * framework-native Python and only an *availability* flag for OpenQASM
 * (`qasm_emission`), never the QASM text — and the bounded parser cannot read
 * generated Python (`transpile`, `AerSimulator`, locals), so converting from it
 * yields nothing. The stored interchange QASM on the saved artifact version is
 * what every real conversion goes through, which is why this fetches the version
 * rather than deriving from events.
 *
 * If there is no saved artifact, or the fetch fails, this renders exactly the
 * plain code block the surface rendered before. A conversion panel is an
 * addition to the run's output; it is never allowed to take the code away.
 */

import { useEffect, useMemo, useState } from "react";
import { SyntaxHighlightedCode } from "@majorana/ui";

import { CircuitDiagram } from "./circuit-diagram";
import {
  artifactExportFilename,
  artifactExportSource,
  fileExtension,
} from "../lib/artifact-export";
import { reconstructInterchangeCircuit } from "../lib/circuit-conversion";
import { circuitFramework } from "../lib/circuit-frameworks";
import {
  frameworkCodeOptions,
  type FrameworkCodeOption,
} from "../lib/framework-code-options";
import { statusFromVerificationSummary } from "../lib/library-data";
import type { LibraryArtifact } from "../lib/library-data";
import { verificationSummaryFromValue } from "../lib/verification-record";
import type { PublicLocale } from "../lib/public-locale";

export interface RunCodeFallback {
  label: string;
  language: string;
  source: string;
}

type LoadedVersion = {
  options: FrameworkCodeOption[];
  qasm: string | null;
  /** Only the fields the export header reads. */
  exportArtifact: LibraryArtifact;
};

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadVersion(artifactId: string, title: string, signal: AbortSignal): Promise<LoadedVersion | null> {
  const response = await fetch(`/api/artifacts/${encodeURIComponent(artifactId)}/versions/current`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) return null;
  const version = (await response.json()) as {
    code?: unknown;
    code_lang?: unknown;
    qasm?: unknown;
    framework_variants?: unknown;
    verification_summary?: unknown;
  };
  const code = typeof version.code === "string" ? version.code : "";
  const framework = typeof version.code_lang === "string" ? version.code_lang : "qiskit";
  const qasm = typeof version.qasm === "string" && version.qasm.trim() ? version.qasm : null;
  const variants =
    version.framework_variants && typeof version.framework_variants === "object"
      && !Array.isArray(version.framework_variants)
      ? (version.framework_variants as Record<string, string>)
      : null;

  const options = frameworkCodeOptions({ framework, code, qasm, frameworkVariants: variants });
  if (!options.length) return null;

  const verificationSummary = verificationSummaryFromValue(version.verification_summary);
  return {
    options,
    qasm,
    // The export header states the artifact's real verification standing, and an
    // export that omitted an INCONCLUSIVE verdict would be the more dangerous
    // file. Only the fields `artifactExportHeader` reads are populated.
    exportArtifact: {
      id: artifactId,
      title,
      slug: "",
      status: statusFromVerificationSummary(verificationSummary),
      verificationSummary,
      qasm,
    } as LibraryArtifact,
  };
}

export function RunCodeExport(props: {
  artifactId: string | null;
  title: string;
  fallback: RunCodeFallback | null;
  locale?: PublicLocale;
}) {
  return <RunCodeExportView key={props.artifactId ?? "source"} {...props} />;
}

function RunCodeExportView({
  artifactId,
  title,
  fallback,
  locale = "en",
}: {
  artifactId: string | null;
  title: string;
  fallback: RunCodeFallback | null;
  locale?: PublicLocale;
}) {
  const [loaded, setLoaded] = useState<LoadedVersion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [requested, setRequested] = useState(!fallback);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [diagramOpen, setDiagramOpen] = useState(false);

  useEffect(() => {
    if (!artifactId || !requested) return;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    loadVersion(artifactId, title, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result) throw new Error("No source available");
        setLoaded(result);
        setSelected(result.options[0].key);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [artifactId, title, requested, attempt]);

  const option = loaded?.options.find((item) => item.key === selected) ?? loaded?.options[0];
  const source = option?.code ?? fallback?.source;
  const language = option ? circuitFramework(option.key).key : fallback?.language;
  const drawing = useMemo(() => diagramOpen && loaded?.qasm ? reconstructInterchangeCircuit(loaded.qasm) : null, [diagramOpen, loaded?.qasm]);
  const filename = loaded && option ? artifactExportFilename(
    { ...loaded.exportArtifact, slug: loaded.exportArtifact.slug || loaded.exportArtifact.id },
    option.key,
  ) : `generated-source.${language === "openqasm3" || language === "qasm" ? "qasm" : language === "python" || language === "qiskit" || language === "cirq" || language === "pennylane" ? "py" : "txt"}`;

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source ?? "");
      setCopyStatus(locale === "ja" ? "コピーしました" : "Copied");
    } catch {
      setCopyStatus(locale === "ja" ? "コピーできませんでした。コードを選択してコピーしてください。" : "Copy failed. Select the code and copy it manually.");
    }
  }

  return (
    <div className="mj-run-result-code">
      <div className="mj-run-code-head">
        <span className="mj-section-label">
          {locale === "ja" ? "プログラム" : "Program"} · {(!option || option.native)
            ? locale === "ja" ? "生成時のコード" : "as written"
            : locale === "ja" ? "変換済み" : "converted"}
        </span>
        <div className="mj-run-code-actions">
          {loaded && option ? <label>
            <span className="sr-only">{locale === "ja" ? "フレームワーク" : "Framework"}</span>
            <select value={option.key} onChange={(event) => { setSelected(event.target.value); setCopyStatus(null); }}>
              {loaded.options.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label> : artifactId ? <button className="mj-secondary-button" type="button" disabled={loading} onClick={() => { setRequested(true); setAttempt((value) => value + 1); }}>{loading ? locale === "ja" ? "読み込み中…" : "Loading formats…" : failed ? locale === "ja" ? "形式を再読み込み" : "Retry formats" : locale === "ja" ? "他の形式" : "More formats"}</button> : null}
          {source ? <button className="mj-secondary-button" type="button" onClick={() => void copySource()}>{locale === "ja" ? "コピー" : "Copy"}</button> : null}
          {/* The label used to be the whole filename — "Download
              bell-state-circuit.openqasm3.qasm" — which is a long, noisy button
              beside a framework picker that already says which framework this
              is. The exact name still reaches the user, on hover and in the
              accessible name, and is unchanged on disk. */}
          <button
            className="mj-secondary-button"
            type="button"
            disabled={!source}
            title={filename}
            aria-label={locale === "ja" ? `${filename}をダウンロード` : `Download ${filename}`}
            onClick={() =>
              download(
                loaded && option ? artifactExportSource(loaded.exportArtifact, {
                  framework: option.key,
                  code: option.code,
                }) : source ?? "",
                filename,
                "text/plain",
              )
            }
          >
            {locale === "ja" ? "ダウンロード" : "Download"} <span className="mj-mono-muted">.{fileExtension(filename)}</span>
          </button>
        </div>
      </div>
      {loaded?.qasm ? <details className="mj-run-code-diagram" open={diagramOpen} onToggle={(event) => setDiagramOpen(event.currentTarget.open)}><summary>{locale === "ja" ? "回路図" : "Circuit diagram"}</summary>{drawing?.kind === "ok" ? (
        <CircuitDiagram
          qubitCount={drawing.circuit.qubitCount}
          steps={drawing.circuit.steps}
          customGates={[]}
          ariaLabel={locale === "ja" ? `${title}の回路図` : `${title} circuit diagram`}
        />
      ) : diagramOpen ? <p>{locale === "ja" ? "このコードの回路図は表示できません。" : "A diagram is unavailable for this code."}</p> : null}</details> : null}
      {source ? <pre tabIndex={0} aria-label={locale === "ja" ? "ソースコード" : "Source code"}>
        <SyntaxHighlightedCode code={source} language={language ?? "text"} />
      </pre> : <p role="status">{loading ? locale === "ja" ? "コードを読み込み中…" : "Loading code…" : locale === "ja" ? "コードを読み込めませんでした。再試行してください。" : "Code could not be loaded. Retry formats to try again."}</p>}
      {copyStatus ? <p className="mj-run-code-note" role="status">{copyStatus}</p> : null}
      {failed && source ? <p className="mj-run-code-note" role="status">{locale === "ja" ? "他の形式を読み込めませんでした。生成されたコードは引き続き利用できます。" : "Other formats could not be loaded. The generated source is still available."}</p> : null}
      {option?.note ? (
        <p className="mj-run-code-note">
          {locale === "ja"
            ? "この変換では標準ゲート分解を使用しています。ターゲットSDKのゲート規約との差異を確認してください。"
            : option.note}
        </p>
      ) : null}
    </div>
  );
}
