export interface IndexData {
  score: number;
  components: {
    market: number;
    social: number;
    onChain: number;
  };
  timestamp: string;
  lastUpdated: string;
  previousStatus?: string;
  previousScore?: number;
}

export interface HistoricalDataPoint {
  score: number;
  timestamp: string;
  label?: string;
  components?: {
    market: number;
    social: number;
    onChain: number;
  };
  details?: {
    marketMetrics?: Record<string, number>;
    socialMetrics?: Record<string, number>;
    onChainMetrics?: Record<string, number>;
  };
} 