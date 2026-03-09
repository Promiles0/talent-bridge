

## Color & Background Overhaul: Amber/Teal + Immersive Backgrounds

### 1. Full CSS Variable Swap (`src/index.css`)

**Light mode ("Clean Studio"):**
- Primary: `34 90% 44%` (warm amber/gold)
- Secondary: `174 84% 29%` (teal/cyan)
- Background: `36 23% 95%` (warm paper-white)
- Foreground: `30 10% 9%` (deep brown-black)
- Card: `0 0% 100%` (pure white)
- Muted: `30 15% 90%`, Border: `30 18% 88%`
- Glass: 60% white opacity, warm-toned borders

**Dark mode ("Terminal Noir"):**
- Primary: `36 90% 55%` (brighter amber for glow)
- Secondary: `168 76% 50%` (desaturated teal)
- Background: `0 0% 5%` (near-black)
- Foreground: `30 18% 93%` (warm off-white)
- Card: `240 4% 9%` (blue-tinted near-black)
- Glass: 4% white opacity, 6% borders

### 2. Immersive Background System (`src/index.css`)

Replace existing `.bg-immersive-dark` and `.bg-immersive-light`:

- **Floating gradient blobs**: Three radial gradients (amber, teal, purple) at 3-4% opacity with `gradient-drift` animation
- **Noise overlay**: Keep existing SVG turbulence but adjust opacity (2.5% light, 4% dark) via theme-aware CSS
- **Section-specific ambient patterns** via `::before` pseudo-elements:
  - `.section-hero` — radial vignette (amber + teal)
  - `.section-features` — faint circuit-board grid pattern
  - `.section-listings` — subtle grid overlay
  - `.section-students` — geometric dot pattern

### 3. Create `BackgroundEffects.tsx` Component

A floating gradient blob component with three animated divs:
- Amber blob (left), Teal blob (right), Purple blob (center)
- CSS keyframe animations for gentle drift + scale pulsing
- Parallax scroll effect via a lightweight scroll listener
- Render once in `Layout.tsx` behind all content

### 4. Update Layout & Section Classes

- `Layout.tsx`: Add `BackgroundEffects` component, keep theme-aware background class
- `Index.tsx`: Section classes already in place, update ambient pattern styles
- Noise overlay opacity adjusts per theme via `.dark .noise-overlay::before`

### 5. Files to Edit

| File | Change |
|------|--------|
| `src/index.css` | Full variable swap + new immersive backgrounds + section patterns |
| `src/components/BackgroundEffects.tsx` | New — floating gradient blobs with parallax |
| `src/components/Layout.tsx` | Add BackgroundEffects, update background classes |
| `tailwind.config.ts` | Update animation keyframes if needed |

No changes needed to Navbar, Footer, or other components — they already use `text-primary`/`text-secondary` which will automatically pick up the new colors.

