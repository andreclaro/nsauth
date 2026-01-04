import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { nosskeyService } from '../services/nosskey.service';

/**
 * Hook to initialize auth state on app load
 */
export function useAuthInit() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  useEffect(() => {
    // Check if user has existing key info
    if (nosskeyService.hasKeyInfo()) {
      const keyInfo = nosskeyService.getCurrentKeyInfo();
      if (keyInfo) {
        setAuthenticated(keyInfo);
      }
    }
  }, [setAuthenticated]);
}


