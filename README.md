# NS Auth

Network States are formed of individuals: Trust is delegated to the collective reputation of a group rather than to a single institution. By anchoring every interaction to a signed, versioned member-list, the network‑state can:

    Eliminate duplicated onboarding – A member only needs to obtain one credential to unlock a wide array of physical and digital services.
    Enforce dynamic policy – Changes to membership status propagate instantly, allowing rapid response to misconduct or to grant new privileges.
    Preserve privacy – Zero‑knowledge proofs hide the underlying personal identifiers while still proving eligibility.
    Scale across jurisdictions – Because the verification relies on cryptographic signatures rather than national IDs, the same system works for stateless persons, diaspora communities, and emerging micronations alike.

In practice, these capabilities turn the abstract notion of a “network‑state” into a tangible infrastructure that powers everyday activities—working, learning, traveling, exercising, and governing—while respecting the autonomy and privacy of every participant.

Together these pieces create a trust fabric:

Issuance – A member’s passport hash is bound to a zero‑knowledge proof and stored on the self-sovereign membership-card.
Certification – The network‑state operator adds the member’s public key to the signed member-list, indicating that the group vouches for the holder.
Authentication – When accessing a service, the holder presents a passkey‑derived proof that they are listed on the latest member-list. The service verifies the signature on the member-list and grants access without ever seeing the passport hash.


2.  Trust Flow

Individual issues – Creates a self-sovereign membership-card containing a cryptographic commitment from their passport.
Member joins, Operator certifies – After vetting, the operator signs the member’s public key into the member-list (kind 3). The member-list is versioned and distributed via a relay network.
Validator checks – A service (validator) pulls the latest member-list, verifies the operator’s signature, and confirms the holder’s key appears.
SSO session – The holder’s device decrypts the private key using the passkey keychain, proving “I am a key that can sign events.”

Because the member-list is signed, any tampering is instantly detectable. Because the self-sovereign membership-card is self‑custodial, the holder can revoke or rotate it without involving the operator; the operator simply removes the old key from the next member-list version.

3.  Core Properties

The system is built around a set of guiding principles that together create a trustworthy, user‑centric fabric for network‑state interactions.

First and foremost, privacy is baked into every layer. Rather than exposing a person’s passport details, the holder supplies a zero‑knowledge proof that demonstrates possession of a valid credential without revealing the underlying data. Validators only ever see the fact that the holder’s public key appears on the latest signed member-list, keeping personal identifiers hidden.

Second, the design embraces self‑sovereignty. All cryptographic keys live on the individual’s device, stored in secure hardware enclaves or encrypted backups that the user controls. No central database retains personal identifiers, and the holder can rotate or revoke their keys at any time without needing permission from any external party.

Third, accountability is ensured through the member-list’s digital signature. The network‑state operator (or a council of operators) signs each version of the member-list, making the group collectively responsible for every listed member. If a member behaves improperly, the operator can simply remove the corresponding key from the next member-list version, instantly revoking the member’s access across all services that rely on the member-list.

Fourth, interoperability is a natural outcome of the signed member-list model. Any service that trusts the operator’s public key can verify the member-list and grant access without bespoke integrations. This means a single proof of membership works seamlessly across physical gates, digital platforms, and any future extensions the ecosystem may adopt.

Fifth, revocability is straightforward and rapid. Updating the member-list to omit a misbehaving member’s key is a lightweight operation; once the new member-list propagates, all downstream validators will reject any further authentication attempts from that key. Likewise, a member who wishes to rotate keys can submit a fresh public key, which the operator incorporates into the next member-list version, retiring the old key without disruption.

Finally, resilience is achieved by distributing the member-list across many nodes in a peer‑to‑peer fashion. Because verification depends only on the operator’s signature and the presence of a key in the member-list, the loss or compromise of any single node does not affect the ability of validators to confirm membership. The system therefore remains functional even under adverse network conditions or targeted attacks.

4.  Interaction Patterns
4.1  On‑boarding a New Member

Application – The individual submits a passport hash and a zero‑knowledge proof to the operator.
Review – The operator’s governance body (e.g., multi‑sig council) evaluates the submission.
Member-list Update – Upon approval, the operator signs a new member-list version that includes the member’s public key.
Card Delivery – The member’s app stores the self-sovereign membership-card locally; the card can be exported as a QR code for offline use.

