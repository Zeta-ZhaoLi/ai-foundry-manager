import React from 'react';
import clsx from 'clsx';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  segments?: { value: number; color: string; label?: string }[];
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  height?: number;
  showValue?: boolean;
  horizontal?: boolean;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 16,
  showValue = true,
  horizontal = true,
  title,
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div className="flex flex-col gap-2">
        {title && <div className="text-xs text-muted-foreground mb-1">{title}</div>}
        {data.map((item, idx) => {
          const pct = (item.value / max) * 100;

          return (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-24 text-xs text-muted-foreground truncate" title={item.label}>
                {item.label}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-full bg-gray-800 overflow-hidden"
                  style={{ height }}
                >
                  {item.segments ? (
                    // Stacked bar
                    <div className="flex h-full">
                      {item.segments.map((seg, segIdx) => {
                        const segPct = (seg.value / max) * 100;
                        return (
                          <div
                            key={segIdx}
                            className="h-full transition-all"
                            style={{
                              width: `${segPct}%`,
                              backgroundColor: seg.color,
                            }}
                            title={seg.label ? `${seg.label}: ${seg.value}` : String(seg.value)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    // Single bar
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        !item.color && 'bg-gradient-to-r from-cyan-500 to-green-500'
                      )}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                </div>
              </div>
              {showValue && (
                <div className="w-10 text-xs text-foreground text-right">
                  {item.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className="flex flex-col">
      {title && <div className="text-xs text-muted-foreground mb-2">{title}</div>}
      <div className="flex items-end gap-2 h-32">
        {data.map((item, idx) => {
          const pct = (item.value / max) * 100;

          return (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex justify-center">
                <div
                  className="w-6 rounded-t bg-gray-800 overflow-hidden relative"
                  style={{ height: '100px' }}
                >
                  {item.segments ? (
                    // Stacked vertical bar
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
                      {item.segments.map((seg, segIdx) => {
                        const segPct = (seg.value / max) * 100;
                        return (
                          <div
                            key={segIdx}
                            className="w-full transition-all"
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: seg.color,
                            }}
                            title={seg.label ? `${seg.label}: ${seg.value}` : String(seg.value)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'absolute bottom-0 left-0 right-0 rounded-t transition-all',
                        !item.color && 'bg-gradient-to-t from-cyan-500 to-green-500'
                      )}
                      style={{
                        height: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                </div>
              </div>
              {showValue && (
                <div className="text-xs text-foreground">{item.value}</div>
              )}
              <div className="text-xs text-muted-foreground truncate max-w-full" title={item.label}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

BarChart.displayName = 'BarChart';
