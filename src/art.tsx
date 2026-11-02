/** Squeek hamster portrait: the hamster itself, with one light accessory. Deterministic by token ID. */
const FURS = [
  ["#e9b77a", "#f6dcb4"], ["#d9a066", "#f1d2a8"], ["#c98f5a", "#ecc89c"], ["#efc995", "#fbe9cf"],
  ["#b98352", "#e6c39a"], ["#e2ad7e", "#f7dfc4"], ["#d6b48c", "#f3e4cf"], ["#c7a27a", "#efdcc2"],
];
const BG = ["#2a251e", "#2b2420", "#26241f", "#2d261c"];

type Props = { id: string; title?: string; size?: number };

export function HamsterArt({ id, title, size = 96 }: Props) {
  const n = Number(id.replace(/\D/g, "")) || 0;
  const [fur, belly] = FURS[n % FURS.length];
  const bg = BG[n % BG.length];
  const acc = n % 5; // 0 bow, 1 leaf, 2 scarf, 3 star clip, 4 none
  const eyeArc = n % 3 === 0;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <rect width="100" height="100" rx="10" fill={bg} />
      <circle cx="50" cy="56" r="34" fill="#f2a93b" opacity="0.08" />
      {/* ears */}
      <ellipse cx="27" cy="30" rx="11" ry="10" fill={fur} />
      <ellipse cx="73" cy="30" rx="11" ry="10" fill={fur} />
      <ellipse cx="27" cy="31" rx="6" ry="5.5" fill="#e79a8f" />
      <ellipse cx="73" cy="31" rx="6" ry="5.5" fill="#e79a8f" />
      {/* body and head */}
      <ellipse cx="50" cy="80" rx="30" ry="20" fill={fur} />
      <ellipse cx="50" cy="52" rx="31" ry="27" fill={fur} />
      <ellipse cx="50" cy="62" rx="22" ry="16" fill={belly} />
      {/* cheeks */}
      <ellipse cx="30" cy="60" rx="8" ry="6" fill="#ef9c8c" opacity="0.55" />
      <ellipse cx="70" cy="60" rx="8" ry="6" fill="#ef9c8c" opacity="0.55" />
      {/* eyes */}
      {eyeArc ? (
        <g stroke="#2b1d12" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M34 49 q4 -4 8 0" />
          <path d="M58 49 q4 -4 8 0" />
        </g>
      ) : (
        <g fill="#2b1d12">
          <circle cx="38" cy="48" r="3.6" />
          <circle cx="62" cy="48" r="3.6" />
          <circle cx="39.2" cy="46.8" r="1.1" fill="#fff" />
          <circle cx="63.2" cy="46.8" r="1.1" fill="#fff" />
        </g>
      )}
      {/* nose, mouth, teeth */}
      <ellipse cx="50" cy="56" rx="2.6" ry="2" fill="#c96f6a" />
      <path d="M46 60 q4 3 4 0 q0 3 4 0" stroke="#2b1d12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <rect x="48.2" y="61" width="3.6" height="3.2" rx="0.8" fill="#fff" />
      {/* paws */}
      <ellipse cx="41" cy="77" rx="5" ry="3.6" fill={belly} />
      <ellipse cx="59" cy="77" rx="5" ry="3.6" fill={belly} />
      {/* accessory */}
      {acc === 0 && (
        <g fill="#f2a93b">
          <path d="M64 22 l9 -5 v10 z" />
          <path d="M64 22 l-9 -5 v10 z" />
          <circle cx="64" cy="22" r="2.4" fill="#c9821d" />
        </g>
      )}
      {acc === 1 && <path d="M50 26 q-2 -10 8 -12 q-1 9 -8 12 z" fill="#7cbf7a" />}
      {acc === 2 && <path d="M28 72 q22 9 44 0 v6 q-22 9 -44 0 z" fill="#c9821d" />}
      {acc === 3 && <path d="M31 22 l2.2 4.4 4.8 .7 -3.5 3.4 .8 4.8 -4.3 -2.3 -4.3 2.3 .8 -4.8 -3.5 -3.4 4.8 -.7 z" fill="#f6d36b" />}
    </svg>
  );
}
