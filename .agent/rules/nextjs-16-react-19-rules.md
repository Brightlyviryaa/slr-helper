---
trigger: always_on
---

# LLM CODING RULES (STRICT) — Next.js 16.0.10 + React 19.2.1

You are a coding assistant for this repository. Follow these rules exactly.

## 0) Scope & change discipline
- MUST keep changes minimal and localized; do not refactor unrelated code.
- MUST preserve existing project conventions (folders, naming, patterns) unless explicitly asked to change them.
- MUST NOT add new dependencies without explicit approval.
- MUST ensure TypeScript types stay correct; update types with implementation.
- MUST write code that builds and runs (no placeholders unless requested).

## 1) React component principles
- MUST keep render functions pure (no side effects during render).
- MUST keep state minimal; derive computed values instead of duplicating state.
- MUST avoid unstable list keys; do not use array index as a key unless list is static and never reorders.
- MUST isolate heavy client state to leaf Client Components; keep parent components Server Components when possible.
- SHOULD prefer composition over prop drilling; if using context, keep providers narrowly scoped.

## 2) React 19.2 specifics
- MAY use <Activity /> to hide UI while preserving state when state preservation is required (avoid unmount/remount patterns).  
- MUST use useEffectEvent only for effect-triggered “event-like” logic; MUST NOT use it to bypass dependency rules.
- MUST use Suspense boundaries intentionally for async UI/streaming and to prevent global blocking.

## 3) Next.js rendering model (App Router)
- MUST default to Server Components.
- MUST add `"use client"` only when required (event handlers, browser-only APIs, client state, certain libraries).
- MUST keep Client Components small and leaf-level; move fetching/authorization/aggregation to Server Components.
- MUST pass only serializable props from Server → Client.
- MUST use route conventions when appropriate: `loading.tsx`, `error.tsx`, `not-found.tsx`.

## 4) Cache Components + `use cache` (if enabled)
- MUST treat prerendering constraints as strict:
  - If a component accesses runtime/request data (cookies/headers/params/searchParams), it MUST be behind <Suspense>.
  - If data can be cached and does not require request context, it SHOULD be moved into a `use cache` scope.
- MUST place Suspense boundaries as close as possible to the dynamic subtree.
- MUST NOT read cookies/headers/searchParams inside `use cache`; read outside and pass as arguments.
- If `use cache` is used at file level, all exports MUST be async.
- MUST ensure cached function arguments and return values are serializable; do not pass class instances, Symbols, or non-serializable objects.
- MUST NOT introspect non-serializable pass-through props (e.g., `children`) inside cached code; pass-through only.

## 5) Data fetching & mutations
- MUST fetch on the server by default (Server Components / Route Handlers / Server Actions).
- MUST perform mutations on the server (prefer Server Actions where appropriate).
- MUST validate and authorize inside the server boundary (Route Handler / Server Action), not in the client.
- MUST handle failures explicitly; do not leak secrets/internal errors to the client.

## 6) Routing & navigation
- MUST use <Link /> for internal navigation between Next.js routes.
- MUST use plain <a> for external URLs (and set `rel="noopener noreferrer"` when `target="_blank"`).
- MUST NOT assume Link prefetch behavior in development; validate prefetch behavior in production builds.
- SHOULD avoid navigation hacks; use App Router APIs (`next/navigation`) when programmatic navigation is needed.
- MUST keep “active link” logic in a Client Component (e.g., using `usePathname()`), not by stringifying server state.

## 7) Images & static assets
- MUST use `next/image` for user-facing images unless there is a strong reason not to.
- MUST always provide `alt`.
- MUST size images correctly (static import OR width/height OR `fill` with properly styled parent).
- MUST configure allowed remote image domains/patterns in Next config when using remote images.
- SHOULD mark the page’s LCP image as `priority`.
- SHOULD provide `sizes` for responsive images (especially when using `fill`).

## 8) Fonts
- MUST use `next/font` for optimized font loading and self-hosting.
- SHOULD use variable fonts when available.
- SHOULD set `display: 'swap'` unless there is a specific UX reason not to.
- MUST avoid loading the same font in multiple places; define fonts once and reuse exports.
- SHOULD keep the number of fonts minimal to reduce client download cost.

## 9) Third-party scripts
- MUST use `next/script` for third-party scripts (avoid manual <script> tags in components).
- MUST choose the correct loading strategy:
  - `beforeInteractive` ONLY for truly critical scripts needed globally.
  - `afterInteractive` for scripts needed soon but not before hydration.
  - `lazyOnload` for low-priority/background scripts.
- MUST keep script callbacks (onLoad/onReady/onError) in Client Components only.

## 10) SEO & metadata
- MUST use Metadata API (`metadata` export or `generateMetadata`) instead of ad-hoc head manipulation.
- MUST ensure metadata generation does not accidentally depend on request-only data unless explicitly intended.
- SHOULD provide correct Open Graph/Twitter metadata for shareable pages.

## 11) Security & privacy
- MUST keep secrets server-only (env vars, tokens, private keys).
- MUST treat all user input as untrusted; validate and sanitize on the server.
- MUST avoid logging sensitive data (tokens, cookies, PII).
- MUST implement authorization checks server-side for every protected action/data source.

## 12) Performance & UX
- MUST avoid unnecessary client bundles; prefer Server Components and server-side data aggregation.
- SHOULD split dynamic/slow content into isolated Suspense boundaries with meaningful fallbacks.
- SHOULD avoid global spinners; prefer route-level `loading.tsx` and localized fallbacks.
- MUST avoid non-determinism during prerender unless explicitly deferred to request time.

## 12.1) Hydration safety (SSR/RSC)
- MUST ensure server-rendered HTML matches the client’s initial render for any hydrated subtree; avoid non-deterministic output in render. 
- MUST NOT use variable inputs during render in Client Components that are SSR’d (e.g., `Date.now()`, `Math.random()`, locale-dependent formatting) unless the value is computed on the server and passed as a prop. 
- MUST NOT branch render output on `typeof window !== 'undefined'` or other server/client checks; this commonly creates mismatches. 
- MUST NOT read browser-only APIs (`window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `matchMedia`) during render; if needed, read them inside `useEffect` and render a stable fallback until mounted. 
- MUST keep initial state consistent between server and client; if state depends on client-only data, initialize with a server-safe default and update it in `useEffect`.
- When using SSR-unfriendly third-party UI libraries (DOM mutation, direct window access), MUST isolate them:
  - Prefer wrapping them in a Client Component, and if necessary disable SSR for that component using `dynamic(..., { ssr: false })`. 
- MUST use `suppressHydrationWarning` only for truly unavoidable, localized text mismatches (e.g., timestamps), and only on the smallest possible element; MUST NOT use it to hide real bugs.
- MUST avoid invalid HTML nesting and unstable markup structure between server and client (tag structure must match exactly). 
- SHOULD prefer server-computed formatting (e.g., preformatted strings) for locale/time-dependent UI; otherwise defer formatting to after mount.


## 13) Deliverable format (when producing an answer)
- MUST list file paths to change/create.
- MUST output final code for each changed file.
- MUST include any required migration notes (only if necessary).
- MUST NOT include hidden reasoning.

