import { BERTH, SLIP, WORLD, hullHeading, type Sim } from './sim';

const PILINGS_Y = [5.5, 8.5, 11.5, 14.5, 17.5, 20.5, 23];

/** Top-down view of the slip and boat. Colours come from CSS classes so each variant can restyle it. */
export function DockScene({
  sim,
  trail,
  dwellRatio,
}: {
  sim: Sim;
  trail: readonly { x: number; y: number }[];
  dwellRatio: number;
}) {
  const mid = (BERTH.yMin + BERTH.yMax) / 2;
  return (
    <svg
      className="arc-dock"
      viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
      role="img"
      aria-label="Top-down view of a boat and a slip with pilings on both sides. The slip is at the top."
    >
      <rect className="arc-water" width={WORLD.w} height={WORLD.h} />
      {[20, 40, 60].map((g) => (
        <g key={g} className="arc-grid">
          <line x1={g} y1="0" x2={g} y2={WORLD.h} />
          <line x1="0" y1={g + 10} x2={WORLD.w} y2={g + 10} />
        </g>
      ))}
      <rect className="arc-quay" x="0" y="0" width={SLIP.left} height={SLIP.mouth} />
      <rect className="arc-quay" x={SLIP.right} y="0" width={WORLD.w - SLIP.right} height={SLIP.mouth} />
      <rect className="arc-quay" x={SLIP.left} y="0" width={SLIP.right - SLIP.left} height={SLIP.back} />
      {PILINGS_Y.map((y) => (
        <g key={y}>
          <circle className="arc-piling" cx={SLIP.left} cy={y} r="1" />
          <circle className="arc-piling" cx={SLIP.right} cy={y} r="1" />
        </g>
      ))}
      <g transform={`translate(${SLIP.cx} ${mid})`} data-ready={dwellRatio > 0 ? 'yes' : 'no'}>
        <path
          className="arc-berth"
          d="M0 -5.8 L1.8 -3 L1.8 5 L-1.8 5 L-1.8 -3 Z"
        />
      </g>
      <g className="arc-wind" aria-hidden>
        <path d="M5 54 H19 M15 51 L19 54 L15 57" />
        <path d="M5 66 H15 M11 63 L15 66 L11 69" />
      </g>
      {trail.length > 1 && (
        <polyline className="arc-trail" points={trail.map((p) => `${p.x},${p.y}`).join(' ')} />
      )}
      {sim.contact > 0 && sim.contactAt && (
        <circle className="arc-hit" cx={sim.contactAt.x} cy={sim.contactAt.y} r="3" />
      )}
      <g transform={`translate(${sim.x} ${sim.y}) rotate(${hullHeading(sim.h)})`}>
        <path className="arc-hull" d="M0 -5.8 L1.8 -3 L1.8 5 L-1.8 5 L-1.8 -3 Z" />
        <rect className="arc-cabin" x="-1.1" y="-0.6" width="2.2" height="3" rx="0.4" />
        <circle cx="-1.8" cy="-2.6" r="0.6" fill="#ff3b3b" />
        <circle cx="1.8" cy="-2.6" r="0.6" fill="#3dff7a" />
      </g>
    </svg>
  );
}
