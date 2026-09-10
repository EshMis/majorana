/**
 * The section names every Atlas surface draws — the map card, and since the
 * 2026-09-10 Atlas pass the record page too, which the owner asked to *"match
 * exactly how the cards look like when clicked into on the map"*.
 *
 * One list, imported by both, so the two surfaces cannot name a section
 * differently. The words are his: see the comment above `sections` in
 * `map-card-panel.tsx` for where each came from. The chrome words beside them
 * (the row's label, the references heading, the two gap sentences) are shared
 * for the same reason.
 */
import type { CardSectionId } from "./card-content.ts";

export const ATLAS_SECTION_LABELS: Record<"en" | "ja", Record<CardSectionId, string>> = {
  en: {
    "when-it-applies": "When it applies",
    input: "Input",
    theory: "Theory",
    output: "Output",
    requires: "Requires",
    example: "Example",
    performance: "Performance",
    refinements: "Refinements",
    alternatives: "Alternatives",
    "makes-unnecessary": "Makes unnecessary",
    contested: "Where the claim is contested",
    implementations: "Implementations",
    records: "In the Atlas",
    contract: "What it takes and returns",
    between: "Between these two states",
    "no-slot": "No named step covers this",
    "why-a-layer": "Why it is a layer at all",
    "filled-by": "Methods that fill it",
    "bypassed-by": "Routes that make it unnecessary",
    "classical-equivalents": "Classical equivalents",
  },
  ja: {
    "when-it-applies": "適用条件",
    input: "入力",
    theory: "理論",
    output: "出力",
    requires: "必要なもの",
    example: "例",
    performance: "性能",
    refinements: "改良版",
    alternatives: "代替の手法",
    "makes-unnecessary": "不要にする枠",
    contested: "主張が争われている点",
    implementations: "実装",
    records: "Atlas の収録項目",
    contract: "入力と出力",
    between: "この二つの状態のあいだ",
    "no-slot": "名前のある工程がまだありません",
    "why-a-layer": "なぜ層として立てるのか",
    "filled-by": "これを満たす手法",
    "bypassed-by": "これを不要にする経路",
    "classical-equivalents": "古典的な対応物",
  },
};

export const ATLAS_CHROME_COPY = {
  en: {
    sectionsLabel: "Sections of this card",
    references: "References",
    noneFound: "None found yet.",
    noField: "No field holds this yet — the model is still being designed.",
  },
  ja: {
    sectionsLabel: "このカードの項目",
    references: "文献",
    noneFound: "まだ見つかっていません。",
    noField: "これを保持する項目はまだありません。設計中です。",
  },
} as const;
