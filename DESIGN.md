# Design System: TASPA

## 1. Visual Theme & Atmosphere

An editorial, gallery-airy photo network — like a premium Kazakh photography magazine
brought to life as a social app. Clean spatial discipline with confident asymmetric
layouts. Warm, parchment-toned surfaces instead of clinical pure white. Photography
is the hero; UI chrome recedes to serve the image.

- **Density:** 5 — balanced breathing room, photos need air
- **Variance:** 6 — asymmetric grids, offset compositions, not sterile
- **Motion:** 5 — spring-physics feedback on interactions, no cinematic excess

---

## 2. Color Palette & Roles

- **Parchment Canvas** (`#F8F7F4`) — Primary background. Warm white, not sterile.
- **Pure Surface** (`#FFFFFF`) — Cards, modals, input fills
- **Warm Charcoal** (`#1C1917`) — Primary text. Stone-950 warmth, never pure black.
- **Slate Mist** (`#78716C`) — Secondary text, metadata, placeholders
- **Whisper Border** (`#E7E5E4`) — Card edges, dividers, 1px structural lines
- **Deep Violet** (`#5B21B6`) — Single accent. CTAs, active states, focus rings. Saturated but not neon.
- **Soft Violet** (`#8B5CF6`) — Hover states, tags, secondary accent applications
- **Danger Ember** (`#DC2626`) — Error states only

**Banned:** Pure white backgrounds for full pages (`#FFFFFF` → use `#F8F7F4`).
Pure black text (`#000000` → use `#1C1917`). Neon glows. Oversaturated gradients.

---

## 3. Typography Rules

- **Display / Headlines:** `Outfit` — geometric, warm, modern. Track-tight on large sizes.
  Weight hierarchy: 700 for display, 600 for section titles, 500 for labels
- **Body / UI Text:** `Outfit` — consistent family, 400 weight, 1.6 line-height
- **Mono (optional):** `JetBrains Mono` — timestamps, counts, metadata when density demands
- **Scale:** `clamp()` on headlines. Body minimum `14px`. Never below.
- **Line length:** Max `65ch` on body paragraphs
- **Banned:** `Inter` — banned for this creative/social context. Generic system fonts.
  All-caps headings at display size. Gradient text on large headers.

---

## 4. Component Stylings

**Buttons**
- Primary: `bg-accent` fill, `rounded-xl` (12px), no shadow glow, tactile `-1px translateY` on active
- Secondary: transparent fill, `1px border-border`, same radius
- Ghost: text-only, no border
- Height: `44px` minimum tap target on all screen sizes
- No rounded-full pill buttons (too generic) except navigation elements

**Cards / Photo Cards**
- `rounded-2xl` (16px). Diffused warm shadow: `0 4px 24px rgba(28,25,23,0.08)`
- No border on cards — use shadow for elevation only
- Photo fills card completely, metadata below in tight compact row
- On hover (desktop): subtle lift `translateY(-2px)` with shadow deepening

**Inputs / Forms**
- Label above input, always. No floating labels.
- `rounded-xl`, `bg-white`, `1px solid #E7E5E4`, focus ring in `Deep Violet` at 20% opacity
- Error text below field in `Danger Ember`, never inline
- Height: `48px` for comfortable touch targets

**Navigation — Sidebar (desktop)**
- White background, `1px border-right whisper border`
- Active item: `bg-violet-50` fill + `Deep Violet` text + `3px left border-accent`
- No icon-only mode — always show labels on desktop
- User profile at bottom with avatar initial

**Navigation — Bottom Nav (mobile)**
- Floating pill, `bg-white/90 backdrop-blur`, `1px border whisper`
- Active: accent color only — no background fill on nav items
- `48px` minimum height

**Photo Grid / Masonry**
- Gap: `12px` on mobile, `16px` on desktop
- Break-inside-avoid on cards
- 2 cols mobile → 3 tablet → 4 desktop

**Empty States**
- Never just text. Small icon + headline + subtext + optional CTA button
- Icon: outline style, `32px`, `Slate Mist` color

**Skeleton Loaders**
- Match exact layout dimensions of the content they replace
- Animated shimmer: `from-whisper-border to-parchment-canvas`
- No circular spinners

---

## 5. Layout Principles

- CSS Grid for page structure, Flexbox for row/column component internals only
- Max content width: `1200px` centered
- Desktop: fixed `224px` sidebar + fluid content area
- Section padding: `clamp(1.5rem, 4vw, 3rem)` horizontal
- No `calc()` percentage hacks
- No absolute-positioned stacking — every element has its own spatial zone
- `min-h-[100dvh]` never `h-screen` (iOS Safari fix)
- Auth pages: 45/55 split — brand left, form right on desktop. Full form on mobile.

---

## 6. Motion & Interaction

- Spring physics: `stiffness: 120, damping: 20` — slightly snappy, premium feel
- Like button: heart fill animation on click, brief scale pulse (`scale(1.2) → scale(1)`)
- Page transitions: opacity fade `150ms ease-out` — no slide chaos
- Card hover: `translateY(-2px)` + shadow deepen, `200ms ease-out`
- Skeleton loaders: shimmer `1.5s ease-in-out infinite`
- Staggered photo grid load: cascade delay `50ms` per item
- `transform` and `opacity` only — never animate layout properties

---

## 7. Anti-Patterns (Banned)

- No `Inter` font — use `Outfit`
- No pure black `#000000` — use `#1C1917`
- No pure white page backgrounds `#FFFFFF` — use `#F8F7F4`
- No neon glow shadows or outer glow on buttons
- No rounded-full pill buttons (except floating mobile nav)
- No 3-equal-column feature grids — use 2-col zig-zag or asymmetric
- No centered hero layouts (variance > 4 — use split or left-aligned)
- No generic AI copy ("Seamless", "Elevate", "Next-Gen", "Unleash")
- No emojis in UI text or empty states
- No fake metrics, uptime percentages, or invented statistics
- No circular loading spinners
- No overlapping elements — clean spatial separation always
- No `h-screen` — use `min-h-[100dvh]`
- No gradient text on large display headings
- No color-only error states — always pair with text
