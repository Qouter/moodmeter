export interface LinePoint {
  date: Date;
  label: string;
  pleasantness: number;
  energy: number;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
}

export function LineChart({ data, height = 220 }: LineChartProps) {
  const W = 720,
    H = height,
    P = { l: 32, r: 18, t: 14, b: 24 };
  const innerW = W - P.l - P.r,
    innerH = H - P.t - P.b;
  if (!data.length) return null;

  const xs = data.map((_, i) => P.l + (i / Math.max(1, data.length - 1)) * innerW);
  const yScale = (v: number) => {
    const t = (v + 5) / 10;
    return P.t + innerH - t * innerH;
  };

  const linePath = (key: 'pleasantness' | 'energy') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${yScale(d[key]).toFixed(1)}`).join(' ');
  const areaPath = (key: 'pleasantness' | 'energy') =>
    `${linePath(key)} L ${xs[xs.length - 1]} ${yScale(-5)} L ${xs[0]} ${yScale(-5)} Z`;

  const tickIdx =
    data.length <= 6
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lc-pleasant" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5cb872" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5cb872" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-energy" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e85a4f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e85a4f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[-5, -2.5, 0, 2.5, 5].map((v) => (
        <g key={v}>
          <line
            x1={P.l}
            x2={W - P.r}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="rgba(40,55,90,.08)"
            strokeWidth={v === 0 ? 1.2 : 0.8}
            strokeDasharray={v === 0 ? '0' : '3 4'}
          />
          <text x={P.l - 6} y={yScale(v) + 3} fontSize="10" textAnchor="end" fill="var(--ink-mute)" fontFamily="JetBrains Mono">
            {v > 0 ? `+${v}` : v}
          </text>
        </g>
      ))}

      <path d={areaPath('energy')} fill="url(#lc-energy)" />
      <path d={linePath('energy')} fill="none" stroke="#e85a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      <path d={areaPath('pleasantness')} fill="url(#lc-pleasant)" />
      <path d={linePath('pleasantness')} fill="none" stroke="#2e8b48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx={xs[xs.length - 1]} cy={yScale(data[data.length - 1].pleasantness)} r="4.5" fill="#2e8b48" stroke="#fff" strokeWidth="2" />
      <circle cx={xs[xs.length - 1]} cy={yScale(data[data.length - 1].energy)} r="4.5" fill="#e85a4f" stroke="#fff" strokeWidth="2" />

      {tickIdx.map((i) => (
        <text key={i} x={xs[i]} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--ink-mute)" fontFamily="JetBrains Mono">
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}
