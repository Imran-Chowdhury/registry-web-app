import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter, Inter_Tight } from 'next/font/google';

import './globals.css';

// Three faces, three jobs — DESIGN.md §2. Loaded as CSS variables so Tailwind's
// font-sans / font-display / font-mono utilities resolve to them.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Registry — Student Management System',
  description: 'Registry module: enrolment, fees, coursework, and results.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
