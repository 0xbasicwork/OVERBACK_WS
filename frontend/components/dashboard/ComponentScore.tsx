'use client';

import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

interface ComponentScoreProps {
  label: string;
  value: number;
  className?: string;
}

export function ComponentScore({ label, value, className }: ComponentScoreProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
} 