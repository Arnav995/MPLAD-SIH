---
name: Sovereign Operations Engine
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#444748'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#006d37'
  on-secondary: '#ffffff'
  secondary-container: '#66fe9c'
  on-secondary-container: '#00743b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f1500'
  on-tertiary-container: '#c76c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#66fe9c'
  secondary-fixed-dim: '#44e183'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-metric:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.025em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-xxl: 3rem
---

## Brand & Style

The design system establishes an institutional, high-credibility operational environment for administrative oversight, state expenditure tracking, and anomaly detection. The personality balances the structured civic sobriety of GOV.UK design standards with the high-throughput functional clarity of institutional logistics platforms (such as Uber Freight or Base).

The visual tone is strictly restrained, analytical, and authoritative. It removes decorative chrome, gradients, skeuomorphic shading, and sci-fi aesthetic tropes (such as neon lines, terminal scanlines, or glowing monitors) in favor of high-density data legibility, structural stability, and absolute visual economy.

### Key Tenets
- **Institutional Rigor:** Clean geometric architecture, razor-thin borders, and meticulous alignment convey structural oversight, governance, and audit readiness.
- **Controlled Signal-to-Noise:** Color is never ornamental. Chromatic accents are reserved strictly for system states, verification indicators, and risk-tier telemetry.
- **Editorial Legibility:** Clear typographic contrast and tabular efficiency allow senior officials and audit directors to review high volumes of financial transactions and constituency allocations without visual fatigue.

## Colors

The system employs a stark, monochromatic structural canvas accented by a single high-efficiency emerald green and muted semantic alerting tones. The interface defaults to an uncompromising light mode built around crisp off-white layers, near-black ink, and fine structural dividing lines.

### Base Structural Palette
- **Canvas Base (`#FAFAFA`):** Primary window background, providing subtle separation from pure-white card surfaces.
- **Surface Elevation (`#FFFFFF`):** Work surfaces, data table sheets, metric modules, and elevated modal panels.
- **Surface Secondary (`#F9FAFB`):** Table header backgrounds, nested containers, and disabled form regions.
- **Border & Hairline Rules (`#E5E7EB` / `#EEEEEE`):** Crisp 1px structural delineators separating metrics, sidebars, and rows.

### Typographic Inks
- **Primary Ink (`#111111`):** Headlines, critical financial figures, active labels, primary CTAs.
- **Secondary Ink (`#4B5563`):** Descriptive metadata, table column descriptors, breadcrumbs, inactive iconography.
- **Muted Ink (`#9CA3AF`):** Placeholders, subtle timestamps, deactivated states.

### Semantic & Operational Accents
- **System Accent (`#06C167`):** Applied strictly to active primary tabs, navigation selection markers, resolved validation states, and healthy anomaly metrics. Never used as a large-area background fill.
- **Warning / Tier-2 Risk (`#D97706`):** Soft, dignified amber for flagged budget deviations, pending approvals, and mid-level anomalies. Pair with `#FEF3C7` at 10% opacity for backgrounds.
- **Critical / Anomaly Trigger (`#DC2626`):** Deep, desaturated crimson for budget leakage alerts, sanction non-compliance, and severe algorithmic flags. Pair with `#FEE2E2` at 15% opacity for chip containers.

## Typography

The type scale relies entirely on Inter to maintain visual cohesion across numeric tracking, micro-copy, and analytical report headings. The configuration utilizes native OpenType features: `tnum` (tabular numbers) and `cv05` for high-density financial metrics to guarantee vertical alignment across ledgers and statistical displays.

### Typographic Hierarchy Rules
- **Numerical Primacy:** Big numeric indicators rely on medium (`500`) weight at 30px rather than ultra-bold weights, mirroring financial and audit terminal conventions.
- **Section Headers:** Uppercase tracking is restricted to `label-sm` metadata tags, ledger headers, and audit category chips (letter spacing set to `0.04em`).
- **Purity:** Font smoothing is set to antialiased; bold weights never exceed `600` (Semi-Bold) to avoid heavy ink bleed across high-DPI administrative workstations.

## Layout & Spacing

The layout is grounded in a continuous, responsive 12-column structural grid system built for extreme information density without visual crowding. Spacing units follow a strict 4px/8px incremental cadence.

### Grid Architecture & Reflow
- **Desktop (1280px and above):** 12 columns, 24px gutters, fixed 256px vertical primary operations navigation rail, with flexible 32px canvas margins. Data tables stretch fluidly while single-record audit forms constrain to a maximum width of 1024px.
- **Tablet (768px – 1279px):** 8 columns, 16px gutters, 24px margins. The operational navigation rail collapses into a persistent 64px icon-rail. Data metrics shift from 4-column cards to a 2x2 grid.
- **Mobile (Below 768px):** 4 columns, 16px gutters, 16px margins. Dense data tables switch to stacked audit cards. Tabular horizontally scrollable blocks remain pinned within the viewport with visible overflow cues.

