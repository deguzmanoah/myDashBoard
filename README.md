# Admin Dashboard (Next.js)

This project is an admin dashboard built with Next.js, TypeScript, Tailwind CSS, and ESLint.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) — install via `npm install -g pnpm`

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then open `.env.local` and fill in the required values:
   - `THIRD_PARTY_API_ROOT_URL` — Root URL for the backend API
   - `THIRD_PARTY_API_WEB_URL` — Web URL for the backend API
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key (requires Maps JavaScript API, Places API, and Geocoding API enabled in Google Cloud Console).
   - `ENABLE_DEV_LOGIN_BYPASS` — Set to `true` to bypass login in development only. **Never enable in production.**

3. **Run the development server:**
   ```bash
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Other Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |

---

## Changesets (Versioning & Changelog)

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and the `CHANGELOG.md`.

### Workflow

#### 1. Add a changeset (when you make a change worth documenting)

```bash
pnpm changeset
```

This will prompt you to:
- Choose a **bump type**: `patch` (bug fixes), `minor` (new features), or `major` (breaking changes)
- Write a **summary** of the change

A new markdown file is created in `.changeset/`. Commit it along with your code changes.

#### 2. Apply changesets to bump the version

When you're ready to release, run:

```bash
pnpm changeset version
```

This will:
- Consume all pending `.changeset/` files
- Bump the version in `package.json` according to the highest bump type
- Update `CHANGELOG.md` with the collected summaries

Commit the resulting changes.

#### 3. Verify the build (optional but recommended)

```bash
pnpm build
```

### Bump Type Reference

| Type | When to use | Example |
|---|---|---|
| `patch` | Bug fixes, minor copy/style changes | Fix pagination bug |
| `minor` | New features, non-breaking additions | Add version log feature |
| `major` | Breaking changes | Redesign API contract |
