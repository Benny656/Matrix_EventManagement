---
version: alpha
name: "GSAP Dark Animation Studio"
description: "GSAP's homepage is a bold, dark-canvas developer tool marketing site built around a near-black (#0e100f) background with warm cream (#fffce1) text. The design uses a single custom typeface (Mori) at extreme display weights and sizes to communicate animation power. A vibrant, named multi-color accent system (shockingly-green, pink, orangey, lilac, blue) is used sparingly against the dark field. The CTA button uses a pill radius (100px) while most UI elements are sharp-cornered or use subtle 8px rounding. No shadows are used. depth is achieved through color contrast and 3D animated objects embedded in the hero."
colors:
  shockingly-green: "#0ae448"
  blue: "#00bae2"
  lilac: "#9d95ff"
  lt-green: "#abff84"
  orangey: "#ff8709"
  pink: "#fec5fb"
  just-black: "#0e100f"
  surface-white: "#fffce1"
  surface-75: "#bbbaa6"
  surface-50: "#7c7c6f"
typography:
  hero-display-xl:
    fontFamily: "Mori"
    fontSize: "202.666px"
    fontWeight: "600"
    lineHeight: "182.4px"
    letterSpacing: "-4.05332px"
  hero-display-l:
    fontFamily: "Mori"
    fontSize: "92.2354px"
    fontWeight: "600"
    lineHeight: "92.2354px"
  hero-display-m:
    fontFamily: "Mori"
    fontSize: "81.7646px"
    fontWeight: "600"
    lineHeight: "81.7646px"
  section-heading:
    fontFamily: "Mori"
    fontSize: "60.7022px"
    fontWeight: "400"
    lineHeight: "72.8426px"
    letterSpacing: "-0.607022px"
  card-heading:
    fontFamily: "Mori"
    fontSize: "30.4706px"
    fontWeight: "600"
    lineHeight: "30.4706px"
  subtitle:
    fontFamily: "Mori"
    fontSize: "22.343px"
    fontWeight: "400"
    lineHeight: "30.8334px"
    letterSpacing: "-0.22343px"
  nav-ui-label-semibold:
    fontFamily: "Mori"
    fontSize: "19.5146px"
    fontWeight: "600"
    lineHeight: "20.4015px"
    letterSpacing: "-0.195146px"
  body:
    fontFamily: "Mori"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "18.4px"
  body-semibold:
    fontFamily: "Mori"
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: "18.4px"
  cta-button-label:
    fontFamily: "Mori"
    fontSize: "13px"
    fontWeight: "600"
    lineHeight: "13.5908px"
    letterSpacing: "-0.13px"
  small-caption:
    fontFamily: "Mori"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "19.6px"
    letterSpacing: "-0.14px"
rounded:
  radius-sharp: "0px"
  radius-sm: "7px"
  radius-md: "8px"
  radius-pill: "100px"
spacing:
  spacing-3: "3px"
  spacing-5: "5px"
  spacing-7: "7.1px"
  spacing-8: "8px"
  spacing-10: "10px"
  spacing-13: "13px"
  spacing-14: "14px"
  spacing-15: "15px"
  spacing-16: "16px"
  spacing-18: "18px"
  spacing-20: "20px"
  spacing-22: "22px"
  spacing-24: "24px"
  spacing-27: "27px"
  spacing-32: "32px"
  spacing-39: "39px"
---

## Overview

GSAP's homepage is a bold, dark-canvas developer tool marketing site built around a near-black (#0e100f) background with warm cream (#fffce1) text. The design uses a single custom typeface (Mori) at extreme display weights and sizes to communicate animation power. A vibrant, named multi-color accent system (shockingly-green, pink, orangey, lilac, blue) is used sparingly against the dark field. The CTA button uses a pill radius (100px) while most UI elements are sharp-cornered or use subtle 8px rounding. No shadows are used. depth is achieved through color contrast and 3D animated objects embedded in the hero.

**Signature traits:**
- Single-family weight hierarchy: Builds hierarchy from Mori across 2 weights rather than multiple families.
- Soft, rounded geometry: Generous corner rounding up to 100px.

## Colors

The palette uses 10 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-background** maps to `surface-white`: Role "background" is grounded by usage context "Primary text, nav links, headings, button labels — the dominant foreground color across the entire page".
- **surface-background** maps to `just-black`: Role "background" is grounded by usage context "Page background, nav background, hero section fill — the dominant dark canvas".
- **border-border** maps to `surface-50`: Role "border" is grounded by usage context "Muted text, secondary labels, search input bottom border, tooltip border".
- **content-text** maps to `surface-75`: Role "text" is grounded by usage context "Tertiary/muted text labels in header and footer zones".

