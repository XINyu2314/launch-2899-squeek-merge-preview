/** Squeek hamster portrait. Looks are chosen in portraits.ts; this file only draws them. */
import { lookFor, type Look } from "./portraits";

type Props = { id: string; title?: string; size?: number };

type Layout = {
  headRx: number;
  headRy: number;
  headCy: number;
  bodyRx: number;
  bodyRy: number;
  bodyCy: number;
  eyeDx: number;
  eyeY: number;
  noseY: number;
  mouthY: number;
  cheekRx: number;
  cheekRy: number;
  cheekY: number;
  earSpread: number;
  earY: number;
  pawY: number;
};

function layout(cheeks: Look["cheeks"]): Layout {
  if (cheeks === "huge") {
    return {
      headRx: 33, headRy: 28, headCy: 55, bodyRx: 34, bodyRy: 21, bodyCy: 82,
      eyeDx: 13, eyeY: 51, noseY: 60, mouthY: 65, cheekRx: 10, cheekRy: 7.2, cheekY: 64,
      earSpread: 24, earY: 34, pawY: 80,
    };
  }
  if (cheeks === "small") {
    return {
      headRx: 24, headRy: 21, headCy: 50, bodyRx: 26, bodyRy: 16, bodyCy: 78,
      eyeDx: 10, eyeY: 47, noseY: 54, mouthY: 58, cheekRx: 5.5, cheekRy: 4.2, cheekY: 56,
      earSpread: 18, earY: 32, pawY: 74,
    };
  }
  return {
    headRx: 30, headRy: 26, headCy: 52, bodyRx: 30, bodyRy: 20, bodyCy: 80,
    eyeDx: 12, eyeY: 48, noseY: 56, mouthY: 61, cheekRx: 8, cheekRy: 6, cheekY: 60,
    earSpread: 23, earY: 31, pawY: 77,
  };
}

function Backdrop({ look }: { look: Look }) {
  const { bg, halo, bgShape } = look;
  return (
    <g>
      <rect width="100" height="100" rx="10" fill={bg} />
      {bgShape === "circle" && <circle cx="50" cy="58" r="34" fill={halo} opacity="0.34" />}
      {bgShape === "diamond" && <rect x="18" y="18" width="64" height="64" rx="8" transform="rotate(45 50 50)" fill={halo} opacity="0.32" />}
      {bgShape === "blob" && (
        <g fill={halo}>
          <circle cx="36" cy="46" r="26" opacity="0.32" />
          <circle cx="66" cy="64" r="22" opacity="0.26" />
        </g>
      )}
      {bgShape === "arch" && <path d="M8 92 Q50 26 92 92 Z" fill={halo} opacity="0.3" />}
      {bgShape === "dots" && (
        <g fill={halo}>
          <circle cx="16" cy="16" r="5" opacity="0.55" />
          <circle cx="28" cy="14" r="3" opacity="0.4" />
          <circle cx="14" cy="28" r="2.4" opacity="0.35" />
        </g>
      )}
      {bgShape === "stripe" && <path d="M0 0 h42 L0 46 Z" fill={halo} opacity="0.4" />}
    </g>
  );
}

function Ear({ x, y, side, look, L, layer }: { x: number; y: number; side: "l" | "r"; look: Look; L: Layout; layer: "back" | "front" }) {
  const kind = look.ears;
  const flop = (kind === "flopL" && side === "l") || (kind === "flopR" && side === "r");
  if (flop !== (layer === "front")) return null;
  const s = look.cheeks === "small" ? 0.74 : look.cheeks === "huge" ? 1.04 : 1;
  const spread = kind === "wide" ? 8 : kind === "tiny" ? -3 : 0;
  const dx = side === "l" ? -spread : spread;
  const dy = kind === "wide" ? 9 : kind === "tall" ? -2 : kind === "point" ? -1 : kind === "tiny" ? 3 : 0;
  let rx = 11;
  let ry = 11.5;
  if (kind === "tall") { rx = 9.5; ry = 13; }
  else if (kind === "wide") { rx = 14.5; ry = 8; }
  else if (kind === "tiny") { rx = 6.6; ry = 7; }
  else if (kind === "point") { rx = 8.2; ry = 12; }
  else if (kind === "asymm") {
    if (side === "l") { rx = 8; ry = 10; }
    else { rx = 13; ry = 14; }
  }
  rx *= s;
  ry *= s;
  let cx = x + dx;
  let cy = y + dy;
  let rot = "";
  if (flop) {
    const dir = side === "l" ? -1 : 1;
    cx = 50 + dir * (L.headRx + 5);
    cy = L.headCy + 8;
    rx = 6.4 * s;
    ry = 13 * s;
    rot = `rotate(${dir * -36} ${cx} ${cy})`;
  }
  const tips = look.tip ?? (look.mark === "earTips" ? [look.accent, look.accent2] as const : null);
  const tip = tips ? tips[side === "l" ? 0 : 1] : null;
  return (
    <g transform={rot}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={tip ?? look.fur} />
      {tip && <ellipse cx={cx} cy={cy + ry * 0.36} rx={rx * 1.14} ry={ry * 0.82} fill={look.fur} />}
      <ellipse cx={cx} cy={cy + ry * 0.12} rx={rx * 0.46} ry={ry * 0.38} fill={look.inner} />
    </g>
  );
}

