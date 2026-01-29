'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, MembershipPage } from 'ns-auth-sdk';
import { useNSAuth } from '@/providers/NSAuthProvider';

export default function Membership() {
  const router = useRouter();
  const { authService, relayService } = useNSAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const publicKey = useAuthStore((state) => state.publicKey);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MembershipPage
      authService={authService}
      relayService={relayService}
      publicKey={publicKey}
      onUnauthenticated={() => router.push('/')}
    />
  );
}
