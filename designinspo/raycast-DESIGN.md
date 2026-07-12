---
version: alpha
name: "Raycast Dark"
description: "Raycast's marketing site is a dark-first, high-contrast design built on a near-black grey scale (#07080a base) with a vivid coral-red (#ff6363) accent. The hero uses a full-bleed cinematic photograph with large white display type. Navigation is a floating pill-shaped bar with subtle border. Typography is dominated by Inter for UI and body copy, with SF Pro Text appearing in product UI mockups. The spacing system is an 8px-base scale with named tokens (--spacing-1 through --spacing-13). Border radii range from sharp (4px) to fully rounded (99999px/100%), with 8px and 11px being the most common. Shadows are layered and dimensional, used on interactive elements like buttons. The overall feel is premium, developer-focused, and visually bold."
colors:
  coral-red: "#ff6363"
  button-background: "#ffffff"
  blue-accent: "#56c2ff"
  green-accent: "#59d499"
  yellow-accent: "#ffc531"
  background-base: "#07080a"
  grey-600: "#1b1c1e"
  surface-100: "#101111"
  surface-200: "#18191a"
  surface-300: "#313133"
  grey-200: "#9c9c9d"
  grey-300: "#6a6b6c"
  grey-50: "#e6e6e6"
  white: "#ffffff"
  grey-400: "#434345"
  grey-500: "#2f3031"
typography:
  display-hero:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontWeight: "400"
    lineHeight: "1.1"
  heading-1:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "32px"
    fontWeight: "400"
    lineHeight: "36.8px"
  heading-2:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "24px"
    fontWeight: "500"
    lineHeight: "38.4px"
    letterSpacing: "0.2px"
  heading-3:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "20px"
    fontWeight: "500"
    letterSpacing: "0.2px"
  body-default:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "18.4px"
  body-emphasis:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "16px"
    fontWeight: "600"
    letterSpacing: "0.3px"
  label-medium:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "22.4px"
    letterSpacing: "0.2px"
  caption:
    fontFamily: "Inter, Inter Fallback, sans-serif"
    fontSize: "13px"
    fontWeight: "400"
    letterSpacing: "0.1px"
  ui-product-medium:
    fontFamily: "SF Pro Text, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: "500"
    lineHeight: "27.6px"
  ui-product-small:
    fontFamily: "SF Pro Text, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: "500"
    lineHeight: "18.4px"
  code-mono:
    fontFamily: "JetBrains Mono, JetBrains Mono Fallback, Menlo, Monaco, Courier, monospace"
    fontSize: "13px"
    fontWeight: "700"
    lineHeight: "16px"
rounded:
  rounding-none: "0px"
  rounding-xs: "4px"
  rounding-sm: "6px"
  rounding-normal: "8px"
  rounding-md: "12px"
  rounding-lg: "16px"
  rounding-xl: "20px"
  rounding-xxl: "24px"
  rounding-app-icon: "11px"
  rounding-full: "99999px"
spacing:
  spacing-0-5: "4px"
  spacing-1: "8px"
  spacing-1-5: "12px"
  spacing-2: "16px"
  spacing-2-5: "20px"
  spacing-3: "24px"
  spacing-4: "32px"
  spacing-5: "40px"
  spacing-6: "48px"
  spacing-7: "56px"
  spacing-8: "64px"
  spacing-9: "80px"
  spacing-10: "96px"
  spacing-11: "112px"
  spacing-12: "168px"
  spacing-13: "224px"
---

## Overview

Raycast's marketing site is a dark-first, high-contrast design built on a near-black grey scale (#07080a base) with a vivid coral-red (#ff6363) accent. The hero uses a full-bleed cinematic photograph with large white display type. Navigation is a floating pill-shaped bar with subtle border. Typography is dominated by Inter for UI and body copy, with SF Pro Text appearing in product UI mockups. The spacing system is an 8px-base scale with named tokens (--spacing-1 through --spacing-13). Border radii range from sharp (4px) to fully rounded (99999px/100%), with 8px and 11px being the most common. Shadows are layered and dimensional, used on interactive elements like buttons. The overall feel is premium, developer-focused, and visually bold.

**Signature traits:**
- Dual typeface system: Pairs Inter, Inter Fallback, sans-serif and SF Pro Text, system-ui, sans-serif across the type hierarchy.
- Soft, rounded geometry: Generous corner rounding up to 99999px.

## Colors

