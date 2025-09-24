import { useMemo } from 'react';

export function Gauge({ value, size = 180, stroke = 14 }: { value: number; size?: number; stroke?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = useMemo(() => circumference - (clamped / 100) * circumference, [clamped, circumference]);
  const center = size / 2;

  const color = clamped < 40 ? '#10b981' : clamped < 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fontWeight={700} fill={color}>
        {clamped}%
      </text>
      <text x="50%" y={center + 28} dominantBaseline="hanging" textAnchor="middle" fontSize="12" fill="#475569">
        AI Probability
      </text>
    </svg>
  );
}

