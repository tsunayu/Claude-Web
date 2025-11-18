import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
// import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Intelligent Alert Hub',
  description: 'Intelligent information collection and notification system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          {/* <Toaster /> */}
        </AuthProvider>
      </body>
    </html>
  );
}
