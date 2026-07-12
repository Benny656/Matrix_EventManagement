---
version: alpha
name: "Warp Terminal — Agentic Dev Environment"
description: "Warp's marketing site channels the aesthetic of its terminal product: near-black backgrounds (#141414, #0b0b0b), a lavender/violet accent palette (#c7aeff, #d2b5ff), and monospace typography (Azeret Mono) used prominently in buttons and code snippets. The hero headline uses the custom display font \"theFuture\" at 57.6px with tight negative tracking. Body copy is set in \"Matter\" (a geometric sans). Buttons are sharp-cornered (--btn-radius: 0rem), reinforcing the developer-tool identity. Spacing follows a tight 4px base grid. The light theme uses a near-white (#f6f6f6, #ffffff) page surface with #141414 text, while the dark theme inverts to near-black surfaces. The overall feel is information-dense, terminal-inspired, and technically confident."
colors:
  announcement-bar: "#0b0b0b"
  dark-panel: "#1c1a26"
  dark-surface: "#141414"
  deep-black: "#000000"
  hero-tint-dark: "#f6f1ff"
  lavender-mid: "#d2b5ff"
  action-blue: "#007aff"
  lavender-accent: "#c7aeff"
  muted-text-dark: "#565656"
  text-on-dark: "#ffffff"
  hero-section-tint: "#f6f1ff"
  surface-subtle: "#f6f6f6"
  surface-white: "#ffffff"
  near-black: "#111111"
  text-primary: "#141414"
  text-secondary: "#565656"
  border-default: "#dbdfe0"
typography:
  hero-display:
    fontFamily: "theFuture"
    fontSize: "57.6px"
    fontWeight: "400"
    lineHeight: "61.056px"
    letterSpacing: "-1.44px"
  h1-heading:
    fontFamily: "theFuture"
    fontSize: "64px"
    fontWeight: "400"
    lineHeight: "1.25"
    letterSpacing: "-1.44px"
  body-regular:
    fontFamily: "Matter"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-small:
    fontFamily: "Matter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "21px"
  body-small-relaxed:
    fontFamily: "Matter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "28px"
  mono-ui-regular:
    fontFamily: "Azeret Mono"
    fontSize: "15px"
    fontWeight: "400"
    lineHeight: "22.5px"
    letterSpacing: "0.75px"
  mono-ui-medium:
    fontFamily: "Azeret Mono"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "28px"
  mono-code-tracked:
    fontFamily: "Azeret Mono"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "28px"
    letterSpacing: "0.7px"
  label-caps:
    fontFamily: "Matter"
    fontSize: "10px"
    fontWeight: "600"
    lineHeight: "15px"
    letterSpacing: "1px"
  terminal-code:
    fontFamily: "Hack"
    fontSize: "11.05px"
    fontWeight: "400"
    lineHeight: "20px"
  body-xs:
    fontFamily: "Matter"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "16px"
rounded:
  radius-none: "0px"
  radius-xs: "1px"
  radius-sm: "2px"
  radius-base: "3px"
  radius-md: "4px"
  radius-lg: "5px"
  radius-xl: "6px"
  radius-2xl: "8px"
  radius-3xl: "12px"
spacing:
  space-1: "2px"
  space-2: "4px"
  space-3: "6px"
  space-4: "8px"
  space-5: "10px"
  space-6: "12px"
  space-7: "14px"
  space-8: "16px"
  space-10: "20px"
  space-12: "24px"
  space-16: "32px"
  space-20: "40px"
  space-22: "44px"
  space-24: "48px"
  space-28: "56px"
  space-32: "64px"
---

## Overview

Warp's marketing site channels the aesthetic of its terminal product: near-black backgrounds (#141414, #0b0b0b), a lavender/violet accent palette (#c7aeff, #d2b5ff), and monospace typography (Azeret Mono) used prominently in buttons and code snippets. The hero headline uses the custom display font "theFuture" at 57.6px with tight negative tracking. Body copy is set in "Matter" (a geometric sans). Buttons are sharp-cornered (--btn-radius: 0rem), reinforcing the developer-tool identity. Spacing follows a tight 4px base grid. The light theme uses a near-white (#f6f6f6, #ffffff) page surface with #141414 text, while the dark theme inverts to near-black surfaces. The overall feel is information-dense, terminal-inspired, and technically confident.

**Signature traits:**
- Dual typeface system: Pairs theFuture and Matter across the type hierarchy.

## Colors

