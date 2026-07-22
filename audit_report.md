# StageLab Architecture & Code Audit Report

**Date:** July 22, 2026  
**Audited File:** `index.html` (5,403 lines, monolithic single-file React client)  
**Target Platform:** Mobile-First Web Application for Musical Theatre Creators  
**Stack:** React 18, Custom Inline Supabase client, Cloudflare Stream, Deno Edge Functions, Raw CSS-in-JS.

---

## 1. Executive Summary

### The Achievement
StageLab is a highly impressive, feature-dense mobile-first social application. Implementing a TikTok-style performance feed, custom audio/video capture with waveform visualizers, dynamic poster generation, Claude-powered AI Studio, casting trackers, live rehearsal rooms, and a comprehensive production schedule system inside a **single HTML file** of 5,400+ lines is an extraordinary feat of engineering. The application layout is beautiful, matches theatrical themes, and exhibits rich interactivity.

### The Challenge
While this "monolith-in-a-file" style was highly effective for rapid prototyping and rapid proof-of-concept deployment, it represents a substantial architectural ceiling. As the user base, team size, and features scale, this structure presents critical liabilities in **security, performance, code maintainability, and operational stability**. 

This audit delivers a deep-dive analysis of StageLab's Frontend and Backend architectures, highlights critical areas of improvement, and offers a concrete, phased roadmap to refactor StageLab into a world-class, production-ready SaaS application.

---

## 2. Frontend Architecture & Maintainability

### 2.1 Monolithic vs. Modular Codebase
* **Issue:** Having all screens, models, components, utility functions, and mock data stored in `index.html` makes the codebase extremely fragile. 
* **Impact:** 
  * **No Concurrent Engineering:** Multiple developers cannot work on different features (e.g., Feed vs. Studio) without encountering catastrophic git merge conflicts.
  * **Poor IDE Performance:** Modern IDE features like autocompletion, type-checking, navigation-to-definition, and refactoring tools degrade or fail on massive single files.
  * **High Cognitive Load:** Finding a specific component or function requires scrolling through thousands of lines of mixed HTML, CSS, and JS logic.
* **Recommendation:** Migrate to a modular React directory structure. Decompose the single file into isolated components, custom hooks, and service layers:
  ```text
  src/
  ├── assets/          # SVG logos, fallback images
  ├── components/      # Reusable UI (Button, Sheet, Modal, SLogo)
  ├── context/         # React Context stores (Auth, Theme)
  ├── hooks/           # Custom React hooks (useAuth, useMediaRecorder)
  ├── services/        # Supabase API client, Cloudflare Stream wrapper
  ├── styles/          # Isolated CSS modules or Tailwind configs
  └── views/           # Screen views (Feed, Create, Discover, Studio, Me)
  ```

### 2.2 Lack of Build & Package Ecosystem
* **Issue:** StageLab currently imports core dependencies (React, ReactDOM) from public CDNs (`https://cdn.jsdelivr.net/npm/...`). There is no local `package.json`, bundler (Vite, Webpack), or transpiler.
* **Impact:**
  * **Supply Chain Risks:** Relying directly on unpinned or third-party CDN URLs exposes the app to downtime or malicious injection if the CDN is compromised.
  * **No Tree Shaking & Optimization:** Production builds cannot benefit from dead-code elimination, image optimization, minification, or modern JS bundling.
  * **No TypeScript Support:** There is no static type safety, which is essential to prevent runtime crashes as complex database interfaces evolve.
* **Recommendation:** Establish a modern frontend build system using **Vite** and **npm** or **pnpm**. Migrate the source code to TypeScript (`.tsx` / `.ts`) to enforce strict type-checking across component boundaries and Supabase queries.

### 2.3 Client-Side Navigation & Routing
* **Issue:** Navigation is managed imperatively via a simple React state: `const [page, setPage] = useState("app");` and active tab states.
* **Impact:**
  * **No Shareable Deep-Links:** Users cannot bookmark a specific scene, audition listing, or a performer's profile. Sharing a link always defaults the recipient back to the main landing/auth page.
  * **Broken Browser History:** Pressing the device's hardware "Back" button exit/reloads the application rather than moving to the previous tab or closing an active modal view.
  * **SEO Neglect:** Search engines cannot crawl individual projects, public profiles, or casting calls, crippling organic growth.
* **Recommendation:** Integrate a professional routing library like **React Router** or use a framework like **Next.js** / **Expo Router** (if targeted for React Native). Utilize hash-based or history-based routes (e.g., `/profile/:id`, `/discover/shows`, `/studio/casting/:callId`).

### 2.4 State Management & Rendering Performance
* **Issue:** High-level state properties (such as current user session, profile cache, and list of videos) are drilled deeply through props or repeatedly requested directly from Supabase REST endpoints inside components.
* **Impact:**
  * **Excessive Rerendering:** A minor state change in a parent component (like a toast notification or active tab switch) triggers a complete rerender of heavy children lists.
  * **Data Desynchronization:** If a profile is updated in the "Me" tab, that updated profile card may remain stale in the "Discover" feed or "Production Member" rows until a hard reload.
