---
name: STITCH DSTRKT
description: High-performance urban body architecture and modular cyber-wear.
colors:
  primary: "#ffffff"
  on-primary: "#111111"
  neutral-bg: "#0a0a0a"
  neutral-surface: "#111111"
  neutral-surface-dim: "#121414"
  neutral-surface-bright: "#383939"
  neutral-surface-container-low: "#1b1c1c"
  neutral-surface-container: "#1f2020"
  neutral-surface-container-high: "#292a2a"
  on-surface: "#e3e2e2"
  on-surface-variant: "#c4c7c8"
  outline: "rgba(255, 255, 255, 0.1)"
  outline-active: "rgba(255, 255, 255, 0.4)"
typography:
  display:
    fontFamily: "Sora, Georgia, serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Sora, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.2em"
    textTransform: "uppercase"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.on-surface-variant}"
    textColor: "{colors.neutral-bg}"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: STITCH DSTRKT

## 1. Overview

**Creative North Star: "The Tactical Blueprint"**

The STITCH DSTRKT design system is structured as a technical, high-performance tactical interface. It prioritizes structure, utility, and precision over decorative styling. The aesthetic simulates schematic architectural drawings and tactical military readouts: featuring sharp borders, structural grids, monospaced-style annotations, and explicit mechanical alignments.

This design system deliberately rejects friendly, soft consumer curves, neon "cyberpunk" clichés, and organic warm gradients. The interface is cold, disciplined, and optimized for data density and typographic clarity.

**Key Characteristics:**
- **Brutalist Sharpness**: Every single interface container, button, and input has a zero-radius (0px) sharp corner to emphasize industrial build quality.
- **Structural Blueprint Mesh**: A subtle geometric background grid overlay defines the canvas, giving the user a literal space and layout coordinate system.
- **Tactical Utility Details**: The interface displays structural metadata—system coordinates, ping pulses, localized labels, and monospaced identifiers.

---

## 2. Colors

The color palette is strictly high-contrast, industrial monochrome.

### Primary
- **Active White** (#ffffff / oklch(100% 0 0)): Used for core interactive states, primary text emphasis, and highlighted technical boundaries.

### Neutral
- **Stealth Black** (#0a0a0a): The default viewport background. Pure dark, representing negative space.
- **Deep Steel Surface** (#111111): The primary container and panel color, creating subtle geometric layered volumes.
- **Tactical Outlines** (rgba(255, 255, 255, 0.1)): Subtle white strokes representing blueprint schematic lines.
- **Tactical Outlines Active** (rgba(255, 255, 255, 0.4)): Elevated stroke highlighting focused inputs or active options.

**The monochrome restraint rule.** Saturated colors are strictly forbidden for decorative accents. Color is exclusively used to communicate real status (e.g., green for positive API/network synchronization, red for system errors, amber for pending states).

---

## 3. Typography

**Display Font:** Sora (with Georgia, serif fallback)  
**Body Font:** Geist (with ui-sans-serif, system-ui, sans-serif fallback)  
**Label/Mono Font:** Geist Mono (with monospace fallback)

**Character:** Bold Display Sora headers emphasize structure with tight tracking and flat geometric heights, paired with highly legible, modern sans-serif Geist body text.

### Hierarchy
- **Display** (800, clamp(2.5rem, 7vw, 4.5rem), 1): Bold, heavy headers used exclusively for hero titles.
- **Headline** (700, 1.75rem, 1.2): Strong section titles with tight -0.02em tracking.
- **Title** (600, 1.25rem, 1.3): Subtle container headings.
- **Body** (400, 14px, 1.6): Standard user prose and details. Restricted to 65–75ch for readable line wrapping.
- **Label** (600, 11px, 0.2em, uppercase): Monospaced-style metadata tags, navigation items, and state indicator badges.

---

## 4. Elevation

The interface rejects drop shadows entirely. Depth is achieved purely through **Tonal Grid Layering**.

- **Level 0 (Negative Space)**: Viewport background (#0a0a0a) featuring the blueprint geometric mesh background overlay.
- **Level 1 (Structural Panels)**: Deep Steel Surface (#111111) with a solid 1px Tactical Outline (rgba(255, 255, 255, 0.1)) to frame content blocks.
- **Level 2 (Active/Hover Cards)**: Subtle container hover shifts using Surface Bright (#383939) or active outline overrides.

**The Shadow Proscription Rule.** Drop shadows are completely prohibited. Depth is structural, not ambient. We do not fake lighting; we define explicit solid geometry.

---

## 5. Components

### Buttons
- **Shape:** Strict 0px border-radius (border-radius: 0px !important).
- **Primary:** Solid Active White background (#ffffff) with Stealth Black text (#111111). Standard padding of 12px 24px.
- **Hover / Focus:** Background shifts to On-Surface-Variant (#c4c7c8) or white-on-white text outline with zero transitions.
- **Technical Border Button:** Transparent background with 1px Tactical Outline and white monospaced uppercase labels.

### Cards / Containers
- **Corner Style:** Hard sharp corners (0px).
- **Background:** Deep Steel Surface (#111111) or Surface Container Low (#1b1c1c).
- **Border:** Strict solid 1px border using rgba(255, 255, 255, 0.1).
- **Internal Padding:** 16px (sm), 24px (md), or 32px (lg).

### Inputs / Fields
- **Style:** 1px solid Tactical Outline with an dark, un-rounded background.
- **Focus:** Border escalates to Active Outline (rgba(255, 255, 255, 0.4)).

### Navigation
- **Header:** Fixed height (h-20) background block with high-blur (backdrop-blur-xl) trans-lucid backing (#0a0a0a/80) and bottom border.
- **Links**: Micro-uppercase labels with explicit tracking, using simple solid bottom borders to define the current route.

---

## 6. Do's and Don'ts

### Do:
- **Do** force sharp corners (`border-radius: 0px !important`) on all active UI blocks, cards, badges, and modals.
- **Do** align components strictly to the 40px x 40px layout grid established by the background mesh.
- **Do** frame sections with fine, 1px solid tactical outlines instead of box shadows or color blocks.
- **Do** use uppercase mono-labels for utility information (such as coordinates, system status, active keys).

### Don't:
- **Don't** use any rounded corners (`border-radius > 0px`), even subtle 2px or 4px radii.
- **Don't** use ambient drop shadows (`box-shadow`) to create floating cards or containers.
- **Don't** use saturated background-clip text gradients or SaaS-style "cream" background layouts.
- **Don't** animate image scale, rotation, or translation on hover. Keep images stable, modifying outer container outlines or background colors instead.
- **Don't** introduce generic, illustrative icons or decorative accent borders (e.g., colored side-stripe borders).
