'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useAuthInit } from '@/hooks/useAuth';
import '@/App.css';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  useAuthInit();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/graph');
    }
  }, [isAuthenticated, router]);

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
      </div>
    </div>
  );
}