* **Recommendation:** Implement a lightweight, fast global state manager like **Zustand** or use **React Query** (TanStack Query) for database state caching. React Query automatically handles:
  * Cache invalidation and background re-fetching.
  * Loading and error states.
  * Request deduplication.

### 2.5 Styling Injection Mechanism
* **Issue:** The styles are declared as a single massive template literal string `const CSS = \` ... \`` and dynamically injected inside several screen renders via `<style> {CSS} </style>`.
* **Impact:**
  * **Layout Thrashing:** Repeatedly inserting `<style>` tags into the DOM during React's render loop forces the browser to reparse CSS and recalculate styles repeatedly, inducing layout lag.
  * **Global Style Pollution:** Styles are injected globally without namespace protection, creating unpredictable visual regressions if two components share class names.
* **Recommendation:** Adopt **Tailwind CSS** or **CSS Modules** configured within a build pipeline. This ensures class compilation into a single, optimized, static `.css` stylesheet linked in the head.

---

## 3. Backend, Integration & Security Audit

### 3.1 Custom Inline Supabase Client
* **Issue:** The app implements a custom inline Supabase HTTP wrapper (`const supabase = (() => { ... })()`).
* **Impact:**
  * **Feature Limitations:** It lacks advanced native capabilities like WebSocket real-time triggers, subscription reconnection management, request retries on spotty mobile networks, and complex PostgREST filters.
  * **Maintenance Overhead:** The development team must write and maintain bespoke custom handlers for basic SQL operations, rather than relying on a battle-tested SDK maintained by the Supabase core team.
* **Recommendation:** Replace the inline custom client with the official `@supabase/supabase-js` SDK client, bundled natively via npm.

### 3.2 Security: Exposure of Secrets & Session Token Storage
* **Issue 1:** The `SUPA_KEY` (anonymous key) is hardcoded in clear text. While this is expected for client-side architectures, any actor can extract it and query public endpoints.
* **Issue 2:** The custom auth token is cached directly in `localStorage` (`sb_token`).
* **Impact:**
  * **Cross-Site Scripting (XSS) Vulnerability:** If a malicious script is executed (e.g., via a profile bio injection or user comment that somehow executes javascript), it can read `localStorage.getItem("sb_token")` and completely hijack the user's account.
* **Recommendation:**
  * Ensure strict Row-Level Security (RLS) is active on every single Supabase database table (explained in section 3.3).
  * Configure session handling to use **Secure, HttpOnly, SameSite=Strict cookies** for auth persistence instead of raw `localStorage`.

### 3.3 Row-Level Security (RLS) Vulnerability Risks
* **Issue:** The client directly executes database queries (e.g., `supabase.from("profiles").update(payload).eq("id", uid)`).
* **Impact:** If RLS is misconfigured or disabled on the Supabase dashboard:
  * Any user can intercept their network calls, copy the `anon` key, and modify *any* profile, delete other creators' video/audio posts, read private inbox messages, or grant themselves fake Silver/Gold subscriptions.
* **Audit Check:** Ensure the following Postgres database rules are applied:
  ```sql
  -- Force all tables to enforce RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

  -- Example: Secure Profile Updates
  CREATE POLICY "Users can only update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
  ```

### 3.4 API Over-fetching & N+1 Queries
* **Issue:** The app has several instances where list items invoke queries sequentially or load entire database models when only simple fields are required.
  * *Example:* In `DiscoverScreen`, queries loop or execute multiple independent `supabase.from(...)` requests to check follow statuses, calculate follower counts, or fetch recent posts.
* **Impact:**
  * **Mobile Performance Drag:** Doing multiple sequential REST calls over cellular connections adds several hundred milliseconds of network latency, resulting in a sluggish user interface.
  * **Database Exhaustion:** A high number of simultaneous users executing multiple parallel REST calls will quickly max out Supabase database connection pools.
* **Recommendation:**
  * Use **SQL Views** or Postgres **Remote Procedure Calls (RPC)** to pull complex dashboard feeds in a single round-trip.
  * Consolidate queries using joint relations (e.g., `supabase.from("posts").select("*, profiles(*), likes(count)")`).

### 3.5 Transactional Integrity (Client-side vs. Database Triggers)
* **Issue:** Operations that modify multiple models are coordinated completely on the client side:
  * *Example:* When a casting application is submitted, the client attempts to insert the application row and subsequently inserts a notification row for the casting director.
* **Impact:** If the user's internet drops immediately after the application insert but before the notification insert, the database is left in a state of partial synchronization (unnotified director).
* **Recommendation:** Shift transactional logic to **Postgres Database Triggers** or **Edge Functions**. Writing an `AFTER INSERT ON casting_applications` trigger in Postgres guarantees a notification row is generated atomicitily within the database itself.

---

## 4. Performance, UX & UI Optimization

