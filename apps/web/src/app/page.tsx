'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadTokens } from '@/lib/api';

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace(loadTokens() ? '/dashboard' : '/login');
  }, [router]);
  return null;
}
