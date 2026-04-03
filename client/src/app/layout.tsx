import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CloudAIP - Cloud AI Training & Services Platform',
  description:
    'Advance your cloud and AI skills with expert-led training programs. Enterprise cloud consulting and managed services.',
  keywords: ['cloud training', 'AI courses', 'AWS', 'Azure', 'cloud consulting', 'managed services'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-primary font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
