# OneDrive Vercel Index Phase 1 Modernization Design

**Date:** 2026-04-03

## Goal

Deliver a modernized Phase 1 version of the project on the current stable web stack without preserving the legacy Pages Router implementation. The first phase should establish a new, maintainable core on Vercel that covers the main product loop: OAuth setup, Redis-backed token storage, directory browsing, file preview, search, and download.

## Scope

Phase 1 is a modernization MVP, not a 1:1 migration of the existing UI and code structure.

Included in Phase 1:

- Next.js App Router migration
- Route Handlers replacing `pages/api/*`
- React 19 baseline
- Tailwind CSS 4 baseline
- TypeScript-based typed configuration
- OneDrive OAuth initialization and token refresh
- Redis/Upstash token storage
- Directory browsing, pagination, breadcrumb navigation
- Mainstream file preview support
- Search
- Raw file access and download flows
- Basic internationalization

Explicitly deferred to Phase 2:

- Pixel-perfect reproduction of the legacy Pages Router UI
- Long-tail preview compatibility work
- Advanced UI polish, animation, and theming work
- Non-core or high-maintenance legacy behavior that does not support the core product loop

## Deployment And Runtime Constraints

This project must run on Vercel. Local execution is not a reliable acceptance environment for this repository.

That changes the delivery contract:

- Vercel Preview or Production is the only trusted runtime for end-to-end validation
- Local work is still useful for static analysis, unit tests, route-level tests, and build verification
- Final functional acceptance must happen through user-performed manual verification on deployed Vercel previews

## Target Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript 5
- Node.js 20.9+ or 22 LTS
- Vercel deployment target
- Redis/Upstash for token persistence
- Microsoft Graph API for OneDrive access

## Why This Direction

The existing repository is based on an older stack centered on Next.js 13 Pages Router, `next-i18next`, and a set of legacy client-side integrations. A direct in-place dependency bump would keep the old architecture alive while still forcing compatibility work. That would create double work: first stabilizing the old structure, then replacing it later.

Phase 1 therefore optimizes for long-term maintainability rather than short-term code preservation. The new implementation should rebuild the core product loop on a modern baseline, using the legacy code only as a behavior reference.

## Architecture Overview

The new implementation should use a server-first model:

- App pages should prefer Server Components for data loading
- Client Components should be limited to interaction-heavy surfaces
- OneDrive access, Redis access, and configuration loading should stay on the server
- Public-facing API endpoints should be implemented through Route Handlers

This reduces unnecessary client-side state, keeps credentials and infrastructure logic server-side, and aligns the codebase with the modern Next.js execution model.

## Proposed Module Structure

### `src/app`

Contains App Router entry points:

- layouts
- page routes
- loading and error boundaries
- Route Handlers

### `src/features/auth`

Contains domain logic for:

- OAuth step flow
- token exchange
- token refresh
- protected route access logic

### `src/features/drive`

Contains domain logic for:

- folder listing
- file metadata loading
- path resolution
- breadcrumb generation
- pagination
- search integration

### `src/features/preview`

Contains:

- preview type resolution
- preview renderer selection
- per-format preview implementations

### `src/lib`

Contains infrastructure code:

- Graph API client
- Redis client
- typed config loading
- schema validation
- i18n setup
- shared utilities

### `src/components`

Contains reusable UI components only. Business logic should not be coupled into shared presentation components unless there is a strong reason.

### `src/config`

Contains typed configuration modules that progressively replace the current JavaScript config files.

## Routing Model

The application should be organized around three route categories:

### Page Routes

- directory browsing routes
- file detail routes
- OAuth setup routes

### Data Routes

- directory data
- search
- thumbnail proxying
- raw file access

### System Routes

- health or diagnostics endpoints
- compatibility redirects where needed

## Data Flow

### Server-First Rendering

Directory pages, file pages, and OAuth pages should load data on the server wherever practical. This keeps Microsoft Graph access and token-dependent logic out of the browser and reduces duplicated fetching logic.

### Client-Only Interactions

Client-side code should be reserved for:

- dialogs
- media controls
- copy-to-clipboard interactions
- local sorting or filtering
- similar interaction-heavy behaviors

## Runtime Boundaries

Phase 1 should default to the Node.js runtime on Vercel for all operationally important endpoints.

Use Node runtime for:

- OAuth flows
- Redis interactions
- Graph API requests
- compression and archive generation
- any route that depends on Node APIs or richer debugging support

Edge compatibility is not a Phase 1 goal. Any future Edge adoption should be selective and justified by concrete latency or caching gains.

## Caching Strategy

Caching should be explicit by data type instead of being handled through scattered static header strings.

- Directory listings and file metadata: short-lived cache with revalidation
- OAuth and token operations: always dynamic
- Search: dynamic by default
- Thumbnail and raw file routes: evaluate on a route-by-route basis, preserving correctness over aggressiveness

## Internationalization

The current `next-i18next` setup should not be carried forward into the new App Router design.

Phase 1 should:

- keep basic multi-language support
- use `i18next` and `react-i18next` with thin server/client integration
- preserve translation files where practical
- avoid large custom i18n abstractions until the new route structure stabilizes

## Dependency Strategy

Phase 1 should actively remove or replace dependencies that are coupled to the legacy architecture or provide poor value on the new stack.

Expected removals or replacements include:

- `next-i18next`
- `nextjs-progressbar`
- legacy or heavy preview/interaction libraries that are not required for the core loop

Where a preview dependency is critical and already working, it may be retained temporarily if replacing it would meaningfully delay the migration.

## Error Handling

Errors should become explicit product states rather than leaking as generic page failures.

Phase 1 should distinguish at least:

- missing or invalid configuration
- OAuth/authentication failure
- insufficient permission from Microsoft Graph
- missing file or directory
- upstream rate limiting
- Redis unavailability
- unsupported preview type

Unsupported previews should degrade to download or raw access flows instead of breaking the page.

## Testing And Verification Strategy

Because Vercel is the only trusted runtime for end-to-end validation, the test strategy must be split.

### Local Verification

Local verification should cover what can be trusted outside the deployment environment:

- static type checks
- linting
- unit tests for path parsing, config parsing, preview detection, and response adaptation
- route-level or module-level tests that mock Graph and Redis interactions
- build verification where possible

### Deployed Verification

Functional acceptance should happen against Vercel Preview deployments and be performed manually by the user.

Each milestone should include a regression checklist covering:

- OAuth initialization
- token persistence
- directory browsing
- breadcrumb navigation
- pagination
- file preview
- search
- raw file access or download

## Phase 1 Acceptance Criteria

Phase 1 is complete when all of the following are true on a deployed Vercel preview:

- OAuth setup completes successfully
- tokens are persisted and refreshed correctly through Redis/Upstash
- the application can browse shared directories and nested folders
- file pages render for the supported core preview types
- search returns usable results and navigation works
- download or raw file access works for supported files
- at least one primary language is complete and the i18n mechanism supports extension

## Non-Goals

Phase 1 does not attempt to:

- preserve the existing code structure
- guarantee identical visual output to the old application
- fully migrate every preview edge case
- make local end-to-end execution the primary validation path

## Recommended Implementation Approach

Use a modernization-first migration:

1. establish the new stack and typed configuration
2. rebuild the server-side auth and drive access layer
3. reintroduce the core browse/search/preview flows on App Router
4. validate each milestone through Vercel preview deployments
5. defer legacy parity work until the new baseline is stable

## References

- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Tailwind CSS v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- next-i18next repository guidance: https://github.com/i18next/next-i18next
- React versions: https://react.dev/versions
