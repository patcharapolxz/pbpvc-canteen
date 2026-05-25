import type { Metadata, Viewport } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PBPVC Canteen',
  description: 'ระบบสั่งอาหารโรงเรียน PBPVC',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#006837',
};

import ThemeInitializer from '@/components/ThemeInitializer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className="font-kanit">
        <ThemeInitializer />
        {children}
        <div id="print-area" className="hidden print:block"></div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'var(--font-kanit)', borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#006837', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