The palette uses 20 validated color tokens across 2 theme profiles. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **content-text** maps to `text-primary`: Role "text" is grounded by usage context "Primary body and heading text across all zones; highest frequency color (185 hits)".
- **surface-background** maps to `surface-white`: Role "background" is grounded by usage context "Page and card surface backgrounds; mapped to --color-surface and --card-bg".
- **action-background** maps to `surface-subtle`: Role "background" is grounded by usage context "Secondary surface, banner, and button backgrounds in header/sidebar zones".
- **action-text** maps to `action-blue`: Role "text" is grounded by usage context "Interactive links, focus rings, and CTA accents in sidebar and footer zones (26 hits)".

### Dark Theme

### Text Scale
- **Action Blue** (#007aff): Interactive links and CTA accents on dark surfaces (26 hits). Role: text. {authored: rgb(0, 122, 255), space: rgb}
- **Lavender Accent** (#c7aeff): Brand lavender accent; glows against dark backgrounds (8 hits). Role: text. {authored: rgb(199, 174, 255), space: rgb}
- **Muted Text Dark** (#565656): Secondary/muted text on dark surfaces (96 hits). Role: text. {authored: rgb(86, 86, 86), space: rgb}
- **Text On Dark** (#ffffff): Primary text on dark surfaces; also used for surface highlights (83 hits). Role: text. {authored: rgb(255, 255, 255), space: rgb}

### Surface & Shadows
- **Announcement Bar** (#0b0b0b): Near-black announcement/banner bar at top of page. Role: background. {authored: rgb(11, 11, 11), space: rgb}
- **Dark Panel** (#1c1a26): Deep purple-tinted dark panel surface. Role: background. {authored: rgb(28, 26, 38), space: rgb}
- **Dark Surface** (#141414): Primary dark page and card surface; dominant color in dark theme (185 hits). Role: background. {authored: rgb(20, 20, 20), space: rgb}
- **Deep Black** (#000000): Deepest background layer, gradient stops, and announcement bar (47 hits). Role: background. {authored: rgb(0, 0, 0), space: rgb}
- **Hero Tint Dark** (#f6f1ff): Lavender-tinted section background visible in hero zone (7.36% area). Role: background. {authored: rgb(246, 241, 255), space: rgb}
- **Lavender Mid** (#d2b5ff): Softer lavender variant for decorative text on dark (4 hits). Role: background. {authored: rgb(210, 181, 255), space: rgb}

### Light Theme

### Text Scale
- **Action Blue** (#007aff): Interactive links, focus rings, and CTA accents in sidebar and footer zones (26 hits). Role: text. {authored: rgb(0, 122, 255), space: rgb}
- **Lavender Accent** (#c7aeff): Brand accent color used in header highlights and decorative text elements (8 hits). Role: text. {authored: rgb(199, 174, 255), space: rgb}
- **Near Black** (#111111): Deep near-black used in header elements and announcement bar text (6 hits). Role: text. {authored: rgb(17, 17, 17), space: rgb}
- **Text Primary** (#141414): Primary body and heading text across all zones; highest frequency color (185 hits). Role: text. {authored: rgb(20, 20, 20), space: rgb}
- **Text Secondary** (#565656): Secondary/muted text labels, captions, and supporting copy (96 hits). Role: text. {authored: rgb(86, 86, 86), space: rgb}

### Interactive
- **Border Default** (#dbdfe0): Default border and input outline color. Role: border.

### Surface & Shadows
- **Hero Section Tint** (#f6f1ff): Large-area hero/main section background tint with lavender hue (7.36% area). Role: background. {authored: rgb(246, 241, 255), space: rgb}
- **Lavender Mid** (#d2b5ff): Softer lavender variant used in accent text and decorative elements (4 hits). Role: background. {authored: rgb(210, 181, 255), space: rgb}
- **Surface Subtle** (#f6f6f6): Secondary surface, banner, and button backgrounds in header/sidebar zones. Role: background. {authored: rgb(246, 246, 246), space: rgb}
- **Surface White** (#ffffff): Page and card surface backgrounds; mapped to --color-surface and --card-bg. Role: background. {authored: rgb(255, 255, 255), space: rgb}

## Typography

Typography uses theFuture, Matter, Azeret Mono, Hack across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes theFuture and Matter and Azeret Mono and Hack for visual contrast. Weight range spans regular, medium, semi-bold. Sizes range from 10px to 64px.

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — large display text for primary marketing statement | theFuture | 57.6px | 400 | 61.056px | -1.44px | theFuture, theFuture Fallback, The Future, system-ui, sans-serif | Extracted token |
| Primary page heading (probe-confirmed at 64px) | theFuture | 64px | 400 | 1.25 | -1.44px | theFuture, theFuture Fallback, The Future, system-ui, sans-serif | Extracted token |
| Primary body copy — most frequent typography tuple (319 hits) | Matter | 16px | 400 | 24px | normal | Matter, system-ui, sans-serif | Extracted token |
| Secondary body copy, captions, and UI labels (104 hits) | Matter | 14px | 400 | 21px | normal | Matter, system-ui, sans-serif | Extracted token |
| Body copy with relaxed line-height for readability (92 hits) | Matter | 14px | 400 | 28px | normal | Matter, system-ui, sans-serif | Extracted token |
| Monospace UI text — navigation labels, buttons, code snippets (72 hits) | Azeret Mono | 15px | 400 | 22.5px | 0.75px | Azeret Mono, Azeret Mono Fallback, ui-monospace, monospace | Extracted token |
| Monospace medium weight for interactive elements and labels (26 hits) | Azeret Mono | 14px | 500 | 28px | normal | Azeret Mono, Azeret Mono Fallback, ui-monospace, monospace | Extracted token |
| Tracked monospace for inline code and terminal command display (18 hits) | Azeret Mono | 14px | 400 | 28px | 0.7px | Azeret Mono, Azeret Mono Fallback, ui-monospace, monospace | Extracted token |
| Uppercase label/eyebrow text with wide tracking (9 hits) | Matter | 10px | 600 | 15px | 1px | Matter, system-ui, sans-serif | Extracted token |
| Terminal/code block monospace rendering inside product UI mockup (12 hits) | Hack | 11.05px | 400 | 20px | normal | Hack, Azeret Mono, Azeret Mono Fallback, ui-monospace, monospace | Extracted token |
| Extra-small body text for metadata and fine print (18 hits) | Matter | 12px | 400 | 16px | normal | Matter, system-ui, sans-serif | Extracted token |

## Layout

Responsive system uses 1 breakpoint tier(s): desktop.

This system uses a 4px base grid with scale values 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 44, 48, 56, 64, 96.

### Responsive Strategy
- **desktop (Unknown)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| space-1 | 2px | 2 | Extracted spacing token |
| space-2 | 4px | 4 | Extracted spacing token |
| space-3 | 6px | 6 | Extracted spacing token |
| space-4 | 8px | 8 | Extracted spacing token |
| space-5 | 10px | 10 | Extracted spacing token |
| space-6 | 12px | 12 | Extracted spacing token |
| space-7 | 14px | 14 | Extracted spacing token |
| space-8 | 16px | 16 | Extracted spacing token |
| space-10 | 20px | 20 | Extracted spacing token |
| space-12 | 24px | 24 | Extracted spacing token |
| space-16 | 32px | 32 | Extracted spacing token |
| space-20 | 40px | 40 | Extracted spacing token |
| space-22 | 44px | 44 | Extracted spacing token |
| space-24 | 48px | 48 | Extracted spacing token |
| space-28 | 56px | 56 | Extracted spacing token |
| space-32 | 64px | 64 | Extracted spacing token |
| space-48 | 96px | 96 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(12px) ; blur(8px) |
| Light | outline-color | oklch(0.07 0.007 220) ; oklch(0.4 0.007 220) ; rgb(20, 20, 20) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(0.8, 0, 0, 0.8, 0, 0) ; matrix(0.809832, 0.586661, -0.586661, 0.809832, 0, 0) |
| Dark | backdrop-filter | blur(12px) ; blur(8px) |
| Dark | outline-color | oklch(0.07 0.007 220) ; oklch(0.4 0.007 220) ; rgb(20, 20, 20) |
| Dark | outline-width | 3px |
| Dark | outline-offset | 0px |
| Dark | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(0.742075, -0.670317, 0.670317, 0.742075, 0, 0) ; matrix(0.8, 0, 0, 0.8, 0, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-none | 0px | 0 | Hairline corner |
| radius-xs | 1px | 1 | Hairline corner |
| radius-sm | 2px | 2 | Hairline corner |
| radius-base | 3px | 3 | Subtle corner |
| radius-md | 4px | 4 | Subtle corner |
| radius-lg | 5px | 5 | Subtle corner |
| radius-xl | 6px | 6 | Subtle corner |
| radius-2xl | 8px | 8 | Control corner |
| radius-3xl | 12px | 12 | Control corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-none | 0 | px |
| radius-xs | 1px | px |
| radius-sm | 2px | px |
| radius-base | 3px | px |
| radius-md | 4px | px |
| radius-lg | 5px | px |
| radius-xl | 6px | px |
| radius-2xl | 8px | px |
| radius-3xl | 12px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system without adding unsupported visual claims.

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
| Breakpoint 1 | Unknown | (prefers-reduced-motion: no-preference) |

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
