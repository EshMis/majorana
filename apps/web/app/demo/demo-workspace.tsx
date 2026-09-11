"use client";

import Link from "next/link";
import { Shell } from "../../components/shell";
import { RunWorkspace } from "../(app)/run/run-workspace";
import { LibraryStudio } from "../(app)/library/library-studio";
import type { PublicLocale } from "../../lib/public-locale";
import { WORKSPACE_COPY } from "../../lib/workspace-locale";

export function DemoWorkspace({ locale = "en", view = "run" }: { locale?: PublicLocale; view?: "run" | "library" }) {
  const copy = WORKSPACE_COPY[locale];

  return (
    <Shell demoMode locale={locale} headerRight={<span className="font-mono">{copy.sidebar.readOnlyData}</span>}>
      <div className="mj-demo-banner">
        <div>
          <span className="mj-section-label">{copy.surfaces.preview}</span>
          <h1>{locale === "ja" ? "Leona Quantumのワークスペースを試す" : "Explore the Leona Quantum workspace."}</h1>
          <p>{locale === "ja" ? "このプレビューではサンプルデータを使って、主な操作の流れを確認できます。" : "Explore the workflow with sample circuits and results. Sign in to save and run your own work."}</p>
        </div>
        <nav className="mj-demo-tabs" aria-label={copy.surfaces.preview}>
          <Link className={view === "run" ? "is-active" : ""} href="/demo?view=run" aria-current={view === "run" ? "page" : undefined}>{copy.surfaces.brandedRun}</Link>
          <Link className={view === "library" ? "is-active" : ""} href="/demo?view=library" aria-current={view === "library" ? "page" : undefined}>{copy.library.title}</Link>
        </nav>
      </div>
      {view === "library" ? <LibraryStudio demoMode locale={locale} /> : <RunWorkspace demoMode locale={locale} />}
    </Shell>
  );
}
