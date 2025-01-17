'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getMarketStatus } from '@/app/components/MarketStatus';
import type { HistoricalDataPoint } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface IndexHistoryProps {
  data: Pick<HistoricalDataPoint, 'score' | 'timestamp'>[];
}

interface ChartContext {
  p0: { parsed: { y: number } } | undefined;
  p1: { parsed: { y: number } } | undefined;
}

interface ChartPoint {
  parsed: { y: number } | undefined;
}

interface TooltipItem {
  parsed: {
    y: number;
  };
}

interface TooltipContext {
  tooltip: {
    dataPoints: Array<TooltipItem>;
  };
}

function parseDate(dateStr: string) {
  if (!dateStr) {
    console.warn('Invalid date string:', dateStr);
    return new Date();
  }

  try {
    // First try direct ISO string parsing
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      return new Date(dateStr);
    }

    // Then try DD/MM/YYYY, HH:mm:ss UTC format
    if (dateStr.includes(',')) {
      const [datePart, timePart] = dateStr.split(', ');
      if (!datePart || !timePart) {
        console.warn('Invalid date format:', dateStr);
        return new Date(dateStr);
      }
      const [day, month, year] = datePart.split('/');
      const [time] = timePart.split(' '); // Remove UTC
      return new Date(`${year}-${month}-${day} ${time}`);
    }

    // Fallback to direct parsing
    return new Date(dateStr);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

function getColorForScore(score: number): string {
  if (score < 20) return '#EF4444';  // red-500
  if (score < 40) return '#F97316';  // orange-500
  if (score < 60) return '#EAB308';  // yellow-500
  if (score < 80) return '#22C55E';  // green-500
  return '#10B981';                  // emerald-500
}

export function IndexHistory({ data }: IndexHistoryProps) {
  console.log('IndexHistory received data:', data);
  
  if (!Array.isArray(data)) {
    console.error('Data is not an array:', data);
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-gray-500">
        <div>No historical data available</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        No historical data available
      </div>
    );
  }

  const validData = data.filter(point => {
    const isValid = point && 
                   typeof point.timestamp === 'string' && 
                   typeof point.score === 'number' &&
                   !isNaN(point.score);
    if (!isValid) {
      console.warn('Invalid data point:', point);
    }
    return isValid;
  });

  const chartData = {
    datasets: [
      {
        label: 'Index Value',
        data: validData.map(point => ({
          x: parseDate(point.timestamp),
          y: point.score
        })),
        segment: {
          borderColor: (ctx: ChartContext) => {
            if (!ctx.p0?.parsed || !ctx.p1?.parsed) return '#EAB308';
            const score = (ctx.p0.parsed.y + ctx.p1.parsed.y) / 2;
            return getColorForScore(score);
          }
        },
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: (ctx: ChartPoint) => {
          if (!ctx.parsed) return '#EAB308';
          return getColorForScore(ctx.parsed.y);
        },
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'dd/MM',
          },
          tooltipFormat: 'dd/MM/yyyy HH:mm',
        },
        grid: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem) => {
            const score = context.parsed.y;
            const status = getMarketStatus(score);
            return [`Index: ${score}`, `Status: ${status}`];
          },
        },
        titleColor: (context: TooltipContext) => {
          const score = context.tooltip.dataPoints[0].parsed.y;
          return getColorForScore(score);
        },
        bodyColor: (context: TooltipContext) => {
          const score = context.tooltip.dataPoints[0].parsed.y;
          return getColorForScore(score);
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.3,
      },
    },
  };

  return (
    <div className="w-full">
      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 