function Markings({ look, L }: { look: Look; L: Layout }) {
  const { mark, shade, belly } = look;
  if (mark === "none" || mark === "earTips") return null;
  if (mark === "blaze") {
    const top = L.headCy - L.headRy * 0.7;
    const bot = L.noseY - 1;
    const mid = (top + bot) / 2;
    return (
      <path
        d={`M 43 ${top} Q 42 ${mid} 46 ${bot} Q 50 ${bot + 3.5} 54 ${bot} Q 58 ${mid} 57 ${top} Q 50 ${top - 3.5} 43 ${top} Z`}
        fill={belly}
      />
    );
  }
  if (mark === "cap") {
    const capTop = L.headCy - L.headRy + 2;
    const capBottom = L.eyeY - 6;
    const ry = Math.max(6, (capBottom - capTop) / 2);
    const cy = capTop + ry;
    return <ellipse cx="50" cy={cy} rx={L.headRx * 0.7} ry={ry} fill={shade} />;
  }
  if (mark === "patch") {
    return <ellipse cx={50 - L.headRx * 0.28} cy={L.headCy + 1} rx={L.headRx * 0.52} ry={L.headRy * 0.66} fill={shade} />;
  }
  const dots = mark === "spots"
    ? [
        [50 - L.headRx * 0.42, L.headCy - L.headRy * 0.05, 7.2, 5.6],
        [50 + L.headRx * 0.38, L.headCy + L.headRy * 0.32, 6.4, 5],
        [50 + L.bodyRx * 0.28, L.bodyCy - 6, 8, 5.4],
      ]
    : mark === "speckle"
      ? [
          [50 - L.headRx * 0.55, L.headCy + 2, 4.2, 4.2],
          [50 + L.headRx * 0.5, L.headCy + 6, 4.6, 4.6],
          [50 - L.headRx * 0.2, L.headCy + L.headRy * 0.42, 3.8, 3.8],
          [50 + L.bodyRx * 0.34, L.bodyCy - 6, 4.4, 4.4],
          [50 - L.bodyRx * 0.28, L.bodyCy - 3, 3.8, 3.8],
        ]
      : [
          [50 - L.headRx * 0.46, L.cheekY - 2, 4.6, 4.6],
          [50 - L.headRx * 0.28, L.cheekY + 5, 3.6, 3.6],
          [50 + L.headRx * 0.46, L.cheekY - 2, 4.6, 4.6],
          [50 + L.headRx * 0.28, L.cheekY + 5, 3.6, 3.6],
        ];
  return (
    <g fill={shade}>
      {dots.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}
    </g>
  );
}

