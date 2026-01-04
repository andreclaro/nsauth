# NS Auth Demo Website

A React + Vite demo website showcasing NS authentication functionality using the `nosskey-sdk` package. This application demonstrates registration, login, profile management, and relationship graph visualization using the Nostr protocol and WebAuthn.

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

