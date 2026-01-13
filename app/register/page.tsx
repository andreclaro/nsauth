'use client';

import { useRouter } from 'next/navigation';
import { RegistrationFlow, useAuthStore } from 'ns-auth-sdk';
import { useNSAuth } from '@/providers/NSAuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { authService } = useNSAuth();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  return (
    <RegistrationFlow
      authService={authService}
      setAuthenticated={setAuthenticated}
      onSuccess={() => router.push('/profile')}
    />
  );
}
