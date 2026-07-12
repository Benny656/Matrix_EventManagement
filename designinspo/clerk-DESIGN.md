---
version: alpha
name: "Clerk Design System"
description: "Clerk's design system is a developer-focused marketing site built on a near-white (#f7f7f8) canvas with a dense gray scale palette anchored by #d9d9de borders. The hero features a subtle geometric grid illustration in light gray, with ultra-heavy black display type (700 weight) contrasting against a muted body copy. The primary CTA is a vivid purple (#6c47ff) pill button, while secondary actions use a white/light surface with fine border and multi-layer inset shadow. Navigation uses transparent backgrounds with 16px Geist Sans text. The spacing system is 4px-based, border radii cluster at 6–12px, and elevation is conveyed through layered box-shadows rather than heavy drop shadows."
colors:
  surface-base: "#f7f7f8"
  dark-surface: "#42434d"
  pure-white: "#ffffff"
  brand-purple: "#6c47ff"
  muted-gray: "#5e5f6e"
  near-black: "#131316"
  subtle-gray: "#747686"
  true-black: "#000000"
  border-default: "#d9d9de"
  border-light: "#eeeef0"
typography:
  display-hero:
    fontFamily: "geistNumbers, ui-sans-serif"
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.035em"
  body-default:
    fontFamily: "geistNumbers, ui-sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-small:
    fontFamily: "geistNumbers, ui-sans-serif"
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "20px"
  label-medium:
    fontFamily: "ui-sans-serif"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "15.96px"
  label-small:
    fontFamily: "ui-sans-serif"
    fontSize: "11px"
    fontWeight: "500"
    lineHeight: "20px"
  code-mono:
    fontFamily: "soehneMono, ui-monospace"
    fontSize: "12px"
    fontWeight: "600"
    lineHeight: "24px"
  nav-link:
    fontFamily: "geistNumbers, ui-sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
rounded:
  radius-sm: "4px"
  radius-md: "6px"
  radius-lg: "8px"
  radius-xl: "12px"
  radius-2xl: "16px"
  radius-full: "44px"
spacing:
  spacing-1: "4px"
  spacing-2: "8px"
  spacing-3: "12px"
  spacing-4: "16px"
  spacing-5: "20px"
  spacing-6: "24px"
  spacing-8: "32px"
  spacing-10: "40px"
  spacing-16: "64px"
  spacing-32: "128px"
---

## Overview

Clerk's design system is a developer-focused marketing site built on a near-white (#f7f7f8) canvas with a dense gray scale palette anchored by #d9d9de borders. The hero features a subtle geometric grid illustration in light gray, with ultra-heavy black display type (700 weight) contrasting against a muted body copy. The primary CTA is a vivid purple (#6c47ff) pill button, while secondary actions use a white/light surface with fine border and multi-layer inset shadow. Navigation uses transparent backgrounds with 16px Geist Sans text. The spacing system is 4px-based, border radii cluster at 6–12px, and elevation is conveyed through layered box-shadows rather than heavy drop shadows.

**Signature traits:**
- Dual typeface system: Pairs geistNumbers, ui-sans-serif and ui-sans-serif across the type hierarchy.
- Soft, rounded geometry: Generous corner rounding up to 44px.
- Single-accent color discipline: A neutral-led palette reserves #6c47ff as the lone accent.

## Colors

The palette uses 10 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-primary** maps to `surface-base`: Role "primary" is grounded by usage context "Page and section background; root canvas color".
- **action-background** maps to `pure-white`: Role "background" is grounded by usage context "Card surfaces, nav background, button fills".
- **action-text** maps to `near-black`: Role "text" is grounded by usage context "Primary heading and body text, nav links".
- **content-text** maps to `true-black`: Role "text" is grounded by usage context "Display headings, announcement bar text, logo".

