
## Darker Background Plan

### Changes to `src/index.css`

**Light Mode ("Clean Studio"):**
- Background: `36 23% 95%` → `36 20% 90%` (from 95% to 90% lightness — more cream/tan)
- Card: Keep `0 0% 100%` for contrast against darker background
- Sidebar background: `36 20% 97%` → `36 18% 92%`

**Dark Mode ("Terminal Noir"):**
- Background: `0 0% 5%` → `0 0% 2%` (near pure black)
- Card: `240 4% 9%` → `240 4% 6%` (darker cards)
- Sidebar background: `240 4% 6%` → `240 4% 4%`
- Muted: `240 4% 15%` → `240 4% 10%`
- Accent: `240 4% 12%` → `240 4% 8%`

**Immersive backgrounds:**
- Update `.bg-immersive-light` base color to match darker warm tone
- Update `.bg-immersive-dark` base color to near-black (2% lightness)

### Files to edit
- `src/index.css` — darken background variables and immersive background base colors
