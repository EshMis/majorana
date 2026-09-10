import type { PublicLocale } from "../lib/public-locale";

// The Bell circuit used by the Studio parser regression suite.
const BELL_CODE = "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()";

export function LandingCircuit({ locale }: { locale: PublicLocale }) {
  return (
    <figure className="lq-landing-circuit">
      <figcaption>
        <span className="mj-section-label">{locale === "ja" ? "回路の例 · Qiskit" : "Example circuit · Qiskit"}</span>
        <h4>{locale === "ja" ? "ベル状態をつくる" : "A Bell state, step by step"}</h4>
      </figcaption>
      <svg className="lq-bell-diagram" viewBox="0 0 440 150" aria-hidden="true">
        <g className="lq-circuit-wires">
          <path d="M80 45H414M80 105H414M246 45V105" />
          <rect x="129" y="26" width="38" height="38" rx="2" />
          <circle cx="246" cy="105" r="16" />
          <path d="M234 105H258M246 93V117" />
          <rect x="333" y="26" width="38" height="38" rx="2" />
          <rect x="333" y="86" width="38" height="38" rx="2" />
        </g>
        <circle className="lq-circuit-control" cx="246" cy="45" r="5" />
        <g className="lq-circuit-labels">
          <text x="8" y="50">q₀ |0⟩</text><text x="8" y="110">q₁ |0⟩</text>
          <text x="148" y="51" textAnchor="middle">H</text>
          <text x="352" y="51" textAnchor="middle">M</text><text x="352" y="111" textAnchor="middle">M</text>
        </g>
      </svg>
      <pre tabIndex={0} aria-label={locale === "ja" ? "ベル回路のQiskitコード" : "Qiskit Bell circuit code"}><code>{BELL_CODE}</code></pre>
      <p>{locale === "ja" ? "Hゲートで重ね合わせをつくり、制御Xゲートで2つの量子ビットをもつれさせてから測定します。" : "Create a superposition with H, entangle the two qubits with a controlled X, then measure."}</p>
    </figure>
  );
}
