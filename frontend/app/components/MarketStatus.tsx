'use client';

import { useEffect, useState } from 'react';

interface IndexData {
  score: number;
  label: string;
  components: {
    market: number;
    sentiment: number;
    onChain: number;
  };
  lastUpdated: string;
}

export function getMarketStatus(score: number): string {
  if (score < 20) {
    return 'IT\'S SO OVER';
  } else if (score < 40) {
    return 'IT IS WHAT IT IS';
  } else if (score < 60) {
    return 'WE VIBING';
  } else if (score < 80) {
    return 'WE\'RE SO BACK';
  } else {
    return 'LET\'S FKN GOOO!';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'IT\'S SO OVER':
      return 'text-[#EF4444]';
    case 'IT IS WHAT IT IS':
      return 'text-[#F97316]';
    case 'WE VIBING':
      return 'text-[#EAB308]';
    case 'WE\'RE SO BACK':
      return 'text-[#22C55E]';
    case 'LET\'S FKN GOOO!':
      return 'text-[#10B981]';
    default:
      return 'text-gray-500';
  }
}

function getLEDColorForIndex(index: number): string {
  if (index < 20) return 'bg-[#EF4444]';
  if (index < 40) return 'bg-[#F97316]';
  if (index < 60) return 'bg-[#EAB308]';
  if (index < 80) return 'bg-[#22C55E]';
  return 'bg-[#10B981]';
}

export default function MarketStatus() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(50);

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const response = await fetch('/api/proxy', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: IndexData = await response.json();
        setScore(data.score);
        setStatus(getMarketStatus(data.score));
        setError(null);
      } catch (error) {
        console.error('Error fetching index:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus(error instanceof Error ? error.message : 'Error loading status');
      }
    };

    fetchIndex();
    const interval = setInterval(fetchIndex, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 font-[var(--font-roboto-mono)] bg-black text-white px-3 py-2 rounded-full text-sm md:text-base">
        <span className="text-red-500">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-[var(--font-roboto-mono)] bg-black text-white px-3 py-2 rounded-full text-sm md:text-base">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${getLEDColorForIndex(score)} animate-pulse`} />
        <span className="text-gray-300 whitespace-nowrap">MARKET STATUS:</span>
      </div>
      <span 
        className={`font-bold animate-[breathing_3s_ease-in-out_infinite] ${getStatusColor(status)} whitespace-nowrap`}
      >
        {status}
      </span>
    </div>
  );
} 