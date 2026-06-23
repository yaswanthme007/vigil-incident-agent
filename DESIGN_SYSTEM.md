# Sentinel AI Design System

## Phase

This document defines the Phase 0 visual foundation only.

## Theme

- Background: `#0A0A0A`
- Surface: `#111827`
- Primary: `#2563EB`
- Success: `#22C55E`
- Danger: `#EF4444`

## Design Tokens

### Color Tokens

- `--background`
- `--foreground`
- `--surface`
- `--surface-foreground`
- `--primary`
- `--primary-foreground`
- `--success`
- `--success-foreground`
- `--danger`
- `--danger-foreground`
- `--muted`
- `--muted-foreground`
- `--border`
- `--border-strong`
- `--grid`
- `--glow`

### Typography

- Sans: Geist
- Mono: Geist Mono
- Headings: Geist

### Radius

- `--radius`: `1rem`
- Utility scale exposed through `--radius-sm` to `--radius-4xl`

### Core Utilities

- `.surface-panel`: shared elevated panel container
- `.page-shell`: responsive outer page wrapper
- `.eyebrow-label`: compact uppercase helper label

## Layout

Phase 0 shell includes:

- Navbar placeholder
- Sidebar placeholder
- Main content area

## Accessibility Notes

- Dark color scheme is declared at the root
- Main content uses semantic `<main>`
- Sidebar uses semantic `<aside>`
- Placeholder sections use headings and labels for screen readers

## Folder Intent

- `src/app`: routes and global layout
- `src/components`: reusable UI and shell components
- `src/hooks`: future reusable hooks
- `src/lib`: tokens and shared utilities
- `src/services`: future service layer
- `src/types`: future shared TypeScript types
- `public`: static assets
