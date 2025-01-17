import { OverBackIndex } from '@/components/dashboard/OverBackIndex';
import Footer from '@/app/components/Footer';
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Over or Back Index',
  description: 'Real-time market sentiment analysis for Solana',
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-texture">
      <main className="flex-1 p-2 md:p-4">
        <OverBackIndex />
      </main>
      <Footer />
    </div>
  );
}
