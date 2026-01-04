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
        <h1>NS Auth</h1>
        <p className="home-subtitle">Nostr Authentication with WebAuthn</p>
        <p className="home-description">
          Experience secure, phishing-resistant authentication using WebAuthn passkeys
          and the Nostr protocol. Create your identity, manage your profile, and explore
          your relationship graph.
        </p>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Authentication</h3>
            <p>WebAuthn passkey technology provides phishing-resistant authentication</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Decentralized</h3>
            <p>Built on Nostr protocol for censorship-resistant identity</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Relationship Graph</h3>
            <p>Visualize your Web of Trust through follow relationships</p>
          </div>
        </div>

        <div className="home-actions">
          <a href="/register" className="cta-button primary">
            Get Started
          </a>
          <a href="/docs" className="cta-button secondary">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}

