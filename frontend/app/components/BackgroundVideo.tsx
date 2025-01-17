'use client';

import { useEffect, useState, useRef } from 'react';

export default function BackgroundVideo() {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Video autoplay failed:', error);
      });
    }
  }, []);

  if (!mounted) return null;

  return (
    <video 
      ref={videoRef}
      autoPlay 
      loop 
      muted 
      playsInline
      style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        minWidth: '100%',
        minHeight: '100%',
        width: 'auto',
        height: 'auto',
        zIndex: -1,
        objectFit: 'cover',
        opacity: 0.7
      }}
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
} 