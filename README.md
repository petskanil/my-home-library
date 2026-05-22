# Home Library

A personal home-library app: catalogue books you own, track read/unread status, and keep a wishlist. Data syncs via Supabase across the **web** (Next.js) and **iPhone** (Expo) apps.

## Structure

```
home-library/
├── apps/web/          # Next.js web app
├── apps/mobile/       # Expo (iOS) app
├── packages/shared/   # Zod schemas & helpers
├── packages/api/      # Supabase client & book CRUD
└── supabase/migrations/
```

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- A [Supabase](https://supabase.com) project
- For iOS: Xcode and iOS Simulator (or Expo Go)

## 1. Supabase setup

1. Create a new Supabase project.
2. In **SQL Editor**, run the migration file:
   [`supabase/migrations/20250522000000_books.sql`](supabase/migrations/20250522000000_books.sql)
3. Under **Authentication → Providers**, enable **Email** (password sign-in).
4. Copy your **Project URL** and **anon public** key from **Settings → API**.

### Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 **Web application** client.
2. Add **Authorized redirect URIs**:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback` (from Supabase → Authentication → Providers → Google)
   - `http://localhost:3000/auth/callback` (local web)
   - `home-library://auth/callback` (mobile app)
   - If using Expo Go during dev, also add the redirect shown in the Metro logs when you tap “Continue with Google” (often `exp://…/--/auth/callback`)
3. In Supabase → **Authentication → Providers → Google**, enable Google and paste the **Client ID** and **Client Secret**.
4. Under **Authentication → URL Configuration**, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `home-library://auth/callback`
   - Your production web URL + `/auth/callback` when you deploy

## 2. Environment variables

Copy root [`.env.example`](.env.example) and fill in your Supabase values:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Use the same URL and anon key in all three files (web uses `NEXT_PUBLIC_*`, mobile uses `EXPO_PUBLIC_*`).

## 3. Install & run

From the repo root:

```bash
pnpm install
```

**Web:**

```bash
pnpm --filter @home-library/web dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with email/password on first visit.

**Mobile (iOS):**

```bash
pnpm --filter @home-library/mobile ios
```

Or start the dev server and scan with Expo Go:

```bash
pnpm --filter @home-library/mobile start
```

## Features

| Feature | Web | Mobile |
|---------|-----|--------|
| Sign in / sign up (email) | Yes | Yes |
| Sign in with Google | Yes | Yes |
| Overview stats | Yes | Yes |
| Owned library + read filters | Yes | Yes |
| Wishlist | Yes | Yes |
| Add / edit / delete books | Yes | Yes |
| Move wishlist → library | Yes | Yes |
| Quick read-status toggle | Yes | Yes |
| ISBN lookup (Norwegian-focused) | Yes | Yes |
| ISBN barcode scanner | — | Yes (iPhone) |

## ISBN lookup

When adding a book, enter an ISBN and tap **Look up**. Sources (in order):

1. **[Nasjonalbiblioteket](https://api.nb.no)** — Norwegian National Library catalog (titles, authors, cover images when digitized)
2. **[BIBSYS / Norbok](https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK)** — Norwegian national bibliography (strong coverage for published Norwegian books)
3. **[Open Library](https://openlibrary.org)** — fallback for foreign ISBNs

No API keys required. Works on web (via `/api/isbn/…`) and mobile (direct lookup).

### Barcode scanner (iPhone)

On **Add book**, tap **Scan barcode** and point the camera at the ISBN/EAN barcode on the back cover. The app reads the code, looks up metadata automatically, and fills the form.

Requires a physical device or simulator with camera support (Expo Go works). After adding `expo-camera`, rebuild or restart the dev client if the camera does not open.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode (Turbo) |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Typecheck all workspaces |

## Deploy

- **Web:** Deploy `apps/web` to [Vercel](https://vercel.com). Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **iOS:** Use [EAS Build](https://docs.expo.dev/build/introduction/) from `apps/mobile` when ready for TestFlight.

## License

Private / personal use.