### Primary Brand
- **Surface Base** (#f7f7f8): Page and section background; root canvas color. Role: primary. {authored: rgb(247, 247, 248), space: rgb}

### Text Scale
- **Brand Purple** (#6c47ff): Primary CTA button fill, key interactive highlights, code syntax. Role: text. {authored: rgb(108, 71, 255), space: rgb}
- **Muted Gray** (#5e5f6e): Secondary body copy, subheadings, descriptive text. Role: text. {authored: rgb(94, 95, 110), space: rgb}
- **Near Black** (#131316): Primary heading and body text, nav links. Role: text. {authored: rgb(19, 19, 22), space: rgb, alpha: 0}
- **Subtle Gray** (#747686): Tertiary text, footer labels, nav secondary items. Role: text. {authored: rgb(116, 118, 134), space: rgb}
- **True Black** (#000000): Display headings, announcement bar text, logo. Role: text. {authored: rgb(0, 0, 0), space: rgb, alpha: 0.06}

### Interactive
- **Border Default** (#d9d9de): Component borders, dividers, table borders, underlines. Role: border. {authored: rgb(217, 217, 222), space: rgb}
- **Border Light** (#eeeef0): Subtle dividers, light separators. Role: border. {authored: rgb(238, 238, 240), space: rgb}

### Surface & Shadows
- **Dark Surface** (#42434d): Dark announcement bar, secondary CTA button background. Role: background. {authored: rgb(66, 67, 77), space: rgb}
- **Pure White** (#ffffff): Card surfaces, nav background, button fills. Role: background. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.25}

## Typography

Typography uses geistNumbers, ui-sans-serif, ui-sans-serif, soehneMono, ui-monospace across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes geistNumbers, ui-sans-serif and ui-sans-serif and soehneMono, ui-monospace for visual contrast. Weight range spans bold, regular, medium, semi-bold. Sizes range from 11px to 16px.

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — 'More than authentication, Complete User Management' | geistNumbers, ui-sans-serif | 3.5rem–4.5rem | 700 | 1.1 | -0.035em | geistNumbers, ui-sans-serif | Extracted token |
| Primary body copy, nav links, general paragraph text | geistNumbers, ui-sans-serif | 16px | 400 | 24px | normal | geistNumbers, ui-sans-serif | Extracted token |
| Secondary body text, captions, metadata | geistNumbers, ui-sans-serif | 13px | 400 | 20px | normal | geistNumbers, ui-sans-serif | Extracted token |
| Button labels, tags, badge text | ui-sans-serif | 12px | 500 | 15.96px | normal | ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji | Extracted token |
| Micro labels, status indicators | ui-sans-serif | 11px | 500 | 20px | normal | ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji | Extracted token |
| Code snippets, inline code, syntax-highlighted blocks | soehneMono, ui-monospace | 12px | 600 | 24px | normal | soehneMono, ui-monospace | Extracted token |
| Top navigation links and dropdown triggers | geistNumbers, ui-sans-serif | 16px | 400 | 24px | normal | geistNumbers, ui-sans-serif | Extracted token |

## Layout

Layout rhythm is inferred from spacing tokens and responsive breakpoint evidence.

This system uses a 4px base grid with scale values 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 128.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| spacing-1 | 4px | 4 | Extracted spacing token |
| spacing-2 | 8px | 8 | Extracted spacing token |
| spacing-3 | 12px | 12 | Mapped to --container-xs |
| spacing-4 | 16px | 16 | Extracted spacing token |
| spacing-5 | 20px | 20 | Extracted spacing token |
| spacing-6 | 24px | 24 | Extracted spacing token |
| spacing-8 | 32px | 32 | Extracted spacing token |
| spacing-10 | 40px | 40 | Extracted spacing token |
| spacing-16 | 64px | 64 | Extracted spacing token |
| spacing-32 | 128px | 128 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(1px) ; blur(8px) ; blur(10px) |
| Light | outline-color | rgb(0, 0, 0) ; rgb(19, 19, 22) ; rgb(94, 95, 110) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(0.8, 0, 0, 0.8, 0, 0) ; matrix(1, 0, 0, 1, 0, -56) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-sm | 4px | 4 | Subtle corner |
| radius-md | 6px | 6 | Subtle corner |
| radius-lg | 8px | 8 | Control corner |
| radius-xl | 12px | 12 | Control corner |
| radius-2xl | 16px | 16 | Card corner |
| radius-full | 44px | 44 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-sm | 4px | px |
| radius-md | 6px | px |
| radius-lg | 8px | px |
| radius-xl | 12px | px |
| radius-2xl | 16px | px |
| radius-full | 44px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system, Soft, rounded geometry, Single-accent color discipline without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints

No distinct responsive breakpoints were extracted.

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
