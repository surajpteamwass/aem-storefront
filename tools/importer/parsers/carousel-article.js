/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-article variant.
 * Base block: carousel
 * Source: https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 * Source selectors: .pb-1.top-bottom-padding [data-content-type="slider"]
 * Carousel block: 2 columns per row. Cell 1 = slide image, Cell 2 = title + description + CTA
 * Each slide is .explore-slider[data-content-type="slide"] with deeply nested content.
 * Has dual titles (h2.desktop-title + h2.mobile-title) - use desktop-title.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all slides within the slider
  const slides = element.querySelectorAll('.explore-slider[data-content-type="slide"], [data-content-type="slide"]');

  slides.forEach((slide) => {
    // Cell 1: Image from figure[data-content-type="image"] img
    // Image is inside .knowledge-center-image column
    const img = slide.querySelector('figure[data-content-type="image"] img.pagebuilder-mobile-hidden')
      || slide.querySelector('figure[data-content-type="image"] img')
      || slide.querySelector('figure img');

    // Cell 2: Title + descriptions + Read More link
    const contentDiv = document.createElement('div');

    // Desktop title (prefer .desktop-title over .mobile-title to avoid duplication)
    const desktopTitle = slide.querySelector('h2.desktop-title');
    const mobileTitle = slide.querySelector('h2.mobile-title');
    const title = desktopTitle || mobileTitle || slide.querySelector('.knowledge-mobile h2') || slide.querySelector('h2');
    if (title) contentDiv.append(title);

    // Description paragraphs - inside div[data-content-type="text"]
    const textDivs = slide.querySelectorAll('.knowledge-mobile div[data-content-type="text"], .gap-16 div[data-content-type="text"]');
    if (textDivs.length > 0) {
      textDivs.forEach((textDiv) => {
        const p = textDiv.querySelector('p');
        if (p) contentDiv.append(p);
      });
    } else {
      // Fallback: get paragraphs directly
      const paragraphs = slide.querySelectorAll('div[data-content-type="text"] p');
      paragraphs.forEach((p) => contentDiv.append(p));
    }

    // Read More CTA link
    const ctaLink = slide.querySelector('a.pagebuilder-button-primary, a.pagebuilder-button-secondary')
      || slide.querySelector('.knowledge-mobile a[href]');
    if (ctaLink) contentDiv.append(ctaLink);

    if (img || contentDiv.childNodes.length > 0) {
      cells.push([img || '', contentDiv]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-article', cells });
  element.replaceWith(block);
}
