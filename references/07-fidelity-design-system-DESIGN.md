---
name: Fidelity Design System
colors:
  surface: '#fff8f4'
  surface-dim: '#e4d8ce'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fef1e7'
  surface-container: '#f8ece1'
  surface-container-high: '#f2e6dc'
  surface-container-highest: '#ece0d6'
  on-surface: '#201b14'
  on-surface-variant: '#554339'
  inverse-surface: '#362f28'
  inverse-on-surface: '#fbefe4'
  outline: '#887368'
  outline-variant: '#dbc1b5'
  surface-tint: '#99460a'
  primary: '#964407'
  on-primary: '#ffffff'
  primary-container: '#b65c21'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb68e'
  secondary: '#645d57'
  on-secondary: '#ffffff'
  secondary-container: '#e9ded6'
  on-secondary-container: '#69615b'
  tertiary: '#944242'
  on-tertiary: '#ffffff'
  tertiary-container: '#b35a59'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb68e'
  on-primary-fixed: '#331200'
  on-primary-fixed-variant: '#773300'
  secondary-fixed: '#ebe0d9'
  secondary-fixed-dim: '#cfc5bd'
  on-secondary-fixed: '#201b16'
  on-secondary-fixed-variant: '#4c4640'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#3f0308'
  on-tertiary-fixed-variant: '#792e2f'
  background: '#fff8f4'
  on-background: '#201b14'
  surface-variant: '#ece0d6'
typography:
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

# Fidelity Design System

## Brand & Style
The Fidelity Design System embraces a refined, editorial approach inspired by traditional print and contemporary digital publishing. It uses **EB Garamond** for headlines to establish a timeless, authoritative voice, paired with **Manrope** for body and label text to ensure exceptional legibility and modern clarity at any scale. The aesthetic balances warmth and professionalism, tailored for editorial applications, content-rich platforms, and sophisticated dashboards.

## Colors
The color system is rooted in warm, earthen tones that convey stability and craft. 
- **Primary (`#c2652a`)**: A vibrant, burnt terracotta used for primary actions, key brand moments, and focal states.
- **Secondary (`#78706a`)**: A muted taupe-gray providing balanced support for secondary components and subdued UI elements.
- **Tertiary (`#8c3c3c`)**: A deep, rich crimson accent used selectively for important highlights or status indicators.
- **Neutral (`#605850`)**: A warm charcoal/stone tone used for typography, borders, and structured surface separation.

## Typography
Typography bridges editorial heritage with digital utility. Headlines rely on the high-contrast serif details of **EB Garamond**, creating distinct hierarchy and visual elegance. Body copy and UI labels utilize the geometric yet approachable grotesque forms of **Manrope**, ensuring crisp rendering across high-density displays and small screens alike.

## Layout & Spacing
The layout system is built on a responsive fluid grid with generous margins and comfortable gutters (`1.5rem` gutters, `2rem` outer margins on desktop). Spacing scale steps (`space-xs` through `space-xl`) provide predictable rhythm for component padding, stack gaps, and structural containers, supporting both dense data presentations and spacious editorial layouts.

## Elevation & Depth
Elevation is expressed through tonal layering and soft, diffused ambient shadows tinted with warm neutral undertones. Rather than heavy black drops, surfaces lift via subtle opacity steps and low-contrast outlines, maintaining a clean, modern aesthetic.

## Shapes
The system uses a moderately rounded shape language (`roundedness: 2`, translating to `0.5rem` base radii for buttons and inputs, scaling up to `1rem` and `1.5rem` for cards and containers). This softens the geometric tendencies of Manrope and pairs harmoniously with the warm terracotta palette, achieving an approachable, polished look.

## Components
- **Buttons**: Feature solid primary terracotta fills or outlined variants with `0.5rem` border radii and clear typographic hierarchy using Manrope medium weights.
- **Chips & Tags**: Compact, pill-adjacent elements with soft neutral backgrounds or muted accent borders.
- **Input Fields**: Clean bordered containers with warm neutral strokes, focusing into primary terracotta outlines with subtle inner shadows.
- **Cards**: Surface containers utilizing roundedness level 2 (`1rem` radius), paired with soft elevation layers to organize content clearly.