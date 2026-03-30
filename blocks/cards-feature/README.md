# Cards Feature Block

## Overview
Displays a grid of feature cards, each with an icon image, title, and description. Used to highlight product differentiators or key benefits.

## Content Model

| Column 1 | Column 2 |
|-----------|----------|
| Icon/feature image | H2 title + description paragraph |

Each row represents one feature card. The block supports any number of cards.

## Configuration
- Grid layout uses `auto-fill` with a minimum column width of 257px.
- Cards have a 1px border and 24px gap between items.
- Images use a 4:3 aspect ratio with `object-fit: cover`.

## Behavior
- The JavaScript decorator transforms rows into an unordered list (`<ul>/<li>`) structure.
- Columns containing only a `<picture>` element get the `cards-feature-card-image` class.
- All other columns get the `cards-feature-card-body` class.
- Images are replaced with optimized picture elements via `createOptimizedPicture`.

## Error Handling
- If an icon image is missing, the card still renders with the title and description.
- The grid adapts to available space, wrapping cards as needed.
