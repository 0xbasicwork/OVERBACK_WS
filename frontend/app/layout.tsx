import { drunkenFont } from './fonts'
import { Roboto_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | OverBack',
    default: 'OverBack Index'
  },
  description: 'Real-time Solana market sentiment index'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={drunkenFont.variable}>
      <body className={`min-h-screen ${robotoMono.className}`}>{children}</body>
    </html>
  );
}
