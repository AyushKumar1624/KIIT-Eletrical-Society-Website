// Patent-drawing style line art. Strokes use currentColor so each
// drawing takes the tone of the panel it sits on.

export function LampFigure({ className }) {
  return (
    <svg className={className} viewBox="0 0 360 480" role="img" aria-labelledby="lamp-title">
      <title id="lamp-title">Engraving of an incandescent filament lamp, annotated as Fig. 1</title>
      <defs>
        <radialGradient id="lamp-glow" cx="50%" cy="38%" r="45%">
          <stop offset="0" stopColor="#E7C98E" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#B59A69" stopOpacity="0.16" />
          <stop offset="1" stopColor="#B59A69" stopOpacity="0" />
        </radialGradient>
        <pattern id="lamp-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
        </pattern>
      </defs>

      <circle cx="180" cy="168" r="150" fill="url(#lamp-glow)" className="lamp-glow" />

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* globe */}
        <path d="M146 318 C146 276 86 248 86 168 A94 94 0 0 1 274 168 C274 248 214 276 214 318" strokeWidth="1.6" />
        <path d="M112 128 A72 72 0 0 1 168 94" strokeWidth="0.8" opacity="0.6" />
        <path d="M104 150 A80 80 0 0 1 116 118" strokeWidth="0.8" opacity="0.4" />
        {/* exhaust tip */}
        <path d="M176 74 L180 64 L184 74" strokeWidth="1" />
        {/* stem */}
        <path d="M160 318 L164 262 C166 252 194 252 196 262 L200 318" strokeWidth="1" />
        {/* lead-in wires */}
        <path d="M170 262 L158 182" strokeWidth="1" />
        <path d="M190 262 L202 182" strokeWidth="1" />
        {/* filament */}
        <path d="M158 182 C150 120 210 120 202 182" strokeWidth="1.8" className="lamp-filament" />
        <path d="M163 178 C158 132 202 132 197 178" strokeWidth="0.7" opacity="0.5" />
        {/* base: collar + threads */}
        <path d="M144 318 H216 V334 H144 Z" fill="url(#lamp-hatch)" strokeWidth="1.2" />
        <path d="M148 334 C148 340 212 340 212 334 M146 346 C146 352 214 352 214 346 M148 358 C148 364 212 364 212 358 M150 370 C150 376 210 376 210 370" strokeWidth="1.1" />
        <path d="M148 334 L146 346 L148 358 L150 370 L156 386 H204 L210 370 L212 358 L214 346 L212 334" strokeWidth="1.2" />
        <path d="M166 386 L170 398 H190 L194 386" strokeWidth="1.2" />
        <path d="M172 398 H188" strokeWidth="2.4" />

        {/* centre line */}
        <path d="M180 40 V420" strokeWidth="0.5" strokeDasharray="6 3 1 3" opacity="0.45" />

        {/* dimension: globe diameter */}
        <path d="M86 432 V420 M274 432 V420 M86 428 H274" strokeWidth="0.6" opacity="0.7" />
        <path d="M86 428 l7 -3 v6 Z M274 428 l-7 -3 v6 Z" fill="currentColor" stroke="none" opacity="0.7" />

        {/* leaders */}
        <g strokeWidth="0.6" opacity="0.85">
          <path d="M202 150 L292 92 H330" />
          <path d="M262 216 L300 216 H330" />
          <path d="M196 236 L300 284 H330" />
          <path d="M146 352 L60 352 H30" />
          <path d="M98 196 L54 196 H30" />
        </g>
        <g fill="currentColor" stroke="none">
          <circle cx="202" cy="150" r="2" />
          <circle cx="262" cy="216" r="2" />
          <circle cx="196" cy="236" r="2" />
          <circle cx="146" cy="352" r="2" />
          <circle cx="98" cy="196" r="2" />
        </g>
      </g>

      <g className="lamp-labels" fill="currentColor">
        <text x="332" y="95">A</text>
        <text x="332" y="219">B</text>
        <text x="332" y="287">C</text>
        <text x="20" y="355" textAnchor="end">D</text>
        <text x="20" y="199" textAnchor="end">E</text>
        <text x="180" y="452" textAnchor="middle" className="lamp-caption">Fig. 1 — Incandescent lamp, elevation</text>
      </g>
    </svg>
  );
}

