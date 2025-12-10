import React from 'react';
import { useTranslation } from 'react-i18next';

export interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  title?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 120,
  strokeWidth = 24,
  title,
}) => {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        {title && <div className="text-xs text-muted-foreground mb-2">{title}</div>}
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-xs text-muted-foreground">{t('common.noData')}</span>
        </div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke segments
  let cumulativeOffset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -cumulativeOffset * circumference;
    cumulativeOffset += pct;
    return {
      ...d,
      pct,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="flex flex-col items-center">
      {title && <div className="text-xs text-muted-foreground mb-2">{title}</div>}
      <div className="flex items-center gap-4">
        {/* SVG Donut */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1f2937"
            strokeWidth={strokeWidth}
          />
          {/* Data segments */}
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ))}
          {/* Center text */}
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-lg font-semibold"
          >
            {total}
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-1.5">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="text-foreground font-medium">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

DonutChart.displayName = 'DonutChart';
