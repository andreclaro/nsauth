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

  // If the user is already logged‑in, skip the landing page
  if (isAuthenticated) {
    return <Navigate to="/graph" replace />;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* ---------- Header ---------- */}
        <h1>NS Auth</h1>
        <p className="home-subtitle">One credential, limitless access</p>

        {/* ---------- Integrated Description + Features ---------- */}
        <p className="home-description">
          With NS Auth you receive a single, portable credential that unlocks
          both physical spaces and digital services across the entire community.
          Because membership is verified through a cryptographically signed,
          versioned member‑list, you enjoy:

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
                hidden from the service you’re accessing.
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
          In short, NS Auth turns a collective reputation into a practical,
          everyday trust layer that lets you work, learn, travel, and govern
          with confidence and autonomy.
        </p>

        {/* ---------- Call‑to‑Action Buttons ---------- */}
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

