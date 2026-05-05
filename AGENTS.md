# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

OneDrive Vercel Index is a Next.js application that provides a public directory listing for OneDrive files. It's designed to be deployed on Vercel with Redis (Upstash) for token storage.

## Common Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
pnpm extract    # Extract i18n translation keys
```

## Architecture

### Configuration Files
- `config/site.config.js` - Site customization: title, base directory, protected routes, fonts, footer, social links
- `config/api.config.js` - Microsoft Graph API settings: OAuth client credentials, API endpoints, cache headers

### Authentication Flow
OAuth tokens are managed through three files:
- `src/utils/oAuthHandler.ts` - OAuth URL generation, token exchange, AES obfuscation for tokens
- `src/utils/odAuthTokenStore.ts` - Redis storage for access/refresh tokens via ioredis
- `src/pages/onedrive-vercel-index-oauth/step-{1,2,3}.tsx` - Three-step OAuth setup wizard

Access tokens are stored in Redis with expiry, refresh tokens are persisted indefinitely. Token refresh happens automatically in `src/pages/api/index.ts:getAccessToken()`.

### API Routes (`src/pages/api/`)
- `index.ts` - Main API: folder listing, file metadata, token refresh, protected route auth
- `raw.ts` - Raw file download with CORS support
- `search.ts` - OneDrive search integration
- `thumbnail.ts` - Image/video thumbnail proxy
- `item.ts` - Single item lookup by ID
- `name/[name].ts` - Item lookup by name

### Frontend Structure
- `src/pages/[...path].tsx` - Catch-all route for folder/file navigation
- `src/components/FileListing.tsx` - Core component that determines content type and renders appropriate preview
- `src/components/previews/` - File type previews (Video, Audio, PDF, Office, Code, Markdown, EPUB, Image, etc.)
- `src/components/FolderListLayout.tsx` / `FolderGridLayout.tsx` - Folder view modes

### Data Fetching
- `src/utils/fetchWithSWR.ts` - SWR hooks with protected route support and infinite loading
- Uses `swr` for client-side data fetching with caching

### Protected Routes
Password protection is configured in `site.config.js:protectedRoutes`. Each protected folder requires a `.password` file in OneDrive. Authentication is handled via `od-protected-token` header.

### Internationalization
- Configured in `next-i18next.config.js`
- Translations in `public/locales/{locale}/common.json`
- Supported locales: en, de-DE, es, zh-CN, zh-TW, hi, id, tr-TR

## Environment Variables

Required:
- `REDIS_URL` - Upstash Redis connection URL

Optional:
- `NEXT_PUBLIC_USER_PRINCIPLE_NAME` - Microsoft account email (can also be set in site.config.js)
- `KV_PREFIX` - Prefix for Redis keys (useful for multi-tenant setups)

### Cloudflare Worker Proxy (Optional)
- `NEXT_PUBLIC_CF_PROXY_URL` - Cloudflare Worker URL for accelerating file downloads

## Key Dependencies
- Next.js 13 with Pages Router (not App Router)
- Tailwind CSS for styling
- FontAwesome for icons
- next-i18next for internationalization
- ioredis for Redis connection
- SWR for data fetching
- plyr-react for video player
- react-reader for EPUB
