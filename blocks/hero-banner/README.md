# Hero Banner Block

## Overview
A full-width hero section with a background image, heading, subheading, and call-to-action buttons. Used for prominent page-level messaging at the top of landing pages.

## Content Model

| Row | Content |
|-----|---------|
| 1   | Background image |
| 2   | H1 heading, H2 subheading, CTA link(s) |

## Configuration
- **`no-image` class**: Automatically added when no image is present in the first row. Switches text color from white (overlay) to default text color.

## Behavior
- Background image is positioned absolutely behind the content using CSS `z-index: -1`.
- Text and CTAs are centered within a max-width container (1200px).
- Minimum height of 300px ensures the hero has visual presence even with short content.
- Responsive padding adjusts at the 900px breakpoint.

## Error Handling
- If no background image is provided, the block gracefully falls back to a text-only display with the `no-image` variant applied automatically.
