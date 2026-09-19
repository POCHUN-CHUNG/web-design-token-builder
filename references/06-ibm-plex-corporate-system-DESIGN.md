---
name: IBM Plex Corporate System
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#424656'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#737687'
  outline-variant: '#c3c6d8'
  surface-tint: '#0052dd'
  primary: '#004ccd'
  on-primary: '#ffffff'
  primary-container: '#0f62fe'
  on-primary-container: '#f3f3ff'
  inverse-primary: '#b4c5ff'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626263'
  tertiary: '#006527'
  on-tertiary: '#ffffff'
  tertiary-container: '#198038'
  on-tertiary-container: '#d4ffd2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174c'
  on-primary-fixed-variant: '#003da9'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#96f8a1'
  tertiary-fixed-dim: '#7bdb87'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531e'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# IBM Plex Corporate System Design Document

## Brand & Style
The design system adopts a **Corporate / Modern** aesthetic, heavily influenced by IBM Plex and modern tonal design principles. It is engineered to convey high reliability, professional precision, and clean organizational structure. The UI evokes confidence and efficiency, prioritizing clarity and functional elegance over superficial ornamentation.

## Colors
The color palette is built on a precise tonal spot system optimized for clarity and professional contexts.
- **Primary (`#0f62fe`)**: A vibrant, dependable blue that anchors interactive elements, primary actions, and brand touchpoints.
- **Secondary (`#6f6f6f`)**: A balanced mid-tone neutral gray used for supporting text, secondary borders, and inactive states.
- **Tertiary (`#198038`)**: A solid operational green utilized for successful states, positive indicators, and confirmation elements.
- **Neutral (`#525252`)**: A cool charcoal neutral that forms the backbone for high-contrast typography, structural containers, and readable body copy on light backgrounds.

## Typography
The typography stack exclusively utilizes **IBM Plex Sans** to ensure a uniform, industrial, and highly legible reading experience across all device sizes. Letterforms are engineered for exceptional digital legibility in dense data-driven environments.
- **Headlines**: Weighted at semi-bold (600) to medium (500) for strong structural hierarchy without aggression.
- **Body**: Standard regular (400) weight optimized for comfortable extended reading in data tables, dashboards, and documents.
- **Labels**: Medium (500) weight designed to provide clarity on buttons, form fields, and navigation elements.

## Layout & Spacing
The layout philosophy relies on a structured fluid grid system coupled with a predictable spacing rhythm.
- **Grid Structure**: A 12-column fluid grid with standard 1rem gutters and 1.5rem outer canvas margins. Elements scale predictably across desktop, tablet, and mobile breakpoints.
- **Spacing Scale**: Spacing tokens (`space-xs` through `space-xl`) govern component padding and stacking gaps, ensuring consistent vertical and horizontal rhythm throughout complex enterprise layouts.

## Elevation & Depth
Visual hierarchy and depth are established primarily through **tonal layers and low-contrast outlines** rather than heavy drop shadows.
- **Surfaces**: Layering relies on subtle shifts in background tint using the neutral and primary tonal palettes to separate cards, modals, and navigation drawers.
- **Borders**: Crisp, high-precision ghost borders outline structural containers, maintaining the clean, flat, yet dimensional standard expected of modern enterprise design systems.

## Shapes
The design system implements a **Soft** shape language (`roundedness: 1`), featuring a subtle 0.25rem corner radius on base UI elements.
- **Containers & Controls**: Buttons, inputs, and cards feature gentle rounding (0.25rem), while larger structural components scale up to 0.5rem (`rounded-lg`) or 0.75rem (`rounded-xl`). This slight softening removes harsh geometric edges while maintaining a professional, orderly corporate aesthetic.

## Components
Components follow strict guidelines, emphasizing functional clarity, accessibility, and high contrast:
- **Buttons**: Primary actions use the vivid primary color (`#0f62fe`) with soft rounded corners. Secondary and ghost variants utilize neutral borders and text tones.
- **Input Fields**: Clean outlined fields featuring neutral borders that transition to primary blue upon focus, accompanied by clear label typography.
- **Cards & Containers**: Structured with subtle neutral outlines, soft corner radii, and ample internal padding.
- **Checkboxes & Radios**: Precision-crafted with high-contrast states to guarantee WCAG compliance and clear user feedback.
- **Chips & Lists**: Compact, structured components designed for dense data organization and tagging.