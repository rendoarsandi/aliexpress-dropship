---
name: DSTRKT
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#303031'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c9c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c9c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  display-2xl:
    fontFamily: Sora
    fontSize: 96px
    fontWeight: '800'
    lineHeight: 90px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-sm-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.2em
spacing:
  unit: 4px
  gutter: 1px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
This design system embodies the intersection of high-end fashion and urban utility. It is rooted in a **Brutalist-Lite** aesthetic—marrying the raw, structural integrity of urban architecture with a refined, minimalist execution. The brand personality is cold, disciplined, and futuristic, designed to appeal to a demographic that values technical precision and understated luxury. 

The visual language relies on stark contrasts, precise geometry, and an "industrial-luxe" atmosphere. It avoids decorative flourishes, instead finding beauty in the structural elements: the grid, the border, and the typeface.

## Colors
The palette is monochromatic and high-contrast, designed to mimic the textures of technical fabrics and nighttime urban environments.

- **Primary (Stark White):** Reserved for core information, massive headlines, and primary actions. It acts as a beacon against the dark canvas.
- **Secondary (Deep Black):** The base of the interface (#0A0A0A), providing a bottomless depth.
- **Tertiary (Dark Charcoal):** Used for structural surfaces, containers, and secondary UI tiers (#111111).
- **Subtle Grays:** Utilized for low-priority metadata and borders to maintain hierarchy without breaking the dark aesthetic.

## Typography
The typography strategy is a play on scale. **Sora** provides a bold, geometric foundation for headlines that command attention, feeling both futuristic and authoritative. For body text and technical details, **Geist** offers a monospaced-adjacent clarity that reinforces the "tech-wear" narrative.

Labels are exclusively set in **Geist** at small sizes with aggressive tracking (0.2em) and uppercase transformation, mimicking industrial spec sheets or garment care tags. For Korean characters, the system defaults to a clean, humanist sans-serif that matches the weight and optical sizing of Geist to ensure a seamless bilingual experience.

## Layout & Spacing
This design system utilizes a **Strict Grid Model** where the grid itself is often made visible through thin, semi-transparent borders. 

- **The Skeleton:** A 12-column grid for desktop and a 4-column grid for mobile.
- **Borders as Spacing:** Instead of traditional white space, elements are separated by 1px rules (`rgba(255, 255, 255, 0.1)`). This creates a "blueprint" feel.
- **Rhythm:** All spacing (padding, margins) must be a multiple of the 4px base unit. 
- **Alignment:** Content is strictly left-aligned. Large Display type may occasionally bleed into the margins to emphasize the brutalist influence.

## Elevation & Depth
Depth is not communicated through shadows in this design system. Instead, it uses **Tonal Layering** and **Line Work**.

1.  **Level 0 (Base):** Deep Black (#0A0A0A) for the main background.
2.  **Level 1 (Surface):** Dark Charcoal (#111111) for cards and modular sections.
3.  **Outlines:** Hierarchy is defined by 1px solid borders. Hover states are indicated by increasing the border opacity from 10% to 40%, or by filling the element with Stark White and inverting the text to Deep Black.
4.  **Glassmorphism:** Subtle use of background blurs (32px+) is permitted for navigation overlays to maintain a sense of environmental depth without sacrificing the "sleek" technical feel.

## Shapes
The shape language is **Sharp (0px)**. There are no rounded corners in the design system. This reinforces the architectural, brutalist-lite aesthetic and ensures that every element feels like a precision-cut component.

Buttons, input fields, and images must maintain hard 90-degree angles. This rejection of "softness" is key to the brand's premium, uncompromising identity.

## Components

- **Buttons:** Primary buttons are solid Stark White with Deep Black text (Sora, Bold, Caps). Secondary buttons are transparent with a 1px white border (10% opacity) and Stark White text.
- **Input Fields:** Minimalist underlines or 1px bordered boxes. Labels always sit above the field in `label-sm-caps`. Placeholder text is a muted gray (#444444).
- **Cards:** Defined by their 1px border. No shadows. Content within cards follows the strict 4px padding rule.
- **Chips/Tags:** Small rectangular boxes with 1px borders. Text is always `label-sm-caps`.
- **Lists:** Separated by 1px horizontal rules that span the full width of the container. 
- **Technical Specs (Custom Component):** A specialized data display format using Geist, showing small-scale technical data (e.g., "SKU: 099-DSTRKT") in the corners of image containers or headers to lean into the garment-utility theme.