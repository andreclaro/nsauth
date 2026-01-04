import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RegistrationFlow } from './components/auth/RegistrationFlow';
import { ProfilePage } from './components/profile/ProfilePage';
import { RelationshipGraph } from './components/graph/RelationshipGraph';
import { VerifyOnlyDemo } from './components/verification/VerifyOnlyDemo';
import { useAuthStore } from './store/authStore';
import { useAuthInit } from './hooks/useAuth';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/graph" replace />;
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
          <a href="/register" className="cta-button secondary">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Initialize auth state on app load
  useAuthInit();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationFlow />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/graph"
            element={
              <ProtectedRoute>
                <RelationshipGraph />
              </ProtectedRoute>
            }
          />
          <Route path="/verify-only-demo" element={<VerifyOnlyDemo />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

