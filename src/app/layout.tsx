import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { DisclaimerBanner } from '@/components/layout/DisclaimerBanner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'دواك | صيدليتك في جيبك — صيدلية إلكترونية مصرية',
  description:
    'منصة صيدلية إلكترونية متطورة مصممة خصيصاً للمستهلك المصري. توفر أدوية ومستلزمات صحية وبدائل محلية موفرة بأسعار عادلة وتوصيل فوري لجميع المحافظات.',
  icons: {
    icon: '/logos/dawaak-logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-screen flex flex-col font-cairo bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        <ClientProviders>
          {/* Healthcare Simulation Disclaimer Banner */}
          <DisclaimerBanner />

          {/* Sticky Header */}
          <Header />

          {/* Main Application Content Container */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4">
            {children}
          </main>

          {/* Egyptian Trust & Regulatory Footer */}
          <Footer />

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav />
        </ClientProviders>
      </body>
    </html>
  );
}
