/** Small diagrams distinguish tools by what they do. Decorative; links supply names. */
export function ProductGlyph({ kind }: { kind: string }) {
  return (
    <svg className="lq-product-glyph" viewBox="0 0 160 100" fill="none" aria-hidden="true">
      {kind.toLowerCase().includes("atlas") ? <>
        <path d="M28 24H76V50H130M28 76H76V50M76 50V16H130M76 50V84H130" />
        {[ [28,24], [28,76], [76,50], [130,16], [130,50], [130,84] ].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" />)}
      </> : kind === "Notebooks" || kind === "ノートブック" ? <>
        <rect x="32" y="12" width="96" height="76" rx="6" />
        <path d="M46 29H108M46 40H85M46 64H59M46 74H70M91 74V60M102 74V52M113 74V44" />
      </> : kind === "Qapps" ? <>
        <rect x="24" y="17" width="112" height="66" rx="6" />
        <path d="M40 37H120M40 51H120M40 65H120" />
        <circle cx="62" cy="37" r="5" /><circle cx="97" cy="51" r="5" /><circle cx="77" cy="65" r="5" />
      </> : kind === "Studio" ? <>
        <path d="M14 32H146M14 68H146M95 32V68" />
        <rect x="41" y="20" width="24" height="24" rx="3" /><circle cx="95" cy="32" r="4" /><circle cx="95" cy="68" r="10" />
        <path d="M89 68H101M95 62V74" /><text x="53" y="36" textAnchor="middle">H</text>
      </> : <>
        <ellipse cx="80" cy="50" rx="43" ry="18" transform="rotate(-35 80 50)" />
        <ellipse cx="80" cy="50" rx="43" ry="18" transform="rotate(35 80 50)" />
        <circle cx="80" cy="50" r="7" /><circle cx="114" cy="29" r="4" />
      </>}
    </svg>
  );
}
