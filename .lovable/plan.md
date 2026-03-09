
# Enhanced Background Layers System Plan

## Current State Analysis
✅ **Already Implemented:**
- Global Animated Blobs (BackgroundEffects.tsx) - 3 gradient spheres with scroll parallax
- Noise Texture - SVG feTurbulence filter overlay (2.5%/4% opacity)
- Section Backgrounds - Hero, Features (circuit-board), Listings, Students (dot pattern)
- Basic Glassmorphism - `.glass-card` class in CSS

## New Features to Add

### 1. Canvas Particle Network System
**New Component:** `src/components/ParticleNetwork.tsx`
- Canvas-based system with 80 particles
- Connecting lines between nearby particles (distance threshold)
- Mouse interaction (particles gravitate toward cursor)
- Theme-responsive colors (amber/teal palette)
- Performance optimized with requestAnimationFrame
- Responsive sizing and particle density

**Technical Approach:**
- HTML5 Canvas with 2D context
- Particle class with position, velocity, color properties  
- Distance-based line drawing algorithm
- Mouse event listeners for interaction
- Theme context integration for color changes

### 2. Additional Section Ambient Backgrounds
**Extend CSS in `src/index.css`:**

**Skills Section:**
```css
.section-skills::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image: 
    linear-gradient(hsl(174 84% 29%) 1px, transparent 1px),
    linear-gradient(90deg, hsl(174 84% 29%) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

**Education Section:**
```css
.section-education::after {
  opacity: 0.04;
  background-image: radial-gradient(hsl(174 84% 29%) 2px, transparent 2px);
  background-size: 24px 24px;
}
```

**Languages Section:**
```css
.section-languages::after {
  opacity: 0.025;
  background-image: 
    linear-gradient(45deg, hsl(34 90% 44%) 1px, transparent 1px),
    linear-gradient(-45deg, hsl(174 84% 29%) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px;
}
```

### 3. Enhanced Glassmorphism Class
**Add to `src/index.css`:**
```css
.glass-card-themed {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--glass-border));
  background: hsla(0, 0%, 100%, 0.6);
  box-shadow: var(--glass-shadow);
}

.dark .glass-card-themed {
  background: hsla(0, 0%, 100%, 0.04);
}
```

### 4. Integration Updates
**Update `src/components/BackgroundEffects.tsx`:**
- Add ParticleNetwork component
- Layer management (particles behind blobs, above noise)

**Update `src/components/Layout.tsx`:**
- Include particle network in background effects

## Implementation Order
1. Create ParticleNetwork component with canvas system
2. Add new section background patterns to CSS
3. Implement .glass-card-themed utility class
4. Integrate particle network into BackgroundEffects
5. Update Layout to include all layers

## Files to Create/Edit
- **New:** `src/components/ParticleNetwork.tsx` (canvas particle system)
- **Edit:** `src/index.css` (new section patterns + glassmorphism class)
- **Edit:** `src/components/BackgroundEffects.tsx` (integrate particle network)

This creates a sophisticated 5-layer background system: particles → noise → blobs → section patterns → glassmorphism cards.