### Primary Brand
- **Shockingly Green** (#0ae448): Brand accent — announcement banner background, CTA button outline, primary interactive highlight. Role: primary.
- **Blue** (#00bae2): Accent color for UI/ScrollTrigger themed sections and skyfall gradient. Role: accent.
- **Lilac** (#9d95ff): Accent color for purple-haze gradient and text-purple themed sections. Role: accent.
- **Lt Green** (#abff84): Secondary green accent used in macha gradient and core plugin theming. Role: accent.
- **Orangey** (#ff8709): Accent color used in SVG/orange-crush gradient and themed plugin sections. Role: accent.
- **Pink** (#fec5fb): Accent color used in gradients, decorative elements, and scroll-trigger themed sections. Role: accent.

### Text Scale
- **Surface 75** (#bbbaa6): Tertiary/muted text labels in header and footer zones. Role: text.

### Interactive
- **Surface 50** (#7c7c6f): Muted text, secondary labels, search input bottom border, tooltip border. Role: border.

### Surface & Shadows
- **Just Black** (#0e100f): Page background, nav background, hero section fill — the dominant dark canvas. Role: background.
- **Surface White** (#fffce1): Primary text, nav links, headings, button labels — the dominant foreground color across the entire page. Role: background.

## Typography

Typography uses Mori across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Uses Mori throughout for a uniform feel. Weight range spans semi-bold, regular. Sizes range from 13px to 202.666px.

### Font Roles
- **Headline Font**: Mori
- **Body Font**: Mori

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Largest hero headline — 'Animate anything' display text | Mori | 202.666px | 600 | 182.4px | -4.05332px | Mori, sans-serif | Extracted token |
| Secondary hero display text | Mori | 92.2354px | 600 | 92.2354px | normal | Mori, sans-serif | Extracted token |
| Tertiary hero display text | Mori | 81.7646px | 600 | 81.7646px | normal | Mori, sans-serif | Extracted token |
| Section-level headings with tight negative tracking | Mori | 60.7022px | 400 | 72.8426px | -0.607022px | Mori, sans-serif | Extracted token |
| Card and feature block headings | Mori | 30.4706px | 600 | 30.4706px | normal | Mori, sans-serif | Extracted token |
| Subtitle and intro paragraph text | Mori | 22.343px | 400 | 30.8334px | -0.22343px | Mori, sans-serif | Extracted token |
| Navigation items, UI labels, button text at medium scale | Mori | 19.5146px | 600 | 20.4015px | -0.195146px | Mori, sans-serif | Extracted token |
| Body copy, paragraph text, default UI text | Mori | 16px | 400 | 18.4px | normal | Mori, sans-serif | Extracted token |
| Emphasized body text, inline labels | Mori | 16px | 600 | 18.4px | normal | Mori, sans-serif | Extracted token |
| Primary CTA button text (Get GSAP) | Mori | 13px | 600 | 13.5908px | -0.13px | Mori, sans-serif | Extracted token |
| Captions, fine print, metadata labels | Mori | 14px | 400 | 19.6px | -0.14px | Mori, sans-serif | Extracted token |

## Layout

Responsive system uses 1 breakpoint tier(s): desktop.

This system uses a 8px base grid with scale values 3, 5, 7, 8, 10, 13, 14, 15, 16, 18, 20, 22, 24, 27, 32, 39, 57, 62, 85.

### Responsive Strategy
- **desktop (Unknown)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| spacing-3 | 3px | 3 | Extracted spacing token |
| spacing-5 | 5px | 5 | Extracted spacing token |
| spacing-7 | 7.1px | 7.1 | Extracted spacing token |
| spacing-8 | 8px | 8 | Extracted spacing token |
| spacing-10 | 10px | 10 | Extracted spacing token |
| spacing-13 | 13px | 13 | Extracted spacing token |
| spacing-14 | 14px | 14 | Extracted spacing token |
| spacing-15 | 15px | 15 | Extracted spacing token |
| spacing-16 | 16px | 16 | Extracted spacing token |
| spacing-18 | 18px | 18 | Extracted spacing token |
| spacing-20 | 20px | 20 | Extracted spacing token |
| spacing-22 | 22px | 22 | Extracted spacing token |
| spacing-24 | 24px | 24 | Extracted spacing token |
| spacing-27 | 27px | 27 | Extracted spacing token |
| spacing-32 | 32px | 32 | Extracted spacing token |
| spacing-39 | 39px | 39 | Extracted spacing token |
| spacing-57 | 57.4px | 57.4 | Extracted spacing token |
| spacing-62 | 62.1px | 62.1 | Extracted spacing token |
| spacing-85 | 84.9px | 84.9 | Extracted spacing token |
| spacing-480 | 479.9px | 479.9 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(255, 252, 225) ; rgb(14, 16, 15) ; rgb(124, 124, 111) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(0.6, 0, 0, 0.6, 0, 100) ; matrix(-1, 0, 0, -1, 0, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-sharp | 0px | 0 | Hairline corner |
| radius-sm | 7px | 7 | Control corner |
| radius-md | 8px | 8 | Control corner |
| radius-pill | 100px | 100 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-sharp | 0 | px |
| radius-sm | 7px | px |
| radius-md | 8px | px |
| radius-pill | 100px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Single-family weight hierarchy, Soft, rounded geometry without adding unsupported visual claims.

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
| Breakpoint 1 | Unknown | (hover: hover) |

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