4.2  Accessing a Physical Facility

The holder scans a QR code at the door.
The facility’s reader fetches the latest member-list, verifies the operator’s signature, and checks that the holder’s key is listed.
The holder’s device signs a one‑time event with its passkey; the reader validates the token and unlocks the gate.

4.3  Using a Digital Service

The user logs in with their passkey‑derived keychain.
The service queries the member-list, confirms the user’s key is present, and issues a JWT‑like session token.
The user can now consume the service; the service never learns the underlying passport hash.

4.4  Revocation & Rotation
If a member breaches the group’s code of conduct:

The operator publishes a new member-list omitting the member’s key.
All services that periodically refresh the member-list will instantly deny further access.


5.  Governance of the Member-list

Multi‑signature control – A threshold of operators must sign each member-list version, preventing unilateral changes.
Transparency – Every member-list version is publicly readable; any stakeholder can audit additions and removals.
Dispute resolution – Operators may attach a signed rationale to a removal entry, enabling external review without exposing personal data.


6.  Benefits for Network‑State Ecosystems

Portable trust – A single self-sovereign membership-card works across all participating states, eliminating duplicate identity checks.
Scalable onboarding – New groups can join the federation simply by trusting the existing operator’s signature hierarchy.
Reduced friction – Passkey‑based SSO removes passwords and repeated credential presentations, improving user experience.
Legal resilience – Because the system does not rely on any nation‑state identifier, it remains functional even when members lack government‑issued documents.

7.  Use-Cases

7.1. Physical‑Access Services
Gym or Sports‑Club Membership – A member walks into a partner gym, scans a QR code on the turnstile, and the gate checks the latest member-list for the holder’s public key. If the key appears, the system automatically validates that the member’s “good‑standing” badge is current and unlocks the door. No paper card, no separate membership number, and no need for the gym to maintain its own database; the gym simply trusts the network‑state’s signature.

Co‑Working Spaces & Makerspaces – Access to desks, 3‑D printers, or workshop tools is mediated by the same token. The space can enforce additional constraints—e.g., “only members with a ‘trusted‑member’ badge may use high‑value equipment”—by checking the attribute attached to the key in the member-list. When a member’s status changes (e.g., a provisional badge is upgraded), the next member-list version instantly reflects the new permissions.

Transportation & Shared Mobility – A bike‑share dock, a shuttle bus, or a ferry can verify a rider’s eligibility in seconds. The rider’s device presents a short‑lived passkey proof that it is listed on the member-list; the vehicle’s onboard reader validates the proof and opens the lock or records the ride. Because the proof is zero‑knowledge, the carrier never learns the rider’s underlying passport hash, preserving privacy while still guaranteeing that the rider belongs to a trusted community.

7.2. Digital‑Service Access

Online Learning Platforms & Presentation Rooms – A student enrolls in a course hosted by a partner university. When the student logs in, the platform reads the member-list, sees the “student‑badge” attached to the key, and grants access to lecture videos, assignments, and live webinars. If the student later earns a “graduated” badge, the platform can automatically unlock alumni resources without any manual admin work.

Content Subscription & Media Libraries – Streaming services, research journals, or art galleries can restrict premium content to members who hold a “contributor” or “patron” badge. Because the verification happens via a signed member-list, the service does not need to store personal email addresses or payment histories; the network‑state’s reputation system already guarantees that the holder has satisfied the required contribution thresholds.

Developer APIs & Cloud Resources – A decentralized compute marketplace can allow only members with a “verified‑developer” badge to spin up nodes. The API gateway checks the member-list, validates the badge, and issues a temporary API token. If the developer’s badge is revoked (e.g., due to policy violation), the next member-list update instantly blocks further provisioning.

7.3. Community & Governance

Participatory Decision‑Making – Voting on a community budget, a policy amendment, or a strategic partnership is performed through a smart‑contract that reads the member-list to determine eligibility. Each eligible key can cast a weighted vote based on the badge type (full member versus provisional). Because the member-list is signed by the governing council, the contract can trust the list without needing an external identity provider.

Reputation‑Based Moderation – Forums or chat rooms can automatically mute or flag contributions from members lacking a “good‑standing” badge. Conversely, members with a “trusted‑moderator” badge gain the ability to resolve disputes. The moderation logic simply queries the member-list, ensuring that reputation is enforced consistently across all community platforms.