function Eye({ x, y, kind, ink, fur }: { x: number; y: number; kind: Look["eyes"]; ink: string; fur: string }) {
  const closed = kind === "arc" || (kind === "wink" && x < 50);
  if (closed) {
    return <path d={`M ${x - 5.5} ${y} q 5.5 -5.2 11 0`} stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
  if (kind === "sleepy") {
    return (
      <g>
        <circle cx={x} cy={y + 1.2} r="3.2" fill={ink} />
        <path d={`M ${x - 5} ${y - 0.4} h 10`} stroke={fur} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${x - 5.2} ${y - 0.6} q 5.2 -3.4 10.4 0`} stroke={ink} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  const r = kind === "spark" ? 5.2 : kind === "dot" ? 2.4 : 3.7;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={ink} />
      <circle cx={x + r * 0.28} cy={y - r * 0.32} r={Math.max(0.9, r * 0.26)} fill="#fff" />
      {kind === "spark" && <circle cx={x - r * 0.22} cy={y + r * 0.28} r="0.9" fill="#fff" opacity="0.85" />}
    </g>
  );
}

function Face({ look, L }: { look: Look; L: Layout }) {
  const { ink, nose, fur } = look;
  return (
    <g>
      <Eye x={50 - L.eyeDx} y={L.eyeY} kind={look.eyes} ink={ink} fur={fur} />
      <Eye x={50 + L.eyeDx} y={L.eyeY} kind={look.eyes === "wink" ? "bead" : look.eyes} ink={ink} fur={fur} />
      <ellipse cx="50" cy={L.noseY} rx="3" ry="2.3" fill={nose} />
      {look.mouth === "tiny" ? (
        <path d={`M 47 ${L.mouthY} q 3 2.2 6 0`} stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M 45.5 ${L.mouthY} q 4.5 3.2 4.5 0 q 0 3.2 4.5 0`} stroke={ink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      )}
      {look.mouth === "teeth" && (
        <g>
          <rect x="46.6" y={L.mouthY + 0.6} width="6.8" height="4.6" rx="1.1" fill="#fff" />
          <path d={`M 50 ${L.mouthY + 0.8} v 4`} stroke={ink} strokeWidth="0.7" opacity="0.35" />
        </g>
      )}
    </g>
  );
}

