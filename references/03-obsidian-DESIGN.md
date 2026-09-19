---
name: Obsidian
colors:
  surface: '#121319'
  surface-dim: '#121319'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e14'
  surface-container-low: '#1b1b21'
  surface-container: '#1f1f25'
  surface-container-high: '#292930'
  surface-container-highest: '#34343b'
  on-surface: '#e3e1ea'
  on-surface-variant: '#cac4d4'
  inverse-surface: '#e3e1ea'
  inverse-on-surface: '#303037'
  outline: '#948e9d'
  outline-variant: '#494552'
  surface-tint: '#cebdff'
  primary: '#cebdff'
  on-primary: '#381385'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#674bb5'
  secondary: '#c6c5cf'
  on-secondary: '#2f3038'
  secondary-container: '#4a4b53'
  on-secondary-container: '#bcbbc5'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#00b37e'
  on-tertiary-container: '#003d28'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#121319'
  on-background: '#e3e1ea'
  surface-variant: '#34343b'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
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

# Design System

## Brand & Style
The design system adopts a modern, sleek aesthetic in a **dark color mode**. It prioritizes clean lines, high-impact neon accents, and a professional yet futuristic developer-focused feel. The system utilizes the **Geist** font family for a clean, highly legible, and contemporary typographic hierarchy.

## Colors
The color palette is built for a dark mode environment, utilizing rich charcoal neutrals combined with vibrant violet primary tones, slate secondary shades, and energetic emerald tertiary accents.
- **Primary (`#a78bfa`)**: Soft violet for key interactive elements and focus states.
- **Secondary (`#71717a`)**: Muted zinc for supporting elements.
- **Tertiary (`#34d399`)**: Vivid mint for success states and highlights.
- **Neutral (`#3f3f46`)**: Deep zinc surfaces and structural containers.

## Typography
The system uses **Geist** for all headlines, body copy, and labels, ensuring a unified, highly legible typographic voice across all form factors.

## Layout & Spacing
A consistent spacing scale is applied across all layouts, utilizing an 8pt-based rhythm for predictable gutters, margins, and component padding.

## Elevation & Depth
Elevation is expressed through tonal surface layering in dark mode, minimizing harsh drop shadows in favor of subtle border contrasts and background elevation steps.

## Shapes
Components feature a rounded aesthetic (`roundedness: 2`), applying balanced border radii to cards, inputs, and buttons for a modern touch.

## Components
All foundational components—buttons, inputs, cards, and chips—adhere strictly to the dark theme variables, utilizing the defined primary, neutral, and accent colors.