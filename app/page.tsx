'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { useAuthInit } from '@/hooks/useAuth';
import { nosskeyService } from '@/services/nosskey.service';
import Link from 'next/link';
import '@/App.css';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setLoginError = useAuthStore((state) => state.setLoginError);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  useAuthInit();

  // Check if user has an account (key info stored)
  // Update when pathname changes so it reflects after registration
  useEffect(() => {
    setHasAccount(nosskeyService.hasKeyInfo());
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/profile');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    setLoginError(null);

    try {
      // Check if key info exists
      if (!nosskeyService.hasKeyInfo()) {
        throw new Error('No account found. Please register first.');
      }

      // Get current key info
      const keyInfo = nosskeyService.getCurrentKeyInfo();
      if (!keyInfo) {
        throw new Error('Failed to load account information.');
      }

      // Verify by getting public key (this will trigger WebAuthn authentication)
      await nosskeyService.getPublicKey();

      // Set as authenticated
      setAuthenticated(keyInfo);

      // Redirect to graph page
      router.push('/graph');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setLoginError(errorMessage);
      setIsLoginLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* ---------- Header ---------- */}
        <h1>NS Auth</h1>
        <p className="home-subtitle">One credential, limitless access</p>

        {/* ---------- Integrated Description + Features ---------- */}
        <div className="home-description">
          <p>
            With NS Auth you receive a single, portable credential that unlocks
            both physical spaces and digital services across the entire community.
            Because membership is verified through a cryptographically signed,
            versioned member‑list, you enjoy:
          </p>

          {/* ---- Feature block – now part of the description ---- */}
          <div className="home-features">
            {/* Feature 1 – Seamless onboarding */}
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Seamless On‑boarding</h3>
              <p>
                Register once and instantly gain entry to gyms, co‑working hubs,
                transport, online courses, and more—no extra cards or passwords.
              </p>
            </div>

            {/* Feature 2 – Instant policy updates */}
            <div className="feature-card">
              <div className="feature-icon">⚡️</div>
              <h3>Instant Policy Updates</h3>
              <p>
                Your status (new badge, restriction, privilege) propagates
                immediately to every service, keeping the whole ecosystem in
                sync without any manual re‑verification.
              </p>
            </div>

            {/* Feature 3 – Privacy‑first access */}
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Privacy‑First Access</h3>
              <p>
                Zero‑knowledge proofs prove you belong to the community while
                keeping personal identifiers (passport, national ID) completely
                hidden from the service you're accessing.
              </p>
            </div>

            {/* Feature 4 – Global, jurisdiction‑agnostic use */}
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

          {/* Closing sentence that ties back to the description */}
          <p>
            In short, NS Auth turns a collective reputation into a practical,
            everyday trust layer that lets you work, learn, travel, and govern
            with confidence and autonomy.
          </p>
        </div>

        {/* ---------- Action Buttons ---------- */}
        <div className="home-actions">
          {hasAccount ? (
            <button
              onClick={handleLogin}
              disabled={isLoginLoading}
              className="cta-button primary"
              style={{ cursor: isLoginLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoginLoading ? 'Logging in...' : 'Login'}
            </button>
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
