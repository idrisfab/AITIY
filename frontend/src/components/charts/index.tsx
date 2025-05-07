'use client';

import React from 'react';

interface ChartProps {
  data: Array<Record<string, any>>;
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

// Simple Line Chart component
export function LineChart({
  data,
  categories,
  index,
  colors = ['#3b82f6', '#10b981', '#8b5cf6'],
  valueFormatter = (value) => `${value}`,
}: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  // Find the max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((item) => categories.map((cat) => item[cat] || 0))
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-end">
        <div className="w-12 h-full flex flex-col justify-between pr-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="text-xs text-gray-500">
              {valueFormatter(Math.round((maxValue * (4 - i)) / 4))}
            </div>
          ))}
        </div>
        <div className="flex-1 h-full relative">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute w-full border-t border-gray-200 dark:border-gray-800"
              style={{ bottom: `${(i * 100) / 4}%` }}
            />
          ))}

          {/* Lines */}
          <div className="absolute inset-0 flex">
            {categories.map((category, catIndex) => (
              <svg
                key={category}
                className="w-full h-full"
                viewBox={`0 0 ${data.length - 1} 100`}
                preserveAspectRatio="none"
              >
                <path
                  d={data
                    .map((item, i) => {
                      const x = i;
                      const y = 100 - ((item[category] || 0) / maxValue) * 100;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={colors[catIndex % colors.length]}
                  strokeWidth="2"
                />
              </svg>
            ))}
          </div>

          {/* Data points */}
          <div className="absolute inset-0 flex justify-between">
            {data.map((item, i) => (
              <div key={i} className="h-full flex flex-col justify-end items-center">
                {categories.map((category, catIndex) => (
                  <div
                    key={`${i}-${category}`}
                    className="w-2 h-2 rounded-full mb-1"
                    style={{
                      backgroundColor: colors[catIndex % colors.length],
                      marginBottom: `${((item[category] || 0) / maxValue) * 100}%`,
                    }}
                    title={`${category}: ${valueFormatter(item[category] || 0)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="h-6 flex justify-between mt-2">
        {data.map((item, i) => (
          <div key={i} className="text-xs text-gray-500 text-center">
            {item[index].toString().substring(0, 5)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        {categories.map((category, i) => (
          <div key={category} className="flex items-center">
            <div
              className="w-3 h-3 mr-1 rounded-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Bar Chart component
export function BarChart({
  data,
  categories,
  index,
  colors = ['#3b82f6', '#10b981', '#8b5cf6'],
  valueFormatter = (value) => `${value}`,
}: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  // Find the max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((item) => categories.map((cat) => item[cat] || 0))
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-end">
        <div className="w-12 h-full flex flex-col justify-between pr-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="text-xs text-gray-500">
              {valueFormatter(Math.round((maxValue * (4 - i)) / 4))}
            </div>
          ))}
        </div>
        <div className="flex-1 h-full relative">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute w-full border-t border-gray-200 dark:border-gray-800"
              style={{ bottom: `${(i * 100) / 4}%` }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex justify-around">
            {data.map((item, i) => (
              <div key={i} className="h-full flex items-end justify-center gap-1">
                {categories.map((category, catIndex) => {
                  const height = ((item[category] || 0) / maxValue) * 100;
                  return (
                    <div
                      key={`${i}-${category}`}
                      className="w-4 rounded-t-sm"
                      style={{
                        height: `${height}%`,
                        backgroundColor: colors[catIndex % colors.length],
                      }}
                      title={`${category}: ${valueFormatter(item[category] || 0)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="h-6 flex justify-around mt-2">
        {data.map((item, i) => (
          <div key={i} className="text-xs text-gray-500 text-center">
            {item[index].toString().substring(0, 5)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        {categories.map((category, i) => (
          <div key={category} className="flex items-center">
            <div
              className="w-3 h-3 mr-1 rounded-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Pie Chart component
export function PieChart({
  data,
  categories,
  index,
  colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
  valueFormatter = (value) => `${value}`,
}: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  // For pie chart, we'll use the first data item
  const item = data[0];
  const total = categories.reduce((sum, cat) => sum + (item[cat] || 0), 0);

  // Calculate segments
  let startAngle = 0;
  const segments = categories.map((category, i) => {
    const value = item[category] || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    
    const segment = {
      category,
      value,
      percentage,
      startAngle,
      endAngle: startAngle + angle,
      color: colors[i % colors.length],
    };
    
    startAngle += angle;
    return segment;
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, i) => {
            // Skip segments that are too small to render
            if (segment.percentage < 1) return null;
            
            const startX = 50 + 40 * Math.cos((segment.startAngle - 90) * (Math.PI / 180));
            const startY = 50 + 40 * Math.sin((segment.startAngle - 90) * (Math.PI / 180));
            const endX = 50 + 40 * Math.cos((segment.endAngle - 90) * (Math.PI / 180));
            const endY = 50 + 40 * Math.sin((segment.endAngle - 90) * (Math.PI / 180));
            
            // Determine if the arc should be drawn as a large arc (> 180 degrees)
            const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
            
            return (
              <path
                key={i}
                d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                fill={segment.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {segments.map((segment) => (
          <div key={segment.category} className="flex items-center">
            <div
              className="w-3 h-3 mr-1 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {segment.category}: {valueFormatter(segment.value)} ({segment.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
