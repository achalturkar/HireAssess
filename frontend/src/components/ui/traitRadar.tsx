import type { TraitReportEntry } from "@/src/lib/typess";

/**
 * The "readiness fingerprint" — the one signature visual reused across
 * the admin detail page and the candidate report. Each trait is a spoke;
 * distance from center is the score (0-100); the dot at each vertex is
 * colored by that trait's band, so the shape reads at a glance as
 * "mostly pine (ready), a couple of amber spokes to grow."
 */
export function TraitRadar({ traits, size = 320 }: { traits: TraitReportEntry[]; size?: number }) {
  const n = traits.length;
  if (n === 0) return null;

  const center = size / 2;
  const radius = size * 0.36;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointFor = (i: number, value: number) => {
    const r = (value / 100) * radius;
    const angle = angleFor(i);
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)] as const;
  };

  const polygonPoints = traits.map((t, i) => pointFor(i, t.score).join(",")).join(" ");
  const ringLevels = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Trait score fingerprint"
    >
      {/* background rings */}
      {ringLevels.map((level) => (
        <polygon
          key={level}
          points={traits
            .map((_, i) => pointFor(i, level).join(","))
            .join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}

      {/* spokes */}
      {traits.map((_, i) => {
        const [x, y] = pointFor(i, 100);
        return (
          <line
            key={`spoke-${i}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth={1}
          />
        );
      })}

      {/* score polygon */}
      <polygon
        points={polygonPoints}
        fill="var(--pine)"
        fillOpacity={0.16}
        stroke="var(--pine)"
        strokeWidth={2}
      />

      {/* vertex dots, colored by band */}
      {traits.map((t, i) => {
        const [x, y] = pointFor(i, t.score);
        const color =
          t.band === "High" ? "var(--band-high)" : t.band === "Moderate" ? "var(--band-moderate)" : "var(--band-low)";
        return <circle key={t.trait} cx={x} cy={y} r={4} fill={color} stroke="var(--paper-raised)" strokeWidth={1.5} />;
      })}

      {/* labels */}
      {traits.map((t, i) => {
        const [x, y] = pointFor(i, 118);
        const anchor = Math.abs(Math.cos(angleFor(i))) < 0.2 ? "middle" : Math.cos(angleFor(i)) > 0 ? "start" : "end";
        return (
          <text
            key={`label-${t.trait}`}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-ink-muted font-body"
            fontSize={10}
          >
            {t.trait}
          </text>
        );
      })}
    </svg>
  );
}