// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Wellness Assistant - Suporte Emocional com IA',
  description: 'Assistente de bem-estar mental com inteligência artificial. Suporte emocional seguro, confidencial e disponível 24/7.',
  keywords: 'saúde mental, bem-estar, terapia online, suporte emocional, IA, inteligência artificial',
  authors: [{ name: 'AI Wellness Team' }],
  creator: 'AI Wellness',
  publisher: 'AI Wellness',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://aiwellness.com.br',
    title: 'AI Wellness Assistant - Suporte Emocional com IA',
    description: 'Assistente de bem-estar mental com inteligência artificial.',
    siteName: 'AI Wellness Assistant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Wellness Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Wellness Assistant',
    description: 'Suporte emocional com IA disponível 24/7',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster 
              position="top-center"
              richColors
              closeButton
              duration={4000}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
