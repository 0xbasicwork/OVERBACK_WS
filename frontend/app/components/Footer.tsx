import Link from 'next/link';
import { FaWolfPackBattalion } from 'react-icons/fa';
import { SiHiveBlockchain } from 'react-icons/si';
import { FaXTwitter, FaTelegram, FaTiktok } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="w-full bg-black py-4 md:py-6 mt-8 md:mt-16">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-4">
        <div className="flex gap-3 md:gap-6 items-center flex-wrap justify-center">
          <Link 
            href="https://dexscreener.com/solana/fthjjgargdsm1cssdfrpxxhxybaqpiw2x5zg5tkxyp9" 
            target="_blank" 
            className="text-3xl md:text-4xl text-white hover:opacity-80"
          >
            <FaWolfPackBattalion />
          </Link>
          <Link 
            href="https://www.dextools.io/app/en/token/soback?t=1736541994322" 
            target="_blank" 
            className="text-3xl md:text-4xl text-white hover:opacity-80"
          >
            <SiHiveBlockchain />
          </Link>
          <Link 
            href="https://x.com/SOBACK_ITSOVER" 
            target="_blank" 
            className="text-3xl md:text-4xl text-white hover:opacity-80"
          >
            <FaXTwitter />
          </Link>
          <Link 
            href="https://t.me/sobacksol" 
            target="_blank" 
            className="text-3xl md:text-4xl text-white hover:opacity-80"
          >
            <FaTelegram />
          </Link>
          <Link 
            href="https://www.tiktok.com/@soback_itsover" 
            target="_blank" 
            className="text-3xl md:text-4xl text-white hover:opacity-80"
          >
            <FaTiktok />
          </Link>
        </div>
        <div className="text-white text-[10px] md:text-[14px] text-center" style={{ fontFamily: 'var(--font-roboto-mono)' }}>
          <p className="mb-1 md:mb-2">
            All rights reserved © 2025{' '}
            <Link 
              href="https://www.workforyourbags.lol/" 
              target="_blank"
              className="hover:opacity-80"
            >
              WORK For Your Bags
            </Link>
          </p>
          <p>NFA. DYOR. WAGMI.</p>
        </div>
      </div>
    </footer>
  );
} 