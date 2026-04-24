interface NearDearLogoProps {
  /** Pixel width of the rendered logo */
  width?: number
  /**
   * 'full'     — mark + wordmark + tagline + sub + domain (matches neardear-logo.svg 1:1)
   * 'compact'  — mark + wordmark only, side by side (for headers / navbars)
   * 'mark'     — three circles only (for tight spots, app icons)
   * 'wordmark' — "NearDear" text only (for dark banners, footers)
   */
  variant?: 'full' | 'compact' | 'mark' | 'wordmark'
  /** White "Near" text — use on dark backgrounds */
  dark?: boolean
}

/**
 * NearDear brand logo — inline SVG, no external asset required.
 * Three overlapping circles (Saffron / Teal / Sage) + Playfair-style wordmark.
 */
export default function NearDearLogo({
  width = 160,
  variant = 'compact',
  dark = false,
}: NearDearLogoProps) {
  const nearColor = dark ? '#FFFFFF' : '#1C2B3A'

  // ── Mark only ────────────────────────────────────────────────────────────────
  // Normalized viewBox 176×169 derived from original SVG (offset −56, −38)
  if (variant === 'mark') {
    const h = Math.round((width * 169) / 176)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 169" width={width} height={h} aria-label="NearDear">
        <circle cx="62"  cy="107" r="62" fill="#E07B2F" opacity="0.82" />
        <circle cx="114" cy="107" r="62" fill="#1A6B7A" opacity="0.82" />
        <circle cx="88"  cy="62"  r="62" fill="#4A8C6F" opacity="0.82" />
      </svg>
    )
  }

  // ── Wordmark only ─────────────────────────────────────────────────────────────
  if (variant === 'wordmark') {
    const h = Math.round((width * 64) / 280)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" width={width} height={h} aria-label="NearDear">
        <text x="0"   y="52" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill={nearColor}>Near</text>
        <text x="138" y="52" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill="#E07B2F">Dear</text>
      </svg>
    )
  }

  // ── Compact: mark (scaled to height 48) + wordmark side by side ───────────────
  // Mark height 48 → scale = 48/169 = 0.284 → mark width = 176×0.284 = 50
  // Wordmark fontSize 38 → "NearDear" ≈ 150px wide
  // ViewBox: 210 × 48
  if (variant === 'compact') {
    const vw = 215, vh = 52
    const h = Math.round((width * vh) / vw)
    const s = vh / 169  // scale factor for mark
    const r = Math.round(62 * s)
    const cx1 = Math.round(62 * s), cy1 = Math.round(107 * s)
    const cx2 = Math.round(114 * s), cy2 = cy1
    const cx3 = Math.round(88 * s),  cy3 = Math.round(62 * s)
    const markW = Math.round(176 * s) // ~53
    const tx = markW + 10             // wordmark x start

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${vw} ${vh}`} width={width} height={h} aria-label="NearDear">
        {/* Mark */}
        <circle cx={cx1} cy={cy1} r={r} fill="#E07B2F" opacity="0.82" />
        <circle cx={cx2} cy={cy2} r={r} fill="#1A6B7A" opacity="0.82" />
        <circle cx={cx3} cy={cy3} r={r} fill="#4A8C6F" opacity="0.82" />
        {/* Wordmark — baseline at ~78% of height */}
        <text x={tx}      y="40" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" fill={nearColor}>Near</text>
        <text x={tx + 98} y="40" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" fill="#E07B2F">Dear</text>
      </svg>
    )
  }

  // ── Full: matches neardear-logo.svg 1:1 (680×320 viewBox) ────────────────────
  const h = Math.round((width * 320) / 680)
  const taglineColor = dark ? '#9CA3AF' : '#6B7280'
  const subColor = dark ? '#6B7280' : '#9CA3AF'
  const domainColor = dark ? '#6B7280' : '#9CA3AF'
  const dividerColor = dark ? '#2D3E50' : '#E8E0D8'
  const circleOpacity = dark ? '0.90' : '0.82'

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 320" width={width} height={h} aria-label="NearDear — Someone near. Someone dear.">
      {/* Three circles */}
      <circle cx="118" cy="145" r="62" fill="#E07B2F" opacity={circleOpacity} />
      <circle cx="170" cy="145" r="62" fill="#1A6B7A" opacity={circleOpacity} />
      <circle cx="144" cy="100" r="62" fill="#4A8C6F" opacity={circleOpacity} />

      {/* Wordmark */}
      <text x="260" y="125" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill={nearColor}>Near</text>
      <text x="390" y="125" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill="#E07B2F">Dear</text>

      {/* Divider */}
      <line x1="260" y1="138" x2="540" y2="138" stroke={dividerColor} strokeWidth="1" />

      {/* Tagline */}
      <text x="260" y="168" fontFamily="Georgia, serif" fontSize="15" fill={taglineColor} letterSpacing="2">
        SOMEONE NEAR.  SOMEONE DEAR.
      </text>

      {/* Sub */}
      <text x="260" y="196" fontFamily="Arial, sans-serif" fontSize="12" fill={subColor} fontStyle="italic" letterSpacing="0.5">
        &quot;The neighbour who used to check in — reimagined.&quot;
      </text>

      {/* Role labels */}
      <text x="100" y="224" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill={taglineColor}>Family</text>
      <text x="170" y="224" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill={taglineColor}>Companion</text>
      <text x="144" y="235" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill={taglineColor}>Platform</text>

      {/* Domain */}
      <text x="260" y="240" fontFamily="Arial, sans-serif" fontSize="11" fill={domainColor} letterSpacing="1">neardear.in</text>
    </svg>
  )
}