function Paws({ look, L }: { look: Look; L: Layout }) {
  const fill = look.belly;
  if (look.paws === "raised") {
    const px = 50 - L.headRx + 1;
    const py = L.cheekY - 1;
    return (
      <g>
        <path d={`M ${px + 3} ${py + 2} Q ${px + 12} ${py + 10} 46 ${L.pawY - 2}`} stroke={look.fur} strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse cx={px} cy={py} rx="6.4" ry="4.6" fill={fill} transform={`rotate(-28 ${px} ${py})`} />
        <ellipse cx="60" cy={L.pawY} rx="5.4" ry="3.8" fill={fill} />
      </g>
    );
  }
  if (look.paws === "spread") {
    return (
      <g>
        <ellipse cx={50 - L.bodyRx * 0.62} cy={L.pawY - 1} rx="5.6" ry="3.8" fill={fill} />
        <ellipse cx={50 + L.bodyRx * 0.62} cy={L.pawY - 1} rx="5.6" ry="3.8" fill={fill} />
      </g>
    );
  }
  if (look.paws === "tucked") {
    return (
      <g>
        <ellipse cx="45" cy={L.pawY + 2} rx="4.2" ry="2.8" fill={fill} />
        <ellipse cx="55" cy={L.pawY + 2} rx="4.2" ry="2.8" fill={fill} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="42" cy={L.pawY} rx="5.6" ry="3.8" fill={fill} />
      <ellipse cx="58" cy={L.pawY} rx="5.6" ry="3.8" fill={fill} />
    </g>
  );
}

function Accessory({ look, L }: { look: Look; L: Layout }) {
  const { accent, accent2, accessory } = look;
  const pin = { x: Math.min(80, 50 + L.earSpread + 10), y: Math.max(16, L.earY - 14) };
  switch (accessory) {
    case "none":
      return null;
    case "rice":
      return (
        <g fill={accent} stroke={accent2} strokeWidth="0.9">
          <rect x="8" y="20" width="11" height="5" rx="2.5" transform="rotate(-24 13 22)" />
          <rect x="10" y="28" width="11" height="5" rx="2.5" transform="rotate(12 15 30)" />
          <rect x="7" y="35" width="10" height="4.6" rx="2.3" transform="rotate(-8 12 37)" />
        </g>
      );
    case "peanut":
      return (
        <g transform={`translate(${pin.x} ${pin.y}) rotate(28)`} stroke={accent2} strokeWidth="1">
          <ellipse cy="-4.2" rx="4.6" ry="5.4" fill={accent} />
          <ellipse cy="4.4" rx="4.2" ry="5" fill={accent} />
          <path d="M -2.4 0 h 4.8" fill="none" />
        </g>
      );
    case "sesame":
      return (
        <g fill={accent}>
          <circle cx="40" cy={L.headCy - L.headRy * 0.62} r="3.3" />
          <circle cx="50" cy={L.headCy - L.headRy * 0.82} r="3" />
          <circle cx="59" cy={L.headCy - L.headRy * 0.58} r="3.2" />
        </g>
      );
    case "seed":
      return <ellipse cx="50" cy={L.headCy - L.headRy * 0.78} rx="4.6" ry="3.3" fill={accent} />;
    case "milk":
      return (
        <g transform="translate(76 18)">
          <path d="M0 -5 C 5.2 -1 5 7 0 8 C -5 7 -5.2 -1 0 -5" fill={accent} stroke={accent2} strokeWidth="0.9" />
          <ellipse cx="-1.6" cy="-0.4" rx="1.4" ry="2" fill="#fff" />
        </g>
      );
    case "cream":
      return (
        <g>
          <ellipse cx="50" cy={L.earY + 1} rx="8" ry="4.2" fill={accent2} />
          <circle cx="45.5" cy={L.earY - 2} r="4.8" fill={accent} />
          <circle cx="54.5" cy={L.earY - 1.5} r="4.3" fill={accent} />
          <circle cx="50" cy={L.earY - 6.5} r="3.5" fill="#fff" />
        </g>
      );
    case "bean":
      return (
        <g transform={`translate(${pin.x} ${pin.y}) rotate(-24)`}>
          <ellipse rx="6.5" ry="4.4" fill={accent} />
          <ellipse cx="-1.4" cy="-0.8" rx="2" ry="1.3" fill={accent2} opacity="0.85" />
        </g>
      );
    case "ribbon":
      return (
        <g>
          <path d={`M ${50 - L.bodyRx * 0.78} ${L.mouthY + 10} Q 50 ${L.mouthY + 16} ${50 + L.bodyRx * 0.78} ${L.mouthY + 9}`} stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx={50 + L.bodyRx * 0.55} cy={L.mouthY + 12} r="2.5" fill={accent2} />
        </g>
      );
    case "moon":
      return (
        <path
          d="M16 22 A 8 8 0 1 1 28 12"
          fill="none"
          stroke={accent}
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      );
    case "peach":
      return (
        <g>
          <circle cx={pin.x} cy={pin.y + 2} r="7.2" fill={accent} />
          <path d={`M ${pin.x} ${pin.y - 5} v 7`} stroke={accent2} strokeWidth="1.1" />
          <path d={`M ${pin.x - 1} ${pin.y - 5} q 6 -6 9 0 q -5 1.4 -8 0`} fill={accent2} />
        </g>
      );
    case "swirl":
      return (
        <g>
          <circle cx={pin.x - 4} cy={pin.y + 3} r="4.4" fill={accent} />
          <circle cx={pin.x + 4} cy={pin.y + 2} r="3.8" fill={accent2} />
          <circle cx={pin.x} cy={pin.y - 3} r="3.5" fill={accent} />
        </g>
      );
    case "leaf":
      return (
        <g>
          <path d={`M ${pin.x - 8} ${pin.y + 7} Q ${pin.x} ${pin.y - 12} ${pin.x + 9} ${pin.y - 4} Q ${pin.x + 1} ${pin.y + 8} ${pin.x - 8} ${pin.y + 7}`} fill={accent} />
          <path d={`M ${pin.x - 5} ${pin.y + 5} Q ${pin.x} ${pin.y - 1} ${pin.x + 6} ${pin.y - 3}`} stroke={accent2} strokeWidth="1.2" fill="none" />
        </g>
      );
    case "berry":
      return (
        <g transform={`translate(${pin.x} ${pin.y})`}>
          <path d="M0 -1 q 7 1 6 9 q -1 7 -6 7 q -5 0 -6 -7 q -1 -8 6 -9z" fill={accent} />
          <path d="M -4 -2 q 4 -6 8 0 q -3 -2 -4 0 q -1 -2 -4 0z" fill={accent2} />
          <g fill="#fff" opacity="0.75">
            <circle cx="-1.5" cy="4" r="0.8" />
            <circle cx="2" cy="6.5" r="0.8" />
            <circle cx="0" cy="9" r="0.7" />
          </g>
        </g>
      );
    case "cheese":
      return (
        <g>
          <path d={`M ${pin.x - 9} ${pin.y + 7} L ${pin.x} ${pin.y - 10} L ${pin.x + 9} ${pin.y + 7} Z`} fill={accent} />
          <circle cx={pin.x - 1} cy={pin.y + 1} r="1.6" fill={accent2} />
          <circle cx={pin.x + 3.2} cy={pin.y + 3.4} r="1.15" fill={accent2} />
        </g>
      );
    case "drip":
      return (
        <path
          d={`M ${50 + L.headRx * 0.78} ${L.eyeY + 2} c 5 1 6 9 2 15 c -1.6 2.6 -4.4 2 -4.6 -1 c .6 -5 .2 -9 2.6 -14 z`}
          fill={accent}
        />
      );
    case "flakes":
      return (
        <g fill={accent} stroke={accent2} strokeWidth="0.9">
          <rect x="64" y="14" width="11" height="4.4" rx="2.2" transform="rotate(-48 69 16)" />
          <rect x="74" y="22" width="10" height="4.2" rx="2.1" transform="rotate(18 79 24)" />
          <rect x="68" y="30" width="10" height="4" rx="2" transform="rotate(42 73 32)" />
        </g>
      );
    case "boba":
      return (
        <g transform={`translate(${pin.x} ${pin.y})`}>
          <circle r="7.4" fill={accent2} />
          <circle r="5.3" fill={accent} />
          <circle cx="-1.8" cy="-2" r="1.7" fill="#fff" opacity="0.75" />
        </g>
      );
    case "almond":
      return (
        <path
          d={`M ${pin.x} ${pin.y - 9} C ${pin.x + 7} ${pin.y - 2} ${pin.x + 5.5} ${pin.y + 9} ${pin.x} ${pin.y + 9} C ${pin.x - 5.5} ${pin.y + 9} ${pin.x - 7} ${pin.y - 2} ${pin.x} ${pin.y - 9}`}
          fill={accent}
          stroke={accent2}
          strokeWidth="1"
        />
      );
    case "coffee":
      return (
        <g transform={`translate(${pin.x} ${pin.y}) rotate(-32)`}>
          <ellipse rx="7" ry="4.6" fill={accent} stroke={accent2} strokeWidth="1.3" />
          <path d="M 0 -3.2 v 6.4" stroke={accent2} strokeWidth="1.2" />
        </g>
      );
    case "fluff":
      return (
        <g>
          <circle cx={pin.x - 5.5} cy={pin.y + 2} r="5.6" fill={accent} />
          <circle cx={pin.x + 4.5} cy={pin.y + 1.5} r="5" fill={accent2} />
          <circle cx={pin.x - 0.5} cy={pin.y - 4} r="4.4" fill="#fff" />
        </g>
      );
    case "bow":
      return (
        <g fill={accent} transform={`translate(${pin.x} ${pin.y})`}>
          <path d="M0 1 L 13 -7 V 8 Z" />
          <path d="M0 1 L -13 -7 V 8 Z" />
          <circle r="2.8" fill={accent2} />
        </g>
      );
    case "star":
      return <path d={`M ${pin.x} ${pin.y - 9} l 2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8 z`} fill={accent} />;
    case "scarf":
      return (
        <g>
          <path d={`M 26 ${L.mouthY + 12} q 24 9 48 0 v 6 q -24 9 -48 0 z`} fill={accent} />
          <path d={`M 68 ${L.mouthY + 16} v 10 q -2 2 -4.5 0 v -8 z`} fill={accent2} />
        </g>
      );
    case "flower":
      return (
        <g transform={`translate(${pin.x} ${pin.y})`} fill={accent}>
          <circle cy="-5.2" r="3.1" />
          <circle cx="4.8" cy="-1.6" r="3.1" />
          <circle cx="3" cy="4.2" r="3.1" />
          <circle cx="-3" cy="4.2" r="3.1" />
          <circle cx="-4.8" cy="-1.6" r="3.1" />
          <circle r="2.5" fill={accent2} />
        </g>
      );
    case "bell":
      return (
        <g transform={`translate(${pin.x} ${pin.y})`}>
          <path d="M -6 -2 h 12 l -1.4 8 a 5.5 5.5 0 0 1 -9.2 0 z" fill={accent} />
          <rect x="-1.3" y="-5.2" width="2.6" height="3.4" rx="0.7" fill={accent2} />
          <circle cy="7.2" r="2.1" fill={accent2} />
        </g>
      );
    case "glasses":
      return (
        <g fill="none" stroke={accent} strokeWidth="2.3" strokeLinecap="round">
          <circle cx={50 - L.eyeDx} cy={L.eyeY} r="7.4" />
          <circle cx={50 + L.eyeDx} cy={L.eyeY} r="7.4" />
          <path d={`M ${50 - L.eyeDx + 7.4} ${L.eyeY} H ${50 + L.eyeDx - 7.4}`} />
        </g>
      );
    case "heart":
      return (
        <path
          d={`M ${pin.x} ${pin.y + 6} C ${pin.x - 8} ${pin.y + 1} ${pin.x - 8} ${pin.y - 7} ${pin.x} ${pin.y - 2} C ${pin.x + 8} ${pin.y - 7} ${pin.x + 8} ${pin.y + 1} ${pin.x} ${pin.y + 6} Z`}
          fill={accent}
        />
      );
    default: {
      const never: never = accessory;
      return never;
    }
  }
}

export function HamsterArt({ id, title, size = 96 }: Props) {
  const look = lookFor(id);
  const L = layout(look.cheeks);
  const rot = look.pose === "leanL" ? "rotate(-11 50 92)"
    : look.pose === "leanR" ? "rotate(11 50 92)"
      : look.pose === "tiltL" ? `rotate(-15 50 ${L.headCy})`
        : look.pose === "tiltR" ? `rotate(15 50 ${L.headCy})`
          : "";
  const sit = look.sit === "high" ? -4 : look.sit === "low" ? 3 : 0;
  const cheekX = 50 - L.headRx + L.cheekRx * 0.15;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <Backdrop look={look} />
      <g transform={`translate(0 ${sit}) ${rot}`}>
        <ellipse cx="50" cy={L.bodyCy + 6} rx={L.bodyRx * 0.72} ry="6" fill={look.ink} opacity="0.12" />
        <Ear x={50 - L.earSpread} y={L.earY} side="l" look={look} L={L} layer="back" />
        <Ear x={50 + L.earSpread} y={L.earY} side="r" look={look} L={L} layer="back" />
        {look.cheeks !== "small" && (
          <g fill={look.fur}>
            <circle cx={50 - L.headRx * 0.78} cy={L.cheekY} r={look.cheeks === "huge" ? 9 : 6.2} />
            <circle cx={50 + L.headRx * 0.78} cy={L.cheekY} r={look.cheeks === "huge" ? 9 : 6.2} />
          </g>
        )}
        <ellipse cx="50" cy={L.bodyCy} rx={L.bodyRx} ry={L.bodyRy} fill={look.fur} />
        <ellipse cx="50" cy={L.headCy} rx={L.headRx} ry={L.headRy} fill={look.fur} />
        <Markings look={look} L={L} />
        <ellipse
          cx="50"
          cy={L.noseY + 7}
          rx={look.bellyShape === "wide" ? L.headRx * 0.7 : look.bellyShape === "small" ? L.headRx * 0.4 : L.headRx * 0.55}
          ry={look.bellyShape === "wide" ? L.headRy * 0.4 : look.bellyShape === "small" ? L.headRy * 0.34 : L.headRy * 0.48}
          fill={look.belly}
        />
        <Ear x={50 - L.earSpread} y={L.earY} side="l" look={look} L={L} layer="front" />
        <Ear x={50 + L.earSpread} y={L.earY} side="r" look={look} L={L} layer="front" />
        <g fill={look.blush} opacity={look.blushOpacity}>
          <ellipse cx={cheekX} cy={L.cheekY} rx={L.cheekRx} ry={L.cheekRy} />
          <ellipse cx={100 - cheekX} cy={L.cheekY} rx={L.cheekRx} ry={L.cheekRy} />
        </g>
        <g stroke={look.ink} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" fill="none">
          <path d={`M ${50 - L.headRx + 2} ${L.cheekY - 3} h -11`} />
          <path d={`M ${50 - L.headRx + 3} ${L.cheekY + 2} h -10`} />
          <path d={`M ${50 + L.headRx - 2} ${L.cheekY - 3} h 11`} />
          <path d={`M ${50 + L.headRx - 3} ${L.cheekY + 2} h 10`} />
        </g>
        <Face look={look} L={L} />
        <Paws look={look} L={L} />
        <Accessory look={look} L={L} />
      </g>
    </svg>
  );
}
