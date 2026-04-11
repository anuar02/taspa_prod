# TASPA Project Plan

Status legend:
- `[x]` Done
- `[ ]` Not done yet
- `[-]` In progress

## Architecture decisions

- **Web first, Android via Capacitor** — the Next.js app is the source of truth. Android is built by wrapping it with Capacitor (`output: 'export'` in next.config.ts). No React Native rewrite needed.
- **Desktop layout** — Pinterest/Instagram-style: fixed left sidebar on `lg+`, bottom nav on mobile only, wide masonry grid, photo detail as side-by-side split view.

## Phase 1. Foundation

- [x] Create monorepo workspace structure
- [x] Add root workspace scripts and env examples
- [x] Create Express API app structure
- [x] Create Next.js web app structure
- [x] Add MongoDB models
- [x] Add auth routes and JWT middleware
- [x] Add photo, comment, user, and search API routes
- [x] Add Cloudinary and Socket.io services
- [x] Add main frontend routes and shared components
- [x] Install dependencies and pass production builds

## Phase 2. Core User Flows

- [x] Make upload page work end to end
- [x] Wire feed photo like/save actions
- [x] Make saved photos page reflect live actions
- [x] Load and create comments on photo detail page
- [x] Wire follow/unfollow on profile page
- [x] Improve auth flow behavior and frontend error handling

## Phase 3. Discovery and Profile

- [x] Add search mode switching: photo | user | tag
- [x] Add trending tags section
- [x] Improve category previews on search page
- [x] Add saved/posts tab behavior on profile page
- [x] Add profile empty states

## Phase 4. Realtime and Polish

- [x] Connect frontend Socket.io client
- [x] Show live notifications/like updates in UI
- [x] Add loading, empty, and error states across screens
- [x] Add optimistic UI where it improves feel (like/save/follow already optimistic)
- [x] Tighten mobile UX and navigation polish (BottomNav + SideNav profile link uses real username)

## Phase 5. Bug fixes and UX (completed 2026-04-11)

- [x] Auth session restored on page refresh — `SocketBridge` calls `/api/auth/me` on mount using localStorage token
- [x] Auth guard on main routes — `AuthGuard` wraps main layout, redirects to `/login` if no token
- [x] Feed infinite scroll error handling — `try/catch/finally` so loading never freezes
- [x] Feed scroll to top on tab change
- [x] Photo detail like button — functional with optimistic update
- [x] Photo detail share button — uses Web Share API with clipboard fallback
- [x] Comment submit button disabled when text is empty
- [x] Follow/Unfollow button text changed to Kazakh: "Жазылу" / "Жазылдым"
- [x] Profile nav link fallback changed from `/profile/demo` → `/login`

## Phase 6. Desktop Web Layout (completed 2026-04-11)

- [x] Add `SideNav` — fixed left sidebar (240px) with logo, nav items, user profile; desktop only (`lg+`)
- [x] Update `MainLayout` — remove `max-w-md` cap, shift content right of sidebar on desktop (`lg:ml-56`), max content width `max-w-6xl`
- [x] `BottomNav` — hidden on desktop (`lg:hidden`), shown only on mobile
- [x] `PhotoGrid` — 2 cols mobile → 3 tablet → 4 desktop (`xl:columns-4`)
- [x] `PhotoCard` — fix `sizes` attribute for wider viewports
- [x] `PhotoDetail` — side-by-side layout on desktop: image fills left, right panel has author info + actions + caption + comments
- [x] `CommentSection` — moved into right panel of photo detail (passes as `aside` prop)

## Phase 6. Android via Capacitor

- [ ] Set `output: 'export'` in `apps/web/next.config.ts`
- [ ] Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- [ ] Run `npx cap init` and `npx cap add android`
- [ ] Configure `capacitor.config.ts` with correct `webDir`
- [ ] Build static export and sync: `npm run build && npx cap sync`
- [ ] Open in Android Studio and test on emulator
- [ ] Handle deep links and back-button behavior for Android

## Phase 7. Data and Launch Readiness

- [x] Add seed/demo data script
- [ ] Verify app startup instructions end to end
- [ ] Replace placeholder JWT secrets with real secrets
- [ ] Final QA pass on register/login/upload/feed/profile/search across mobile and desktop
- [ ] Deployment checklist for web (Vercel) and API (Railway/Render)
- [ ] Add `output: 'export'` behind an env flag so Vercel deploy keeps SSR, Capacitor build uses static
