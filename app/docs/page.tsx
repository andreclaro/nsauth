'use client';

import '@/App.css';

export default function DocsPage() {
  return (
    <div className="docs-container">
      <div className="docs-content">
        <h1>Protocols & Technologies</h1>
        <p className="docs-intro">
          NS Auth leverages several cutting-edge protocols to provide secure, decentralized authentication
          and identity verification. This document explains the key protocols and how they work together.
        </p>

        <section className="protocol-section">
          <h2>Nostr Protocol</h2>
          <div className="protocol-content">
            <h3>Overview</h3>
            <p>
              <strong>Nostr</strong> (Notes and Other Stuff Transmitted by Relays) is a decentralized,
              censorship-resistant social networking protocol. Unlike traditional social networks, Nostr
              doesn't rely on a central server. Instead, it uses a network of relays that anyone can run.
            </p>

            <h3>Key Concepts</h3>
            <ul>
              <li>
                <strong>Public Keys:</strong> Each user has a cryptographic key pair. The public key serves
                as their unique identifier (npub).
              </li>
              <li>
                <strong>Events:</strong> All data in Nostr is stored as signed events. Events are immutable
                and cryptographically verifiable.
              </li>
              <li>
                <strong>Relays:</strong> Servers that store and forward events. Users can connect to multiple
                relays for redundancy and censorship resistance.
              </li>
              <li>
                <strong>Event Kinds:</strong> Different types of events serve different purposes:
                <ul>
                  <li><strong>Kind 0:</strong> User profile metadata (name, bio, picture)</li>
                  <li><strong>Kind 3:</strong> Contact list / follow list</li>
                  <li><strong>Kind 30001:</strong> Custom application data (used for verification proofs)</li>
                </ul>
              </li>
            </ul>

            <h3>How NS Auth Uses Nostr</h3>
            <ul>
              <li>Stores user profiles as Kind 0 events</li>
              <li>Manages follow relationships via Kind 3 events</li>
              <li>Publishes verification proofs as Kind 30001 events</li>
              <li>Enables decentralized identity that works across different applications</li>
            </ul>

            <div className="protocol-links">
              <strong>Learn More:</strong>{' '}
              <a href="https://nostr.com" target="_blank" rel="noopener noreferrer">
                nostr.com
              </a>
              {' | '}
              <a href="https://github.com/nostr-protocol/nostr" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </section>

        <section className="protocol-section">
          <h2>WebAuthn & Passkeys</h2>
          <div className="protocol-content">
            <h3>Overview</h3>
            <p>
              <strong>WebAuthn</strong> (Web Authentication) is a W3C standard that enables passwordless
              authentication using public key cryptography. <strong>Passkeys</strong> are a user-friendly
              implementation of WebAuthn that use biometric authentication (Touch ID, Face ID, Windows Hello)
              or security keys.
            </p>

            <h3>Key Features</h3>
            <ul>
              <li>
                <strong>Phishing-Resistant:</strong> Credentials are bound to the domain, preventing
                phishing attacks
              </li>
              <li>
                <strong>Passwordless:</strong> No passwords to remember, forget, or be stolen
              </li>
              <li>
                <strong>Biometric Authentication:</strong> Uses device-native biometrics for user verification
              </li>
              <li>
                <strong>Platform Authenticators:</strong> Uses device-integrated authenticators (Touch ID,
                Face ID) rather than external security keys
              </li>
            </ul>

            <h3>PRF Extension</h3>
            <p>
              The <strong>PRF (Pseudo-Random Function) Extension</strong> is a WebAuthn extension that allows
              deriving cryptographic keys from the authenticator. NS Auth uses this extension to derive Nostr
              private keys from WebAuthn credentials, enabling seamless integration between WebAuthn
              authentication and Nostr identity.
            </p>
            <p>
              This means your Nostr identity is cryptographically linked to your WebAuthn credential, ensuring
              that only you (via biometric authentication) can access your Nostr account.
            </p>

            <h3>How NS Auth Uses WebAuthn</h3>
            <ul>
              <li>Creates passkeys during registration using platform authenticators</li>
              <li>Uses PRF extension to derive Nostr keys from WebAuthn credentials</li>
              <li>Authenticates users via biometric verification</li>
              <li>Stores credentials securely on the device (no server-side storage)</li>
            </ul>

            <div className="protocol-links">
              <strong>Learn More:</strong>{' '}
              <a href="https://webauthn.guide" target="_blank" rel="noopener noreferrer">
                webauthn.guide
              </a>
              {' | '}
              <a href="https://www.w3.org/TR/webauthn-2/" target="_blank" rel="noopener noreferrer">
                W3C Specification
              </a>
              {' | '}
              <a href="https://passkeys.dev" target="_blank" rel="noopener noreferrer">
                passkeys.dev
              </a>
            </div>
          </div>
        </section>

        <section className="protocol-section">
          <h2>ZKPassport</h2>
          <div className="protocol-content">
            <h3>Overview</h3>
            <p>
              <strong>ZKPassport</strong> is a privacy-preserving identity verification protocol that uses
              zero-knowledge proofs to verify identity attributes without revealing sensitive personal
              information. It allows users to prove claims about their identity (like age or nationality)
              without disclosing the underlying data.
            </p>

            <h3>Key Concepts</h3>
            <ul>
              <li>
                <strong>Zero-Knowledge Proofs:</strong> Cryptographic proofs that allow you to prove you know
                something without revealing what you know
              </li>
              <li>
                <strong>Selective Disclosure:</strong> Users can choose which attributes to disclose and which
                to keep private
              </li>
              <li>
                <strong>Verifiable Credentials:</strong> Digital credentials issued by trusted authorities
                (like governments) that can be verified cryptographically
              </li>
              <li>
                <strong>Privacy-Preserving:</strong> Only the minimum necessary information is shared
              </li>
            </ul>

            <h3>Verification Types</h3>
            <ul>
              <li>
                <strong>Age Verification:</strong> Proves that a user is over a certain age (e.g., 18+) without
                revealing their exact birthdate
              </li>
              <li>
                <strong>KYC Verification:</strong> Know Your Customer verification that discloses basic identity
                attributes (name, nationality) for compliance purposes
              </li>
              <li>
                <strong>Personhood Verification:</strong> Proves that a user is a real person from a specific
                country without revealing other personal details
              </li>
            </ul>

            <h3>How NS Auth Uses ZKPassport</h3>
            <ul>
              <li>Requests verification proofs from users</li>
              <li>Stores verification proofs as Nostr events (Kind 30001)</li>
              <li>Enables privacy-preserving identity verification</li>
              <li>Allows users to prove claims without revealing sensitive data</li>
            </ul>

            <div className="protocol-links">
              <strong>Learn More:</strong>{' '}
              <a href="https://zkpassport.id" target="_blank" rel="noopener noreferrer">
                zkpassport.id
              </a>
            </div>
          </div>
        </section>

        <section className="protocol-section">
          <h2>How It All Works Together</h2>
          <div className="protocol-content">
            <div className="diagram-container">
              <svg
                viewBox="0 0 900 600"
                className="architecture-diagram"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* User */}
                <rect x="50" y="50" width="120" height="80" rx="8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
                <text x="110" y="85" textAnchor="middle" fontSize="16" fontWeight="600" fill="#0c4a6e">User</text>
                <text x="110" y="105" textAnchor="middle" fontSize="12" fill="#075985">Browser</text>

                {/* WebAuthn/Passkey */}
                <rect x="250" y="30" width="140" height="100" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                <text x="320" y="60" textAnchor="middle" fontSize="14" fontWeight="600" fill="#92400e">WebAuthn</text>
                <text x="320" y="80" textAnchor="middle" fontSize="12" fill="#78350f">Passkey</text>
                <text x="320" y="100" textAnchor="middle" fontSize="11" fill="#78350f">PRF Extension</text>
                <text x="320" y="115" textAnchor="middle" fontSize="11" fill="#78350f">Biometric Auth</text>

                {/* Nostr Key */}
                <rect x="450" y="50" width="120" height="80" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                <text x="510" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1e3a8a">Nostr</text>
                <text x="510" y="95" textAnchor="middle" fontSize="12" fill="#1e40af">Key Pair</text>
                <text x="510" y="110" textAnchor="middle" fontSize="11" fill="#1e40af">(Derived)</text>

                {/* Nostr Relays */}
                <rect x="650" y="30" width="140" height="100" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
                <text x="720" y="60" textAnchor="middle" fontSize="14" fontWeight="600" fill="#312e81">Nostr</text>
                <text x="720" y="80" textAnchor="middle" fontSize="12" fill="#3730a3">Relays</text>
                <text x="720" y="100" textAnchor="middle" fontSize="11" fill="#4338ca">Kind 0, 3, 30001</text>

                {/* ZKPassport */}
                <rect x="250" y="200" width="140" height="100" rx="8" fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
                <text x="320" y="230" textAnchor="middle" fontSize="14" fontWeight="600" fill="#831843">ZKPassport</text>
                <text x="320" y="250" textAnchor="middle" fontSize="12" fill="#9f1239">Zero-Knowledge</text>
                <text x="320" y="270" textAnchor="middle" fontSize="11" fill="#9f1239">Proofs</text>
                <text x="320" y="285" textAnchor="middle" fontSize="11" fill="#9f1239">Verification</text>

                {/* Arrows - Registration Flow */}
                <path d="M 170 90 L 250 80" stroke="#0284c7" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="210" y="75" textAnchor="middle" fontSize="10" fill="#0284c7">1. Create</text>
                <text x="210" y="88" textAnchor="middle" fontSize="10" fill="#0284c7">Passkey</text>

                <path d="M 390 80 L 450 90" stroke="#2563eb" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="420" y="75" textAnchor="middle" fontSize="10" fill="#2563eb">2. Derive</text>
                <text x="420" y="88" textAnchor="middle" fontSize="10" fill="#2563eb">Keys</text>

                <path d="M 570 90 L 650 80" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="610" y="75" textAnchor="middle" fontSize="10" fill="#6366f1">3. Publish</text>
                <text x="610" y="88" textAnchor="middle" fontSize="10" fill="#6366f1">Profile</text>

                {/* Arrows - Authentication Flow */}
                <path d="M 110 130 L 110 200 L 250 250" stroke="#d97706" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4,4" />
                <text x="130" y="200" textAnchor="middle" fontSize="10" fill="#d97706">Auth</text>

                <path d="M 390 250 L 450 240" stroke="#2563eb" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4,4" />
                <text x="420" y="245" textAnchor="middle" fontSize="10" fill="#2563eb">Derive</text>

                {/* Arrows - Verification Flow */}
                <path d="M 170 90 L 170 200 L 250 250" stroke="#be185d" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="190" y="200" textAnchor="middle" fontSize="10" fill="#be185d">Verify</text>

                <path d="M 390 250 L 450 240 L 450 300" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="420" y="270" textAnchor="middle" fontSize="10" fill="#6366f1">Publish</text>
                <text x="420" y="283" textAnchor="middle" fontSize="10" fill="#6366f1">Proof</text>

                <path d="M 570 300 L 650 280" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <text x="610" y="285" textAnchor="middle" fontSize="10" fill="#6366f1">Store</text>

                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#333" />
                  </marker>
                </defs>

                {/* Flow Labels */}
                <rect x="50" y="350" width="800" height="200" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
                <text x="450" y="375" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1a1a1a">System Architecture</text>

                {/* Registration Flow Box */}
                <rect x="80" y="390" width="220" height="140" rx="6" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                <text x="190" y="410" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0284c7">Registration Flow</text>
                <text x="90" y="430" fontSize="11" fill="#555">1. User creates passkey</text>
                <text x="90" y="445" fontSize="11" fill="#555">2. PRF derives Nostr keys</text>
                <text x="90" y="460" fontSize="11" fill="#555">3. Profile → Relays</text>
                <text x="90" y="475" fontSize="11" fill="#555">(Kind 0 event)</text>
                <text x="90" y="495" fontSize="11" fill="#555">4. Identity created</text>
                <text x="90" y="510" fontSize="11" fill="#555">on Nostr network</text>

                {/* Authentication Flow Box */}
                <rect x="340" y="390" width="220" height="140" rx="6" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                <text x="450" y="410" textAnchor="middle" fontSize="13" fontWeight="600" fill="#d97706">Authentication Flow</text>
                <text x="350" y="430" fontSize="11" fill="#555">1. User authenticates</text>
                <text x="350" y="445" fontSize="11" fill="#555">with biometric</text>
                <text x="350" y="460" fontSize="11" fill="#555">2. PRF derives same</text>
                <text x="350" y="475" fontSize="11" fill="#555">Nostr keys</text>
                <text x="350" y="495" fontSize="11" fill="#555">3. Access granted</text>
                <text x="350" y="510" fontSize="11" fill="#555">to Nostr identity</text>

                {/* Verification Flow Box */}
                <rect x="600" y="390" width="220" height="140" rx="6" fill="#ffffff" stroke="#be185d" strokeWidth="1.5" />
                <text x="710" y="410" textAnchor="middle" fontSize="13" fontWeight="600" fill="#be185d">Verification Flow</text>
                <text x="610" y="430" fontSize="11" fill="#555">1. Request verification</text>
                <text x="610" y="445" fontSize="11" fill="#555">2. ZKPassport proof</text>
                <text x="610" y="460" fontSize="11" fill="#555">3. Publish proof</text>
                <text x="610" y="475" fontSize="11" fill="#555">to Relays</text>
                <text x="610" y="495" fontSize="11" fill="#555">4. Proof stored</text>
                <text x="610" y="510" fontSize="11" fill="#555">(Kind 30001 event)</text>
              </svg>
            </div>

            <h3>Registration Flow</h3>
            <ol>
              <li>User initiates registration</li>
              <li>WebAuthn creates a passkey using platform authenticator (Touch ID/Face ID)</li>
              <li>PRF extension derives a Nostr key pair from the WebAuthn credential</li>
              <li>Nostr public key becomes the user's identity</li>
              <li>User profile is published to Nostr relays as a Kind 0 event</li>
            </ol>

            <h3>Authentication Flow</h3>
            <ol>
              <li>User initiates login</li>
              <li>WebAuthn authenticates using biometric verification</li>
              <li>PRF extension derives the same Nostr key pair</li>
              <li>User is authenticated and can access their Nostr identity</li>
            </ol>

            <h3>Verification Flow</h3>
            <ol>
              <li>User requests identity verification (age, KYC, or personhood)</li>
              <li>ZKPassport SDK generates a verification request</li>
              <li>User completes verification with their passport/ID</li>
              <li>ZKPassport generates a zero-knowledge proof</li>
              <li>Verification proof is published to Nostr as a Kind 30001 event</li>
              <li>Other users can verify the proof without seeing personal data</li>
            </ol>

            <h3>Benefits of This Architecture</h3>
            <ul>
              <li>
                <strong>Decentralized:</strong> No single point of failure, works across different applications
              </li>
              <li>
                <strong>Secure:</strong> Phishing-resistant authentication with cryptographic guarantees
              </li>
              <li>
                <strong>Privacy-Preserving:</strong> Users control their data and can prove claims without
                revealing sensitive information
              </li>
              <li>
                <strong>User-Friendly:</strong> Biometric authentication makes it easy to use
              </li>
              <li>
                <strong>Interoperable:</strong> Works with any Nostr-compatible application
              </li>
            </ul>
          </div>
        </section>

        <section className="protocol-section">
          <h2>Technical Stack</h2>
          <div className="protocol-content">
            <h3>Libraries & SDKs</h3>
            <ul>
              <li>
                <strong>nosskey-sdk:</strong> WebAuthn/Passkey integration with Nostr key derivation
              </li>
              <li>
                <strong>rx-nostr:</strong> Reactive Nostr client for communicating with relays
              </li>
              <li>
                <strong>@zkpassport/sdk:</strong> ZKPassport SDK for privacy-preserving verification
              </li>
              <li>
                <strong>react-force-graph:</strong> Graph visualization library for relationship networks
              </li>
            </ul>

            <h3>Browser Compatibility</h3>
            <p>
              WebAuthn PRF extension support is required for key derivation:
            </p>
            <ul>
              <li>Chrome 118+</li>
              <li>Safari 17+ (macOS 14.0+, iOS 17+)</li>
              <li>Firefox: Limited PRF support</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

