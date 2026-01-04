# Migration to Next.js - Complete ✅

This project has been successfully migrated from Vite + React Router to Next.js.

## Key Changes

### 1. Project Structure
- **Old**: `src/main.tsx` with React Router
- **New**: `app/` directory with Next.js App Router
- Pages are now in `app/[route]/page.tsx` format

### 2. Routing
- **Old**: `react-router-dom` with `<Route>` components
- **New**: File-based routing in `app/` directory
- Navigation: `useNavigate()` → `useRouter()` from `next/navigation`
- Links: `<Link to="...">` → `<Link href="...">` from `next/link`

### 3. Client Components
- All components using hooks, state, or browser APIs now have `'use client'` directive
- Server components are used by default in Next.js

### 4. API Routes
- New API routes in `app/api/verification/`:
  - `POST /api/verification/callback` - Receives verification results from ZKPassport app
  - `GET /api/verification/result/[sessionId]` - Polls for verification results

### 5. ZKPassport Integration
- Updated to support cross-device verification (laptop ↔ phone)
- Uses backend API routes for callback handling
- Implements polling mechanism for verification results
- Session-based verification flow

### 6. Configuration
- `package.json`: Updated scripts and dependencies
- `tsconfig.json`: Next.js TypeScript configuration
- `next.config.js`: Webpack configuration for Node.js modules
- `.env.local`: Environment variables (create from `.env.local.example`)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set `NEXT_PUBLIC_BACKEND_URL` if needed (defaults to current origin)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Testing ZKPassport Verification

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/verify-only-demo`
3. Click a verification button (Age/KYC/Personhood)
4. Scan the QR code with ZKPassport app on your phone
5. Complete verification on phone
6. The web app will poll for results and display them

## Notes

- The verification results are stored in-memory (Map). For production, use Redis or a database.
- The polling mechanism checks every second for up to 5 minutes.
- Both POST and GET endpoints are supported for callbacks (for flexibility).

