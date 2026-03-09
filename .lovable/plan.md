

## Color & Background Overhaul Plan

### What changes

**1. Replace all theme colors in `src/index.css`**

Swap amber/indigo palette to Emerald Green + Black + White:

- **Primary accent**: `#2ECC71` → HSL `145 63% 49%` (emerald green)
- **Secondary accent**: Slightly shifted emerald → `160 63% 40%` (teal-emerald for variety)
- **Dark mode background**: `#000000` → `0 0% 0%` (pure black)
- **Dark mode surfaces/cards**: `0 0% 4%` and `0 0% 7%`
- **Light mode background**: `#FFFFFF` → `0 0% 100%` (pure white)
- **Light mode surfaces**: `0 0% 98%`
- Update ring, sidebar, glass variables accordingly
- Muted foreground stays neutral gray for readability

**2. Replace static backgrounds with immersive animated system in `src/index.css`**

Remove `.dot-grid` and `.gradient-mesh`. Create new CSS classes:

- **Dark mode** (`.bg-immersive-dark`): Animated gradient blobs (emerald + teal at low opacity) that slowly drift using CSS `@keyframes`. Subtle noise texture overlay via SVG data URI. Section-specific accent shifts using CSS custom properties.
- **Light mode** (`.bg-immersive-light`): Soft moving gradient mesh with emerald/teal blobs. Clean, bright feel with gentle motion.
- Both use `animation` on `background-position` for smooth, continuous motion (20-30s cycle).

**3. Section-specific accent shifting**

Add CSS utility classes like `.section-hero`, `.section-features`, `.section-listings` that subtly shift the gradient hue via different positioned radial gradients. Apply these in `Index.tsx` per section.

**4. Update `Layout.tsx`**

Replace `dot-grid`/`gradient-mesh` with the new immersive background classes.

**5. Update `tailwind.config.ts`**

Add the animated background keyframes (`gradient-drift`) to the Tailwind config.

**6. Update component accent references**

- `Navbar.tsx`: "Bridge" span uses `text-primary` (already correct, just color changes)
- `SkillTag.tsx`: Uses `secondary` — will now be teal-emerald
- `StatusBadge.tsx`: Keep as-is (uses semantic colors)
- `Footer.tsx`, `Index.tsx`, all pages: Already use `text-primary`/`text-secondary` — automatic via CSS variable change

### Files to edit
- `src/index.css` — full color variable swap + new animated background CSS
- `tailwind.config.ts` — add gradient-drift keyframe/animation
- `src/components/Layout.tsx` — swap background class names
- `src/pages/Index.tsx` — add section-specific classes to each `<section>`

