'use client';

import '@/App.css';

/* --------------------------------------------------------------
   NSAuth – User‑Focused Documentation
   -------------------------------------------------------------- */
export default function DocsPage() {
  return (
    <div className="docs-container">
      <div className="docs-content">
        <h1>NSAuth Overview</h1>

        <p className="docs-intro">
          NSAuth gives you a single, portable credential that works everywhere – from gyms and co‑working spaces
          to online courses, travel services, and community voting. By tying every interaction to a trusted,
          versioned member list, you enjoy seamless access, instant policy updates, and strong privacy protection.
        </p>

        {/* ==================== USER BENEFITS ==================== */}
        <section className="protocol-section">
          <h2>Why NSAuth Is Valuable for You</h2>
          <div className="protocol-content">
            <ul>
              <li>
                <strong>One credential, endless doors</strong> – Register once and unlock physical locations,
                digital platforms, and community services without repeatedly proving who you are.
              </li>
              <li>
                <strong>Instant privilege changes</strong> – If your membership status changes (e.g., you earn a
                new badge or a restriction is applied), the update propagates immediately, so you never have to
                wait for paperwork or manual approvals.
              </li>
              <li>
                <strong>Privacy‑first proof of eligibility</strong> – Your personal identifiers stay hidden.
                You prove you belong to a trusted group without revealing your passport number, birthdate, or
                other sensitive data.
              </li>
              <li>
                <strong>Works anywhere, for anyone</strong> – Because verification relies on cryptographic
                signatures rather than government IDs, the system serves stateless persons, diaspora communities,
                and emerging micronations just as easily as residents of any country.
              </li>
              <li>
                <strong>No passwords to remember</strong> – Authentication uses your device’s built‑in biometric
                methods (fingerprint, face, PIN) or a secure hardware key, eliminating password fatigue and
                phishing risk.
              </li>
              <li>
                <strong>Self‑controlled credentials</strong> – All keys live on your device in a secure enclave.
                You can rotate or revoke them anytime without contacting a third party.
              </li>
            </ul>
          </div>
        </section>

        {/* ==================== ON‑BOARDING ==================== */}
        <section className="protocol-section">
          <h2>Getting Started – On‑boarding a New Member</h2>
          <div className="protocol-content">
            <ol>
              <li>
                <strong>Apply with a simple proof</strong> – Submit a hashed version of your passport (or any
                official ID) together with a privacy‑preserving proof that you own it.
              </li>
              <li>
                <strong>Community review</strong> – A trusted council evaluates the submission quickly.
              </li>
              <li>
                <strong>Receive your digital membership card</strong> – Once approved, a signed entry is added
                to the member list and your device stores a self‑sovereign card that can be exported as a QR code
                for offline use.
              </li>
            </ol>
          </div>
        </section>

        {/* ==================== USING THE CARD ==================== */}
        <section className="protocol-section">
          <h2>Everyday Interactions</h2>
          <div className="protocol-content">
            {/* Physical Access */}
            <h3>Physical Facilities (gyms, co‑working spaces, transport)</h3>
            <p>
              Scan the QR code at the entrance. The reader checks the latest member list, confirms your
              credential, and unlocks the door—all in a split second, without ever seeing your personal ID.
            </p>

            {/* Digital Services */}
            <h3>Digital Platforms (online courses, media libraries, developer APIs)</h3>
            <p>
              Log in with your device’s biometric authenticator. The service verifies that your key appears in
              the current member list and grants you a session token. No passwords, no email verification, and
              no data leakage.
            </p>

            {/* Revocation & Rotation */}
            <h3>Changing or Revoking Access</h3>
            <p>
              If a member violates community rules, the council simply removes the key from the next version of
              the list. All services refresh automatically, instantly denying further access. Likewise, you can
              replace your key whenever you wish—just submit the new public key and the next list update takes
              effect without interruption.
            </p>
          </div>
        </section>

        {/* ==================== GOVERNANCE ==================== */}
        <section className="protocol-section">
          <h2>Transparent Governance</h2>
          <div className="protocol-content">
            <ul>
              <li>
                <strong>Multi‑signature control</strong> – Adding or removing members requires approval from a
                threshold of trusted operators, preventing unilateral changes.
              </li>
              <li>
                <strong>Public auditability</strong> – Every version of the member list is publicly readable,
                allowing anyone to verify who is currently authorized.
              </li>
              <li>
                <strong>Reasoned removals</strong> – Operators can attach a signed rationale to a removal,
                enabling external review while still protecting personal data.
              </li>
            </ul>
          </div>
        </section>

        {/* ==================== USE‑CASE HIGHLIGHTS ==================== */}
        <section className="protocol-section">
          <h2>Real‑World Use Cases</h2>
          <div className="protocol-content">
            <ul>
              <li>
                <strong>Gym & Sports‑Club Membership</strong> – Walk in, scan, and start your workout instantly.
              </li>
              <li>
                <strong>Co‑Working & Makerspaces</strong> – Access tools and workstations without separate
                sign‑ups; privileges can be upgraded on the fly.
              </li>
              <li>
                <strong>Shared Mobility (bike‑share, shuttles)</strong> – Tap your phone, ride, and the system
                knows you’re authorized without learning your identity.
              </li>
              <li>
                <strong>Online Learning</strong> – Enroll once; the platform automatically grants you course
                materials, labs, and alumni benefits as your badges evolve.
              </li>
              <li>
                <strong>Content Subscriptions</strong> – Premium media checks only that you hold a valid
                “subscriber” badge, never your email or payment details.
              </li>
              <li>
                <strong>Developer APIs & Cloud Resources</strong> – Only verified developers receive tokens,
                and revocation happens instantly if a key is removed.
              </li>
              <li>
                <strong>Community Governance & Voting</strong> – Vote securely with a proof of eligibility;
                votes remain anonymous while ensuring only authorized members participate.
              </li>
              <li>
                <strong>Financial & Token Payments</strong> – Freelancers receive token payments only after the
                system confirms a “contractor‑approved” badge.
              </li>
              <li>
                <strong>Medical & Emergency Services</strong> – Clinics verify a “medical‑access” badge without
                ever seeing a passport number, enabling fast care for stateless individuals.
              </li>
            </ul>
          </div>
        </section>

        {/* ==================== ARCHITECTURE DIAGRAM ==================== */}
        <section className="protocol-section">
          <h2>System Architecture</h2>
          <div className="protocol-content">
            <div className="diagram-container">
              {/* The SVG diagram remains unchanged – it is purely visual and does not contain
                  technical jargon that would be exposed to the user. */}
              <svg
                viewBox="0 0 900 200"
                className="architecture-diagram"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* User */}
                <rect x="50" y="50" width="120" height="95" rx="8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
                <text x="110" y="85" textAnchor="middle" fontSize="16" fontWeight="600" fill="#0c4a6e">User</text>
                <text x="110" y="105" textAnchor="middle" fontSize="12" fill="#075985">Browser</text>
                <text x="110" y="125" textAnchor="middle" fontSize="12" fill="#075985">Biometric Identity</text>

                {/* Credential Creation */}
                <rect x="250" y="30" width="140" height="100" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                <text x="320" y="60" textAnchor="middle" fontSize="14" fontWeight="600" fill="#92400e">Credential</text>
                <text x="320" y="80" textAnchor="middle" fontSize="12" fill="#78350f">Business Card</text>
                <text x="320" y="100" textAnchor="middle" fontSize="12" fill="#78350f">Registration</text>

                {/* Member List */}
                <rect x="450" y="50" width="120" height="80" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                <text x="510" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1e3a8a">Member List</text>
                <text x="510" y="95" textAnchor="middle" fontSize="12" fill="#1e40af">Signed & Versioned</text>

                {/* Services */}
                <rect x="650" y="30" width="140" height="100" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
                <text x="720" y="60" textAnchor="middle" fontSize="14" fontWeight="600" fill="#312e81">Services</text>
                <text x="720" y="80" textAnchor="middle" fontSize="12" fill="#3730a3">Physical & Digital</text>

                {/* Arrows – Registration */}
                <path d="M 170 90 L 250 80" stroke="#0284c7" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="210" y="75" textAnchor="middle" fontSize="10" fill="#0284c7">Create</text>

                <path d="M 390 80 L 450 90" stroke="#2563eb" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="420" y="75" textAnchor="middle" fontSize="10" fill="#2563eb">Add to List</text>

                <path d="M 570 90 L 650 80" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="610" y="75" textAnchor="middle" fontSize="10" fill="#6366f1">Service Checks</text>

                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#333" />
                  </marker>
                </defs>
              </svg>
            </div>
            <p>
              The diagram shows how a single credential you create on your device is added to a signed, versioned
              member list. Every service—whether a door lock, a web app, or a voting contract—simply checks that list
              to confirm you have the right privileges, all without ever learning your personal identifiers.
            </p>
          </div>
        </section>

        {/* ==================== TECH STACK (Brief) ==================== */}
        <section className="protocol-section">
          <h2>Technology Behind the Experience</h2>
          <div className="protocol-content">
            <p>
              While you won’t see the inner workings, NSAuth relies on modern web authentication (biometric
              passkeys), a privacy‑preserving proof system, and a globally distributed, signed member list.
              This combination delivers the seamless, secure, and private experience described above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}