The palette uses 16 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-background** maps to `background-base`: Role "background" is grounded by usage context "Full-page background, hero section, navbar backdrop".
- **action-text** maps to `white`: Role "text" is grounded by usage context "Primary body text, headings, button labels on dark backgrounds".
- **surface-text** maps to `grey-50`: Role "text" is grounded by usage context "High-emphasis secondary text on dark surfaces".
- **content-text** maps to `grey-300`: Role "text" is grounded by usage context "Tertiary text, footer copy, disabled states".

### Primary Brand
- **Coral Red** (#ff6363): Brand logo accent, primary CTA highlights, error states. Role: primary.
- **Blue Accent** (#56c2ff): Informational highlights, link accents, code syntax. Role: accent.
- **Green Accent** (#59d499): Success states, positive indicators. Role: accent.
- **Yellow Accent** (#ffc531): Warning states, star ratings, attention highlights. Role: accent.

### Text Scale
- **Grey 200** (#9c9c9d): Muted body text, nav link labels, secondary labels. Role: text.
- **Grey 300** (#6a6b6c): Tertiary text, footer copy, disabled states. Role: text.
- **Grey 50** (#e6e6e6): High-emphasis secondary text on dark surfaces. Role: text.
- **White** (#ffffff): Primary body text, headings, button labels on dark backgrounds. Role: text.

### Interactive
- **Button Background** (#ffffff): Primary download/CTA button fill (white pill on dark background). Role: secondary.
- **Grey 400** (#434345): Subtle dividers, card borders, input outlines. Role: border.
- **Grey 500** (#2f3031): Stronger border lines, section separators. Role: border.

### Surface & Shadows
- **Background Base** (#07080a): Full-page background, hero section, navbar backdrop. Role: background.
- **Grey 600** (#1b1c1e): Dialog and overlay backgrounds. Role: background.
- **Surface 100** (#101111): Slightly elevated card and panel surfaces. Role: background.
- **Surface 200** (#18191a): Secondary card surfaces and dialog backgrounds. Role: background.
- **Surface 300** (#313133): Tertiary surface, input backgrounds. Role: background.

## Typography

Typography uses Inter, Inter Fallback, sans-serif, SF Pro Text, system-ui, sans-serif, JetBrains Mono, JetBrains Mono Fallback, Menlo, Monaco, Courier, monospace across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes Inter, Inter Fallback, sans-serif and SF Pro Text, system-ui, sans-serif and JetBrains Mono, JetBrains Mono Fallback, Menlo, Monaco, Courier, monospace for visual contrast. Weight range spans regular, medium, semi-bold, bold. Sizes range from 13px to 32px.

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — 'Your shortcut to everything.' Large white display text | Inter, Inter Fallback, sans-serif | clamp(48px, 6vw, 80px) | 400 | 1.1 | normal | Inter, Inter Fallback, sans-serif | Extracted token |
| Section headings and feature titles | Inter, Inter Fallback, sans-serif | 32px | 400 | 36.8px | normal | Inter, Inter Fallback, sans-serif | Extracted token |
| Sub-section headings and card titles | Inter, Inter Fallback, sans-serif | 24px | 500 | 38.4px | 0.2px | Inter, Inter Fallback, sans-serif | Extracted token |
| Tertiary headings and feature labels | Inter, Inter Fallback, sans-serif | 20px | 500 | normal | 0.2px | Inter, Inter Fallback, sans-serif | Extracted token |
| Primary body copy, paragraph text | Inter, Inter Fallback, sans-serif | 16px | 400 | 18.4px | normal | Inter, Inter Fallback, sans-serif | Extracted token |
| Emphasized body text, button labels, nav items | Inter, Inter Fallback, sans-serif | 16px | 600 | normal | 0.3px | Inter, Inter Fallback, sans-serif | Extracted token |
| UI labels, metadata, secondary navigation | Inter, Inter Fallback, sans-serif | 14px | 500 | 22.4px | 0.2px | Inter, Inter Fallback, sans-serif | Extracted token |
| Small captions, footnotes, tag labels | Inter, Inter Fallback, sans-serif | 13px | 400 | normal | 0.1px | Inter, Inter Fallback, sans-serif | Extracted token |
| Product UI mockup text — simulated macOS app interface | SF Pro Text, system-ui, sans-serif | 24px | 500 | 27.6px | normal | SF Pro Text, system-ui, sans-serif | Extracted token |
| Smaller product UI mockup labels | SF Pro Text, system-ui, sans-serif | 16px | 500 | 18.4px | normal | SF Pro Text, system-ui, sans-serif | Extracted token |
| Code snippets, keyboard shortcuts, monospace UI elements | JetBrains Mono, JetBrains Mono Fallback, Menlo, Monaco, Courier, monospace | 13px | 700 | 16px | normal | JetBrains Mono, JetBrains Mono Fallback, Menlo, Monaco, Courier, monospace | Extracted token |

## Layout

Responsive system uses 3 breakpoint tier(s): mobile, tablet, desktop.

This system uses a 8px base grid with scale values 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 112, 168, 224.

### Responsive Strategy
- **mobile (375-1024px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (>= 640px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (>= 1024px)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| spacing-0-5 | 4px | 4 | Mapped to --spacing-0-5 |
| spacing-1 | 8px | 8 | Mapped to --spacing-1 |
| spacing-1-5 | 12px | 12 | Mapped to --spacing-1-5 |
| spacing-2 | 16px | 16 | Mapped to --spacing-2 |
| spacing-2-5 | 20px | 20 | Mapped to --spacing-2-5 |
| spacing-3 | 24px | 24 | Mapped to --spacing-3 |
| spacing-4 | 32px | 32 | Mapped to --spacing-4 |
| spacing-5 | 40px | 40 | Mapped to --spacing-5 |
| spacing-6 | 48px | 48 | Mapped to --spacing-6 |
| spacing-7 | 56px | 56 | Mapped to --spacing-7 |
| spacing-8 | 64px | 64 | Mapped to --spacing-8 |
| spacing-9 | 80px | 80 | Mapped to --spacing-9 |
| spacing-10 | 96px | 96 | Mapped to --spacing-10 |
| spacing-11 | 112px | 112 | Mapped to --spacing-11 |
| spacing-12 | 168px | 168 | Mapped to --spacing-12 |
| spacing-13 | 224px | 224 | Mapped to --spacing-13 |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(2px) ; blur(36px) ; blur(10px) |
| Light | outline-color | rgb(255, 255, 255) ; rgb(106, 107, 108) ; rgb(156, 156, 157) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(1, 0, 0, 1, 0, 20) ; matrix(1, 0, 0, 1, -4860, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| rounding-none | 0px | 0 | Hairline corner |
| rounding-xs | 4px | 4 | Subtle corner |
| rounding-sm | 6px | 6 | Subtle corner |
| rounding-normal | 8px | 8 | Control corner |
| rounding-app-icon | 11px | 11 | Control corner |
| rounding-md | 12px | 12 | Control corner |
| rounding-lg | 16px | 16 | Card corner |
| rounding-xl | 20px | 20 | Card corner |
| rounding-xxl | 24px | 24 | Large surface corner |
| rounding-full | 99999px | 99999 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| rounding-none | 0 | px |
| rounding-xs | 4px | px |
| rounding-sm | 6px | px |
| rounding-normal | 8px | px |
| rounding-md | 12px | px |
| rounding-lg | 16px | px |
| rounding-xl | 20px | px |
| rounding-xxl | 24 | px |
| rounding-app-icon | 11px | px |
| rounding-full | 99999px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system, Soft, rounded geometry without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 408px | (max-width: 408px) |
| Mobile | <= 480px | (max-width: 480px) |
| Mobile | <= 563px | (max-width: 563px) |
| Mobile | <= 600px | screen and (max-width: 600px) |
| Mobile | <= 720px | (max-width: 720px) |
| Breakpoint 6 | <= 768px | (max-width: 768px) |
| Breakpoint 7 | <= 840px | (max-width: 840px) |
| Breakpoint 8 | <= 1000px | screen and (max-width: 1000px) |
| Breakpoint 9 | <= 1024px | (max-width: 1024px) |
| Mobile | >= 375px | (min-width: 375px) |
| Mobile | >= 400px | (min-width: 400px) |
| Mobile | >= 420px | screen and (min-width: 420px) |
| Mobile | >= 480px | (min-width: 480px) |
| Mobile | >= 520px | (min-width: 520px) |
| Mobile | >= 530px | (min-width: 530px) |
| Mobile | >= 548px | (min-width: 548px) |
| Mobile | >= 640px | (min-width: 640px) |
| Mobile | >= 720px | (min-width: 720px) |
| Mobile | >= 767px | (min-width: 767px) |
| Tablet | >= 768px | (min-width: 768px) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
