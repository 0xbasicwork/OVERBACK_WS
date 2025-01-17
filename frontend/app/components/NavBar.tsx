'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaWolfPackBattalion } from 'react-icons/fa';
import { SiHiveBlockchain } from 'react-icons/si';
import { FaXTwitter, FaTelegram, FaTiktok } from 'react-icons/fa6';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import MarketStatusIndicator from './MarketStatusIndicator';

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full px-3 md:px-10 py-4 md:py-8 bg-white/95 backdrop-blur-sm fixed top-0 z-50 font-[var(--font-drunken-1)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side - Social Icons */}
        <div className="flex gap-1.5 md:gap-6 items-center">
          <Link 
            href="https://dexscreener.com/solana/fthjjgargdsm1cssdfrpxxhxybaqpiw2x5zg5tkxyp9" 
            target="_blank" 
            className="text-xl md:text-4xl text-black hover:opacity-80 shrink-0"
          >
            <FaWolfPackBattalion />
          </Link>
          <Link 
            href="https://www.dextools.io/app/en/token/soback?t=1736541994322" 
            target="_blank" 
            className="text-xl md:text-4xl text-black hover:opacity-80 shrink-0"
          >
            <SiHiveBlockchain />
          </Link>
          <Link 
            href="https://x.com/SOBACK_ITSOVER" 
            target="_blank" 
            className="text-xl md:text-4xl text-black hover:opacity-80 shrink-0"
          >
            <FaXTwitter />
          </Link>
          <Link 
            href="https://t.me/sobacksol" 
            target="_blank" 
            className="text-xl md:text-4xl text-black hover:opacity-80 shrink-0"
          >
            <FaTelegram />
          </Link>
          <Link 
            href="https://www.tiktok.com/@soback_itsover" 
            target="_blank" 
            className="text-xl md:text-4xl text-black hover:opacity-80 shrink-0"
          >
            <FaTiktok />
          </Link>
        </div>

        {/* Center - Navigation Links (Hidden on mobile) */}
        <div className="hidden md:flex gap-8">
          <Link href="/" className="text-black hover:underline underline-offset-8">
            HOME
          </Link>
          <Link 
            href="https://jup.ag/swap/SOL-AUiXW4YH5TLNFBgVayFBRvgWTz2ApeeM1Br7FCoyrugj"
            target="_blank" 
            className="text-black hover:underline underline-offset-8"
          >
            BUY
          </Link>
          <Link href="/tokenomics" className="text-black hover:underline underline-offset-8">
            TOKENOMICS
          </Link>
          <Link 
            href="https://www.sobackitsover.xyz/dashboard" 
            target="_blank"
            className="text-black hover:underline underline-offset-8"
          >
            OVER & BACK INDEX
          </Link>
        </div>

        {/* Right side - Market Status and Menu */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <MarketStatusIndicator />
          <button 
            className="md:hidden text-lg text-black p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <RiCloseLine /> : <RiMenu3Line />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 py-4">
          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="text-black hover:underline underline-offset-8">
              HOME
            </Link>
            <Link 
              href="https://jup.ag/swap/SOL-AUiXW4YH5TLNFBgVayFBRvgWTz2ApeeM1Br7FCoyrugj"
              target="_blank"
              className="text-black hover:underline underline-offset-8"
            >
              BUY
            </Link>
            <Link href="/tokenomics" className="text-black hover:underline underline-offset-8">
              TOKENOMICS
            </Link>
            <Link 
              href="https://index.sobackitsover.xyz/" 
              target="_blank"
              className="text-black hover:underline underline-offset-8"
            >
              OVER & BACK INDEX
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 