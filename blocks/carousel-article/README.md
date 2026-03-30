# Carousel Article Block

## Overview
A sliding carousel that displays article cards with images, titles, descriptions, and "Read More" links. Supports navigation via arrows and dot indicators.

## Content Model

| Column 1 | Column 2 |
|-----------|----------|
| Article image | H2 title + description paragraphs + CTA link |

Each row represents one slide. The block supports any number of slides.

## Configuration
- Slides use `scroll-snap-type: x mandatory` for smooth snapping behavior.
- Navigation arrows appear when there are 2+ slides.
- Dot indicators show current slide position.
- Slide content overlays the image with a semi-transparent dark background (`rgba(19 19 19 / 75%)`).
- At 600px+ viewport, slide content takes up half the width with 92px margin.

## Behavior
- Each row is transformed into a slide (`<li>`) within a scrollable list.
- The first column becomes the slide image (positioned absolutely as background).
- The second column becomes the slide content (positioned with z-index above image).
- `IntersectionObserver` tracks the active slide and updates indicators.
- Previous/Next buttons navigate between slides with smooth scrolling.
- Keyboard accessible with proper ARIA attributes (`role="region"`, `aria-roledescription="Carousel"`).

## Integration
- Slide indicators use `data-target-slide` attributes for navigation.
- Active slide tracked via `data-active-slide` on the block element.
- Each slide has a unique ID: `carousel-article-{carouselId}-slide-{index}`.

## Error Handling
- Single-slide mode: navigation controls are hidden when only one slide exists.
- Missing images: slides render with content only (no background).
- Slides without headings: `aria-labelledby` is skipped gracefully.
