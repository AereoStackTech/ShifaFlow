import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/src/components/AppProvider';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShifaFlow — Clinic Management & Medical Appointment SaaS Concept',
  description:
    'Multi-tenant medical clinic management (ERP) and conflict-free patient appointment booking SaaS concept with bilingual Arabic/English support.',
  openGraph: {
    title: 'ShifaFlow — Clinic Management & Medical Appointment SaaS Concept',
    description:
      'Multi-tenant medical clinic management (ERP) and conflict-free patient appointment booking SaaS concept with bilingual Arabic/English support.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShifaFlow — Clinic Management & Medical Appointment SaaS Concept',
    description:
      'Multi-tenant medical clinic management (ERP) and conflict-free patient appointment booking SaaS concept with bilingual Arabic/English support.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} ${plusJakarta.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-screen antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
