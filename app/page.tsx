'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, LoginButton } from 'ns-auth-sdk';
import { useEffect, useState } from 'react';
import { useNSAuth } from '@/providers/NSAuthProvider';
import Link from 'next/link';
import '@/App.css';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { authService } = useNSAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setLoginError = useAuthStore((state) => state.setLoginError);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    setHasAccount(authService.hasKeyInfo());
  }, [pathname, authService]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/profile');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* ---------- Header ---------- */}
        <h1>NSAuth</h1>
        <p className="home-subtitle">One credential, limitless access</p>

        <div className="home-description">
          <p>
            With NSAuth you receive a single, portable credential that unlocks
            both physical spaces and digital services across the entire community.
            Because membership is verified through a cryptographically signed,
            versioned member‑list, you enjoy:
          </p>

          <div className="home-features">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Seamless On‑boarding</h3>
              <p>
                Register once and instantly gain entry to gyms, co‑working hubs,
                transport, online courses, and more—no extra cards or passwords.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡️</div>
              <h3>Instant Policy Updates</h3>
              <p>
                Your status (new badge, restriction, privilege) propagates
                immediately to every service, keeping the whole ecosystem in
                sync without any manual re‑verification.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Privacy‑First Access</h3>
              <p>
                Zero‑knowledge proofs prove you belong to the community while
                keeping personal identifiers (passport, national ID) completely
                hidden from the service you're accessing.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global, Jurisdiction‑Agnostic</h3>
              <p>
                The same credential works for stateless individuals,
                diaspora groups, or emerging micronations—no reliance on any
                nation‑state document.
              </p>
            </div>
          </div>

          <p>
            In short, NSAuth turns a collective reputation into a practical,
            everyday trust layer that lets you work, learn, travel, and govern
            with confidence and autonomy.
          </p>
        </div>

        <div className="home-actions">
          {hasAccount ? (
            <LoginButton
              authService={authService}
              setAuthenticated={setAuthenticated}
              setLoginError={setLoginError}
              onSuccess={() => router.push('/graph')}
            />
          ) : (
            <Link href="/register" className="cta-button primary">
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
