'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, ProfilePage } from 'ns-auth-sdk';
import { useNSAuth } from '@/providers/NSAuthProvider';
import { geminiService } from '@/services/gemini.service';

export default function Profile() {
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
    <ProfilePage
      authService={authService}
      relayService={relayService}
      publicKey={publicKey}
      onUnauthenticated={() => router.push('/')}
      onSuccess={() => router.push('/membership')}
      onRoleSuggestion={async (about: string) => {
        return await geminiService.suggestRole(about);
      }}
    />
  );
}