Event Organization & Invitation – Organizers of a conference, hackathon, or cultural festival can publish a QR‑coded invitation that only members with a “event‑invite” badge can redeem. The check‑in desk validates the badge against the member-list, granting entry and automatically recording attendance for future reputation calculations.

7.4. Financial & Token‑Based Interactions

Work‑Based Token Payments – A freelance developer contracts with a DAO that pays in a native utility token. The DAO’s payroll smart‑contract reads the member-list to confirm that the worker holds a “contractor‑approved” badge before releasing the token. If the contractor’s badge is later revoked (e.g., for breach of NDA), the next payroll cycle automatically withholds payment.

Micro‑Lending & Credit Scoring – A community‑run lending pool can issue loans only to members with a “credit‑worthy” badge, which is granted after a transparent set of on‑chain activity checks (payment history, collateral). The loan contract references the member-list to enforce eligibility, eliminating the need for a centralized credit bureau.

Token‑Gated Marketplace – Sellers list goods that are purchasable exclusively with a community token. Buyers must present a passkey proof that they are listed on the member-list with a “token‑holder” badge. The marketplace escrow automatically releases funds once the member-list confirms the buyer’s status, reducing fraud and simplifying KYC compliance.

7.5. Identity‑Sensitive Situations

Medical or Emergency Services – A health clinic serving stateless refugees can verify a patient’s “medical‑access” badge without ever seeing the underlying passport hash. The clinic’s system checks the member-list, confirms the patient is a recognized member of a humanitarian network‑state, and proceeds with treatment. If the patient’s status changes (e.g., they are granted emergency‑care priority), the member-list update instantly propagates to all participating clinics.

Legal Aid & Consular Assistance – Lawyers or diplomatic representatives can confirm a client’s “legal‑aid” badge before providing counsel, ensuring that assistance is reserved for members who have been vetted by the network‑state’s justice council. The verification is privacy‑preserving, protecting the client’s identity from unnecessary exposure.

Secure Voting in Political Assemblies – When a network‑state holds a referendum, each voter presents a zero‑knowledge proof derived from their passkey that they appear on the member-list with a “voter‑eligible” badge. The ballot box validates the proof, records the vote, and discards any trace of the voter’s personal identifier, satisfying both security and anonymity requirements.


8.  Outlook

The combination of a self‑custodial self-sovereign membership-card, a signed membership member-list, and passkey‑driven single‑sign‑on forms a minimal yet powerful trust layer for any collection of autonomous communities. By keeping the design abstract—focusing on cryptographic guarantees rather than specific standards—it can evolve alongside emerging privacy‑preserving primitives while preserving the core promise: members are recognized, groups are accountable, and services can trust without invasive data collection.

## Features

- **Registration**: Create a new account using WebAuthn passkey technology
- **Login**: Authenticate using biometric authentication or security keys
- **Profile Management**: Set up and edit your Nostr profile (Kind 0 events)
- **Relationship Graph**: Visualize your Web of Trust through follow relationships (Kind 3 events)

## Prerequisites

- Node.js >= 22
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Ensure the `nosskey-sdk` package is built:
```bash
cd ../nosskey-sdk
npm run build
cd ../nsauth-web
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Browser Compatibility

WebAuthn PRF extension support is required:
- Chrome 118+
- Safari 17+ (macOS 14.0+, iOS 17+)
- Firefox: Limited PRF support

## Project Structure

```
src/
├── components/
│   ├── auth/          # Registration and login components
│   ├── graph/         # Relationship graph visualization
│   ├── layout/        # Header and layout components
│   └── profile/       # Profile management
├── hooks/             # React hooks
├── services/          # Business logic services
├── store/             # State management (Zustand)
└── types/             # TypeScript type definitions
```

## Usage

1. **Register**: Click "Register" to create a new account using WebAuthn
2. **Profile Setup**: After registration, set up your profile with name, bio, and picture
3. **View Graph**: Navigate to the Graph page to see your relationship network
4. **Login**: Use the Login button to authenticate with your existing passkey

## Technologies

- React 18
- Vite
- TypeScript
- Zustand (state management)
- react-force-graph (graph visualization)
- rx-nostr (Nostr relay communication)
- nosskey-sdk (WebAuthn/Passkey integration)

## License

MIT

