export interface Light {
  readonly x: number;
  readonly y: number;
  readonly color: 'white' | 'red' | 'green';
  readonly r: number;
}

const FILL = { white: '#fffbe8', red: '#ff3b3b', green: '#3dff7a' } as const;
const GLOW = { white: '#fff3b0', red: '#ff2a2a', green: '#2dff6e' } as const;

/** A night scene that shows only a vessel's lights. Red and green are used because they are navigation lights. */
export function LightsScene({ lights, label }: { lights: readonly Light[]; label: string }) {
  return (
    <svg
      className="arc-lights"
      viewBox="0 0 320 200"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="arc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02040a" />
          <stop offset="1" stopColor="#0b1830" />
        </linearGradient>
        <linearGradient id="arc-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07101f" />
          <stop offset="1" stopColor="#020509" />
        </linearGradient>
        <filter id="arc-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="320" height="200" fill="url(#arc-sky)" />
      {[
        [30, 20],
        [90, 44],
        [150, 14],
        [210, 36],
        [270, 18],
        [300, 50],
        [60, 70],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#9fb4d6" opacity="0.7" />
      ))}
      <rect y="124" width="320" height="76" fill="url(#arc-sea)" />
      <line x1="0" y1="124" x2="320" y2="124" stroke="#1c2e4d" strokeWidth="1" />
      {lights.map((l) => (
        <g key={`${l.x}-${l.y}`}>
          <ellipse
            cx={l.x}
            cy={124 + (124 - l.y) * 0.5}
            rx="3"
            ry={Math.max(8, 130 - l.y)}
            fill={GLOW[l.color]}
            opacity="0.14"
          />
          <circle cx={l.x} cy={l.y} r={l.r * 2.6} fill={GLOW[l.color]} opacity="0.55" filter="url(#arc-glow)" />
          <circle cx={l.x} cy={l.y} r={l.r} fill={FILL[l.color]} />
        </g>
      ))}
      <path d="M150 196 L160 168 L170 196 Z" fill="#14233c" />
    </svg>
  );
}
