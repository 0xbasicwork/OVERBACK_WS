'use client';

import { useState, useEffect } from 'react';

interface TrendData {
  trend: 'up' | 'down' | 'neutral';
  confidence: number;
}

export function TrendIndicator() {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrendData = async () => {
    try {
      const response = await fetch('/api/trend', {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to fetch trend data');
      const data = await response.json();
      setTrendData(data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setError('Failed to fetch trend data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
    // Refresh every minute
    const interval = setInterval(fetchTrendData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading trend data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!trendData) return null;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-${trendData.trend === 'up' ? 'green' : trendData.trend === 'down' ? 'red' : 'yellow'}-500`}>
        {trendData.trend === 'up' ? '↑' : trendData.trend === 'down' ? '↓' : '→'}
      </span>
      <span className="text-sm text-gray-600">
        {trendData.confidence.toFixed(1)}% confidence
      </span>
    </div>
  );
} 