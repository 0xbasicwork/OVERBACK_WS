/* eslint-disable quotes */
'use client';

import { useState, useEffect } from 'react';
import { DrunkenFont } from '../DrunkenFont';
import { Meter } from './Meter';
import { getMarketStatus } from '@/app/components/MarketStatus';
import { IndexHistory } from './IndexHistory';
import { ConsoleOutput } from './ConsoleOutput';
import { format } from 'date-fns';
import Image from 'next/image';
import type { IndexData, HistoricalDataPoint } from '@/lib/types';

export function OverBackIndex() {
  const [data, setData] = useState<IndexData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [headerText, setHeaderText] = useState<string | JSX.Element>('Hey Solana...');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meterSize, setMeterSize] = useState(400);
  const [bgColor, setBgColor] = useState<string>('#10B981'); // Default emerald color
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/index/latest', {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to fetch index: ${response.status} - ${errorData}`);
        }
        
        const data = await response.json();
        
        // Validate data shape
        if (!data || typeof data.score !== 'number' || !data.components) {
          throw new Error('Invalid data format');
        }
        
        console.log('Index data:', data);
        setData(data as IndexData);
        setBgColor(getColorForStatus(data.score));
      } catch (err: unknown) {
        console.error('Error fetching index:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchIndex();
    const interval = setInterval(fetchIndex, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        console.log('Fetching historical data...');
        const response = await fetch('/api/index/history', {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch historical data');
        const data = await response.json();
        console.log('Raw historical data:', data);
        
        if (data.month && Array.isArray(data.month)) {
          const formattedData = data.month.map((point: HistoricalDataPoint) => ({
            score: point.score,
            timestamp: point.timestamp
          }));
          setHistoricalData(formattedData);
        } else {
          console.error('Invalid historical data format:', data);
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
      }
    };

    fetchHistoricalData();
  }, []);

  useEffect(() => {
    const sequence = async () => {
      // Start with "Hey Solana..."
      await new Promise(resolve => setTimeout(resolve, 3000));
      setAnimationKey(prev => prev + 1);
      setHeaderText('Is it Over?');
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      setAnimationKey(prev => prev + 1);
      setHeaderText(
        <>Are We <span 
          onClick={() => window.open('https://www.youtube.com/watch?v=zhYIVfMYFg8', '_blank', 'noopener,noreferrer')}
          style={{ 
            color: '#00bf63', 
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >$BACK</span>?</>
      );
      
      await new Promise(resolve => setTimeout(resolve, 30000));
      setAnimationKey(prev => prev + 1);
      setHeaderText('Hey Solana...');
    };
    
    sequence();
    const interval = setInterval(sequence, 37000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
        setMeterSize(window.innerWidth < 768 ? 300 : 400);
    };
    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (data) {
      setBgColor(getColorForStatus(data.score));
    }
  }, [data]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const titleContent = (
    <div className='sticky top-0 bg-white z-10 pb-2 md:pb-4 border-b border-gray-200'>
      <h1 className={`${DrunkenFont.className} text-center px-2 md:px-4`}>
        <div className='text-4xl md:text-8xl text-black'>
          CRUNCHING NUMBERS...
        </div>
      </h1>
    </div>
  );

  if (error) {
    return (
      <div className='text-center max-w-7xl mx-auto'>
        {titleContent}
        <p className='mt-4 text-red-500 px-4'>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='text-center max-w-7xl mx-auto'>
        {titleContent}
        <div className='mt-4 flex flex-col items-center'>
          <Image 
            src='/images/typing-cat.gif'
            alt='Loading...'
            width={200}
            height={150}
            className='rounded-lg'
          />
          <p className='mt-2 text-gray-400'>Loading index data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='text-center max-w-7xl mx-auto'>
        {titleContent}
        <div className='mt-4 flex flex-col items-center'>
          <Image 
            src='/images/typing-cat.gif'
            alt='Loading...'
            width={200}
            height={150}
            className='rounded-lg'
          />
          <p className='mt-2 text-gray-400'>Waiting for data...</p>
        </div>
      </div>
    );
  }

  const formattedDate = (dateString: string) => {
    try {
        // Validate the date string first
        if (!dateString || dateString === 'Invalid Date') {
            return 'No date available';
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return `${format(date, 'dd/MM/yyyy HH:mm:ss')} UTC`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Date error';
    }
  };

  const getDaysOfHistory = (data: HistoricalDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    
    const oldestDate = new Date(data[data.length - 1].timestamp);
    const newestDate = new Date(data[0].timestamp);
    const diffTime = Math.abs(newestDate.getTime() - oldestDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className='min-h-screen relative'>
      {/* Background wrapper with fixed position */}
      <div className='fixed inset-0'>
        <Image
          src='/images/marble-bg.jpeg'
          alt='Marble background'
          fill
          className='object-cover'
          priority
          quality={100}
        />
        {/* White overlay first */}
        <div className='absolute inset-0 bg-white/65' />
        
        {/* Color tint overlay on top */}
        <div 
          className='absolute inset-0 transition-colors duration-1000'
          style={{ 
            backgroundColor: bgColor,
            opacity: 0.15,
            mixBlendMode: 'soft-light'
          }} 
        />
      </div>

      {/* Content wrapper */}
      <div className='relative min-h-screen'>
        {/* Header */}
        <div className='sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 shadow-md'>
          <h1 className={`${DrunkenFont.className} text-center px-2 md:px-4 py-4`}>
            <div 
              key={animationKey}
              className='text-4xl md:text-8xl text-black opacity-0 animate-fadeIn'
            >
              {headerText}
            </div>
          </h1>
        </div>

        {/* Main content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex flex-col md:flex-row gap-6 mb-4 md:mb-8'>
              <div className='md:w-1/2 transition-all duration-500 ease-in-out hover:scale-105'>
                <Meter 
                  value={data.score} 
                  size={meterSize}
                  className='mx-auto w-full max-w-[300px] md:max-w-[400px]' 
                />
              </div>

              <div className='md:w-1/2 space-y-6 flex flex-col justify-center'>
                <div className='text-center space-y-2'>
                  <div className='font-mono font-black text-4xl md:text-[56px] tracking-tight uppercase'>
                    <span 
                      className='font-black' 
                      style={{ color: getColorForStatus(data.score) }}
                    >
                      {getMarketStatus(data.score)}
                    </span>
                  </div>
                </div>

                <div className='bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 font-mono hover:shadow-lg transition-shadow duration-300'>
                  <h3 className='text-sm font-bold text-gray-600 mb-3 font-mono'>Previous Values:</h3>
                  
                  <div className='space-y-2'>
                    {[
                      { label: 'Yesterday', status: data.previousStatus, score: data.previousScore },
                      { label: '1 week ago', status: 'COMING SOON', score: null, disabled: true },
                      { label: '1 month ago', status: 'COMING LATER', score: null, disabled: true },
                      { label: '1 year ago', status: 'EVENTUALLY', score: null, disabled: true }
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className={`flex justify-between items-center border-b border-gray-200 pb-2 
                          ${item.disabled ? 'opacity-50' : 'hover:bg-gray-50 transition-colors duration-200'}
                          ${index === 0 ? 'animate-fadeIn' : ''}`}
                      >
                        <div className='flex items-center gap-2'>
                          <span className='text-gray-600 text-sm font-mono'>{item.label}</span>
                          <span className='font-bold text-sm font-mono'>{item.status || 'NO DATA YET'}</span>
                        </div>
                        <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm font-mono text-black
                          ${item.disabled ? 'bg-gray-100 text-gray-600' : 
                          'bg-gray-200 hover:scale-110 transition-transform duration-200 border-2'}`}
                          style={!item.disabled && item.score ? { 
                            borderColor: getColorForStatus(item.score),
                            boxShadow: `0 0 0 1px ${getColorForStatus(item.score)}20`
                          } : undefined}>
                          {item.score || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 text-sm md:text-base cursor-help font-bold'
                  title={`Market Score (40% weight):\n• Price action (15%)\n• Trading volume (15%)\n• Market indicators (10%)`}>
                  Market
                </span>
                <span className='font-bold text-sm md:text-base text-emerald-600'>
                  {Math.round(data.components.market)}
                </span>
              </div>
              <div className='h-3 md:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner'>
                <div 
                  className='h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500'
                  style={{ 
                    width: `${data.components.market}%`,
                  }}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 text-sm md:text-base cursor-help font-bold'
                  title={`Social Score (30% weight):\n• Social media sentiment (10%)\n• Community mentions (10%)\n• Engagement metrics (10%)`}>
                  Social
                </span>
                <span className='font-bold text-sm md:text-base text-amber-600'>
                  {Math.round(data.components.social)}
                </span>
              </div>
              <div className='h-3 md:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner'>
                <div 
                  className='h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-amber-400 to-amber-500'
                  style={{ 
                    width: `${data.components.social}%`,
                  }}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600 text-sm md:text-base cursor-help font-bold'
                  title={`On-Chain Score (30% weight):\n• Network activity (10%)\n• Transaction volume (10%)\n• Blockchain metrics (10%)`}>
                  On-Chain
                </span>
                <span className='font-bold text-sm md:text-base text-orange-600'>
                  {Math.round(data.components.onChain)}
                </span>
              </div>
              <div className='h-3 md:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner'>
                <div 
                  className='h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-orange-400 to-orange-500'
                  style={{ 
                    width: `${data.components.onChain}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className='mt-6 md:mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200'>
            <h2 className='text-lg md:text-xl font-bold mb-3 md:mb-4 text-center'>
              {getDaysOfHistory(historicalData)} Day History
              <div className='text-xs text-gray-500 font-normal mt-1'>
                Data collected daily at 12:00 UTC
              </div>
            </h2>
            <IndexHistory data={historicalData} />
          </div>

          <div className='mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-200'>
            <ConsoleOutput />
          </div>

          <div className='text-center text-xs md:text-sm text-gray-600 mt-6 md:mt-8 font-mono'>
            Last Updated: {formattedDate(data.lastUpdated)}
          </div>

          <div className='mt-6 text-center'>
            <div className='inline-flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-100 transition-colors duration-200 cursor-pointer flex-wrap justify-center'
                 onClick={() => copyToClipboard('AUiXW4YH5TLNFBgVayFBRvgWTz2ApeeM1Br7FCoyrugj')}>
              <span className='font-mono text-sm text-gray-600 mr-1'>$BACK:</span>
              <span className='font-mono text-xs sm:text-sm break-all max-w-[200px] sm:max-w-none'>AUiXW4YH5TLNFBgVayFBRvgWTz2ApeeM1Br7FCoyrugj</span>
              {copyFeedback ? (
                <span className='text-green-500 text-sm ml-1'>✓ Copied!</span>
              ) : (
                <svg className='w-4 h-4 text-gray-500 ml-1 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorForStatus(index: number): string {
  if (index < 20) return '#EF4444';  // red-500
  if (index < 40) return '#F97316';  // orange-500
  if (index < 60) return '#EAB308';  // yellow-500
  if (index < 80) return '#22C55E';  // green-500
  return '#10B981';                  // emerald-500
} 