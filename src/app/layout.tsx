
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'Vamos - Pool Cafe',
  description: 'Vamos - Coffee Shop Management',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: 'https://vamos-api-v2.sejadikopi.com/api/images?path=Logo/vamos_circle.png',
    shortcut: 'https://vamos-api-v2.sejadikopi.com/api/images?path=Logo/vamos_circle.png',
    apple: 'https://vamos-api-v2.sejadikopi.com/api/images?path=Logo/vamos_circle.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="application-name" content="SejadiKopi" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SejadiKopi" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#6F4E37" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#FFFAF0" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
