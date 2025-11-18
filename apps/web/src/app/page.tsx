'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  );
}
