# Cards Category Block

## Overview
Displays a grid of category cards, each with an image and a title/link. Used for navigating product categories or content sections.

## Content Model

| Column 1 | Column 2 |
|-----------|----------|
| Category image | H3 category name + link |

Each row represents one card. The block supports any number of cards.

## Configuration
- Grid layout uses `auto-fill` with a minimum column width of 257px.
- Cards have a 1px border and 24px gap between items.
- Images use a 4:3 aspect ratio with `object-fit: cover`.

## Behavior
- The JavaScript decorator transforms rows into an unordered list (`<ul>/<li>`) structure.
- Columns containing only a `<picture>` element get the `cards-category-card-image` class.
- All other columns get the `cards-category-card-body` class.
- Images are replaced with optimized picture elements via `createOptimizedPicture`.

## Error Handling
- If an image is missing, the card still renders with the text content.
- The grid adapts to available space, wrapping cards as needed.