### Spacing Principles
- **Component Packaging:** Structural cards leverage compact internal padding (`space-md` on data-dense panels, `space-lg` on narrative review documents).
- **Metric Gaps:** Layout spacing tokens govern distance strictly; margins and gutters never mix with inner component padding tokens.

## Elevation & Depth

Visual hierarchy is communicated strictly through structural layering, white-space separation, and 1px hairlines. Heavy, diffused, or colored drop shadows are prohibited to uphold an austere institutional character.

### Hierarchy Techniques
- **Surface Elevation Levels:**
  - `Level 0 (Canvas Base)`: Flat `#FAFAFA`, non-interactive canvas.
  - `Level 1 (Data Cards & Work Surfaces)`: Flat `#FFFFFF` bound by a solid 1px `#E5E7EB` border.
  - `Level 2 (Dropdowns, Command Menus & Flyouts)`: Pure `#FFFFFF` enclosed by `#E5E7EB` with a crisp, low-blur border shadow: `0px 4px 12px rgba(0, 0, 0, 0.05)`.
  - `Level 3 (Modal Sheets & Inspection Drawers)`: Framed with a 1px `#D1D5DB` edge and backed by a flat, unblurred scrim overlay of `rgba(17, 17, 17, 0.4)`.

### Border System
Hairlines provide architectural rigor. Internal cell dividers within data tables utilize `#F3F4F6`, while primary card perimeters use `#E5E7EB`. Under no circumstances are glassy backdrops or neo-brutalist heavy solid borders used.

## Shapes

The design system employs a soft, highly disciplined corner radius system (Level 1 / 4px base radius) engineered to balance civic authority with contemporary interface precision.

### Geometric Rules
- **Base Components (Inputs, Buttons, Badges, Tabs):** `0.25rem` (4px). Conveys functional, industrial discipline without sharp 90-degree aggression.
- **Surface Containers (Cards, Table Containers, Modals):** `0.5rem` (8px / `rounded-lg`). Provides subtle softness on structural perimeters while maintaining orthogonal alignment.
- **Metric Badges & Indicators:** Pill shapes (`rounded-full`) are strictly forbidden except for circular system status pulse dots (6px × 6px). Anomaly tags and status indicators remain rectilinear with 4px corner radii.

## Components

### Buttons
- **Primary:** Solid `#111111` background, `#FFFFFF` text, 4px border radius, 36px height for standard interface density. Active state: `#000000`. Focused state: 2px offset ring using `#111111`.
- **Secondary:** `#FFFFFF` background, 1px border `#E5E7EB`, `#111111` text. Hover state: `#F9FAFB` surface, `#D1D5DB` border.
- **Success / Execute Action:** `#06C167` background, `#FFFFFF` text, used exclusively for definitive operations (e.g., "Disburse Tranche", "Sign Verification").
- **Destructive:** Transparent background, 1px border `#FCA5A5`, `#DC2626` text. Hover state: `#FEE2E2` fill.

### Input Fields & Controls
- **Form Inputs:** 36px standard height, `#FFFFFF` surface, 1px `#D1D5DB` border, 4px radius. Focus state shifts border directly to `#111111` with no fuzzy outer glow. Text color: `#111111`, placeholder: `#9CA3AF`.
- **Checkboxes & Radios:** 16px square/circle, 1px `#D1D5DB` frame. Active selected state fills `#111111` with a crisp white check or center pip.

### Status Indicators & Anomaly Chips
- **Low Risk / Operational:** `#F0FDF4` background, `#166534` text, 1px border `#BBF7D0`. Accompanied by a 6px solid `#06C167` marker dot.
- **Moderate Risk / Under Audit:** `#FFFBEB` background, `#B45309` text, 1px border `#FDE68A`.
- **Critical Anomaly:** `#FEF2F2` background, `#B91C1C` text, 1px border `#FECACA`. Font set to `label-sm` with tabular tracking.

### Data Tables
- **Header Row:** Flat `#F9FAFB` fill, 36px height, 1px `#E5E7EB` bottom border. Labels use `label-sm` in `#4B5563` uppercase.
- **Data Rows:** `#FFFFFF` background, 44px height for high density or 52px for ledger review. Row hover state: `#F9FAFB`. Border bottom: 1px `#F3F4F6`.
- **Numerical Alignment:** Right-aligned with OpenType tabular figures (`font-variant-numeric: tabular-nums`).

### Cards & Analytical Panels
- **Structure:** Crisp white `#FFFFFF` surface enclosed by a 1px `#E5E7EB` border.
- **Header Area:** Integrated 16px vertical padding separated from content body by a subtle 1px internal divider or pure structural whitespace. Zero drop shadows.