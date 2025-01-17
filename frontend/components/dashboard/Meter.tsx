'use client';

import { useEffect, useRef } from 'react';

interface MeterProps {
  value: number;
  size?: number;
  className?: string;
}

export function Meter({ 
  value, 
  size = 500,
  className = 'mx-auto'
}: MeterProps) {
  const svgRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    const currentRef = svgRef.current;

    const updateSVG = () => {
      if (currentRef?.contentDocument) {
        // Update score text
        const scoreElement = currentRef.contentDocument.getElementById('score');
        if (scoreElement) {
          scoreElement.textContent = Math.round(value).toString();
        }

        // Update needle rotation
        const needleElement = currentRef.contentDocument.getElementById('needle');
        if (needleElement) {
          // The needle in the SVG starts at -45 degrees
          // We want -75 degrees at value 0 and +75 degrees at value 100
          // So we offset our range by the initial position
          const initialAngle = -45;
          const minAngle = -75 + initialAngle; // -120 degrees
          const maxAngle = 75 + initialAngle;  // +30 degrees
          
          const degrees = minAngle + (value / 100) * (maxAngle - minAngle);
          
          needleElement.style.transformOrigin = '87.89px 89.38px';
          needleElement.style.transform = `rotate(${degrees}deg)`;
          needleElement.style.transition = 'transform 0.5s ease-out';
        }
      }
    };

    const checkAndUpdate = () => {
      if (currentRef?.contentDocument?.getElementById('needle')) {
        updateSVG();
      } else {
        setTimeout(checkAndUpdate, 100);
      }
    };

    if (currentRef) {
      currentRef.addEventListener('load', checkAndUpdate);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('load', checkAndUpdate);
      }
    };
  }, [value]);

  return (
    <object
      ref={svgRef}
      data="/images/backmeter1.svg"
      type="image/svg+xml"
      width={size}
      height={size}
      className={className}
      aria-label="Back Index Meter"
    />
  );
} 