const glyphs = {
  ai: <><circle cx="60" cy="60" r="18" /><circle cx="30" cy="28" r="6" /><circle cx="92" cy="30" r="6" /><circle cx="26" cy="90" r="6" /><circle cx="92" cy="92" r="6" /><path d="M34 33 48 46M88 34 74 46M31 86 47 74M87 87 74 74M54 54H66V66H54Z" /></>,
  web: <><rect x="18" y="26" width="84" height="68" rx="4" /><path d="M18 42H102M29 34H31M38 34H40M45 56 33 68 45 80M75 56 87 68 75 80M65 52 55 84" /></>,
  design: <><rect x="24" y="24" width="72" height="72" /><path d="M24 48H96M48 24V96M58 80 71 54 85 80M62 72H81" /><circle cx="36" cy="36" r="4" /></>,
  media: <><path d="M18 42H40L47 30H73L80 42H102V94H18Z" /><circle cx="60" cy="67" r="18" /><circle cx="60" cy="67" r="10" /><path d="M87 51H92" /></>,
  outreach: <><path d="M24 50H48L90 30V90L48 70H24ZM48 50V70M30 70 38 94H53L45 70M98 46 109 40M100 60H112M98 74 109 80" /></>,
  events: <><rect x="24" y="30" width="72" height="66" rx="3" /><path d="M24 48H96M40 23V38M80 23V38M38 61H47M57 61H66M76 61H85M38 76H47M57 76H66M76 76H85" /></>,
  writing: <><path d="M30 23H76L91 38V97H30ZM76 23V38H91M42 49H78M42 61H78M42 73H70M42 85H60" /></>,
  embedded: (
    <>
      <rect x="34" y="30" width="52" height="60" rx="2" />
      <rect x="46" y="44" width="28" height="22" strokeDasharray="2 2" />
      {[38, 48, 58, 68, 78].map(y => <path key={`l${y}`} d={`M34 ${y} H22 M86 ${y} H98`} />)}
      <circle cx="60" cy="78" r="3" />
      <path d="M22 38 V18 H60 V30" opacity="0.6" />
    </>
  ),
  iot: (
    <>
      <circle cx="60" cy="74" r="6" />
      <path d="M60 80 V100 M48 100 H72" />
      <path d="M44 60 A22 22 0 0 1 76 60 M34 50 A36 36 0 0 1 86 50 M24 40 A50 50 0 0 1 96 40" />
      <circle cx="22" cy="92" r="3" /><circle cx="98" cy="92" r="3" />
      <path d="M25 92 H54 M66 92 H95" strokeDasharray="2 3" opacity="0.7" />
    </>
  ),
  power: (
    <>
      <path d="M20 34 H40 M20 86 H40 M80 34 H100 M80 86 H100" />
      <path d="M40 34 c10 0 10 8.7 0 8.7 c10 0 10 8.7 0 8.7 c10 0 10 8.7 0 8.7 c10 0 10 8.7 0 8.7 c10 0 10 8.7 0 8.7 c10 0 10 8.7 0 8.7" />
      <path d="M80 34 c-10 0 -10 8.7 0 8.7 c-10 0 -10 8.7 0 8.7 c-10 0 -10 8.7 0 8.7 c-10 0 -10 8.7 0 8.7 c-10 0 -10 8.7 0 8.7 c-10 0 -10 8.7 0 8.7" />
      <path d="M56 28 V92 M64 28 V92" strokeWidth="1.6" />
      <text x="24" y="108" className="glyph-note">N₁</text>
      <text x="86" y="108" className="glyph-note">N₂</text>
    </>
  ),
  robotics: (
    <>
      <path d="M26 100 H74 M34 100 V92 H66 V100" />
      <circle cx="50" cy="84" r="7" />
      <path d="M50 84 L72 50" strokeWidth="2.4" />
      <circle cx="72" cy="50" r="5" />
      <path d="M72 50 L98 40" strokeWidth="2" />
      <path d="M98 40 l6 -8 M98 40 l8 4" />
      <path d="M58 70 A16 16 0 0 1 64 62" strokeDasharray="2 2" opacity="0.7" />
    </>
  ),
};

export function DomainGlyph({ name }) {
  return (
    <svg className="glyph" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {glyphs[name]}
      </g>
    </svg>
  );
}

// Thin brass divider with a centred terminal.
export function Rule({ className = "" }) {
  return (
    <div className={`rule ${className}`} aria-hidden="true">
      <span /><svg viewBox="0 0 24 12"><circle cx="12" cy="6" r="3.2" fill="none" stroke="currentColor" /><circle cx="12" cy="6" r="1" fill="currentColor" /></svg><span />
    </div>
  );
}
