'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string | null;  // null for section headers
  type: 'success' | 'info' | 'system' | 'error' | 'log' | 'header' | 'subheader';
  message: string;
}

function parseLogLine(line: string): LogEntry | null {
  const match = line.match(/\[(.*?)\] (\w+): (.*)/);
  if (!match) return null;
  
  // Parse and reformat the timestamp to our standard format
  const timestamp = match[1];
  try {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      const formattedTime = format(date, 'dd/MM/yyyy HH:mm:ss');
      
      // Validate the log type
      const type = match[2].toLowerCase() as LogEntry['type'];
      if (!isValidLogType(type)) {
        console.warn(`Invalid log type: ${type}`);
        return null;
      }
      
      return {
        timestamp: `${formattedTime} UTC`,
        type,
        message: match[3]
      };
    }
  } catch (error) {
    console.error('Failed to parse timestamp:', timestamp);
  }
  
  return null;
}

// Type guard for log types
function isValidLogType(type: string): type is LogEntry['type'] {
  return ['success', 'info', 'system', 'error', 'log', 'header', 'subheader'].includes(type);
}

export function ConsoleOutput() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'log' | 'error'>('all');
  const consoleRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastScrollPosition = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (consoleRef.current && autoScroll) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [autoScroll]);

  const handleScroll = () => {
    if (consoleRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
      lastScrollPosition.current = scrollTop;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/console', {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch logs');
        const text = await response.text();
        const entries = text.split('\n')
          .filter(line => line.trim())
          .map(parseLogLine)
          .filter((entry): entry is LogEntry => entry !== null);
        setLogs(entries);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to fetch console logs');
      }
    };

    if (typeof window !== 'undefined') {
      fetchLogs();
      const interval = setInterval(fetchLogs, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'header': return 'text-purple-400 font-bold text-lg';
      case 'subheader': return 'text-gray-400 italic';
      default: return 'text-gray-100';
    }
  };

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="mt-4 md:mt-8 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 md:mb-4 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold">Data Collection Progress</h2>
          <div className="px-2 py-1 bg-gray-200 rounded text-xs md:text-sm h-7">
            {logs.length} entries
          </div>
          <button
            onClick={() => {
              setAutoScroll(true);
              scrollToBottom();
            }}
            className={`px-2 py-1 rounded text-xs md:text-sm h-7 ${
              autoScroll ? 'bg-green-200' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {autoScroll ? 'Auto-scrolling' : 'Click to auto-scroll'}
          </button>
        </div>
        <div className="flex gap-2">
          <select 
            className="px-2 py-1 border rounded text-xs md:text-sm h-7"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All Logs</option>
            <option value="log">Logs Only</option>
            <option value="error">Errors Only</option>
          </select>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs md:text-sm h-7"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      <div 
        ref={consoleRef}
        onScroll={handleScroll}
        className={`bg-gray-900 text-gray-100 rounded-lg p-2 md:p-4 overflow-auto transition-all ${
          isExpanded ? 'h-[400px] md:h-[500px]' : 'h-[150px] md:h-[200px]'
        }`}
      >
        {logs.map((log, index) => (
          <div 
            key={index}
            className={`mb-1 font-mono text-xs md:text-sm ${getLogColor(log.type)}`}
          >
            {log.timestamp && (
              <span className="text-gray-500">
                {log.timestamp}:{' '}
              </span>
            )}
            <span className="whitespace-pre-wrap break-words">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500 text-center mt-4 text-sm">
            No logs available
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1 flex justify-between">
        <span>Auto-refreshing every 10 seconds</span>
        <span>{autoScroll ? 'Auto-scrolling enabled' : 'Auto-scrolling disabled'}</span>
      </div>
    </div>
  );
} 