### 4.1 TikTok-style Feed: List Virtualization
* **Issue:** The performance feed renders video elements sequentially down the page. As a user swipes through dozens of clips, all video/audio assets remain mounted in the DOM.
* **Impact:**
  * **Memory Exhaustion:** Mobile devices will experience memory leaks, laggy scrolling, and outright browser crashes due to excessive GPU/CPU rendering of raw DOM nodes.
  * **Data Over-consumption:** Background video buffers can consume significant cellular data.
* **Recommendation:** Implement **List Virtualization** using a package like `react-virtual` or `react-window`. This ensures only the active, previous, and next slides are physically mounted in the DOM. All off-screen videos should be completely unmounted or paused and cached.

### 4.2 Large-Screen Responsive Adaptability
* **Issue:** The layout style is strictly mobile-first with hardcoded width structures and locked viewport controls.
* **Impact:** On tablets and desktop monitors, the user experience feels stretched, poorly spaced, and unpolished.
* **Recommendation:** Implement a responsive container layout that centers the mobile UI as an elegant phone mock wrapper on desktop, or expands the navigation into a dedicated sidebar, mirroring the desktop layout of modern social platforms like Instagram or TikTok.

### 4.3 Media File Optimization
* **Issue:** Avatars, cover banners, audio streams, and user photos are loaded directly as raw uploads from Supabase storage without modification.
* **Impact:** Loading a 10MB raw smartphone photo as a tiny 40px circular profile icon slows load times and burns mobile data plans.
* **Recommendation:**
  * Integrate **Supabase Image Transformation** APIs (which automatically resize and transcode images to modern formats like WebP or AVIF on-the-fly).
  * Enforce client-side image compression (via canvas-resize) before triggering uploads.

---

## 5. Operations, QA, and CI/CD

### 5.1 Test Coverage Deficit
* **Issue:** There are currently no tests (Unit, Integration, or E2E) defined in the workspace.
* **Impact:** Code changes are prone to causing visual regressions or silent backend failures, making updates dangerous.
* **Recommendation:** Set up a testing harness:
  * **Vitest / Jest:** For testing core business logic (e.g., inline date parsers, AI Studio text formatters).
  * **React Testing Library:** For verifying interface elements (e.g., modal openings, form inputs).
  * **Playwright / Cypress:** For crucial End-to-End flows like onboarding, casting application submission, and checkout.

### 5.2 Real-time Monitoring & Observability
* **Issue:** The application runs silently without central error capture.
* **Impact:** If a database query fails for a subset of Android users, developers will remain unaware until those users leave negative reviews.
* **Recommendation:** Integrate **Sentry** for real-time JavaScript runtime error tracking, and **PostHog** or **Mixpanel** for user engagement analytics.

---

## 6. Actionable Refactoring Roadmap

To evolve StageLab safely from the prototype codebase to a modular, secure, and production-grade system, follow this structured, phased roadmap:

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Structure & Tooling (Vite + TS + Folder Refactor)  │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Core Infrastructure (Official Supabase + Cookies)   │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Navigation & Global State (React Router + Zustand) │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: UX & Performance (Virtualization + CDN + CI/CD)    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Structure & Tooling
1. **Initialize NPM & Vite:** Run `npm init` and configure a Vite project with TypeScript, React, and Tailwind CSS.
2. **Decompose `index.html`:** Systematically split massive components (`FeedScreen`, `StudioScreen`, `PosterMakerTab`, etc.) into standalone `.tsx` files in a `/components` or `/views` folder.
3. **Move Mock Data:** Extract hardcoded structures (`INIT_VIDEOS`, `INIT_CASTING_CALLS`) to a `/mocks` folder to keep components clean.

### Phase 2: Core Infrastructure
1. **Adopt Official SDK:** Replace the inline custom client with `@supabase/supabase-js`.
2. **Database Audits:** Inspect the Supabase schema, apply proper foreign key constraints, establish compound indices on heavy queries, and enable Row-Level Security on every table.
3. **Secure Auth:** Setup server-side cookie-based auth persistence, and secure standard client secrets.

### Phase 3: Navigation & Global State
1. **Add Router:** Introduce `react-router-dom` to support descriptive URL schemas (`/shows/:zip`, `/studio/scene/:id`).
2. **Setup State Store:** Introduce `Zustand` to manage authentication state, active room listings, and user cache globally.
3. **Integrate React Query:** Switch all database fetch commands to React Query hooks to cache and sync data automatically in the background.

### Phase 4: UX & Performance
1. **Add Virtualization:** Use `react-window` on the Feed component to mount/unmount heavy video files smoothly during scroll sequences.
2. **Optimize Media Deliverability:** Set up HLS transcoding pipelines for video submissions to auto-stream adaptive resolutions, and route image assets through Supabase's image-resizing CDN.
3. **Integrate Monitoring:** Embed Sentry and set up a GitHub Actions workflow to run automatic tests, build validations, and deploy preview versions on commit pushes.
