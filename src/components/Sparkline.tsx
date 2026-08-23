"use client";

export function Sparkline({ values, height = 54 }: { values: number[]; height?: number }) {
  if (values.length < 2) return <div className="sparkline-empty">Not enough data</div>;
  const width = 180;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const points = values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * (width - pad * 2);
      const y = pad + ((max - value) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trend from ${values[0]} to ${values[values.length - 1]}`}>
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      <circle cx={points.split(" ")[0].split(",")[0]} cy={points.split(" ")[0].split(",")[1]} r="3" />
      <circle cx={points.split(" ").at(-1)?.split(",")[0]} cy={points.split(" ").at(-1)?.split(",")[1]} r="3.5" />
    </svg>
  );
}
