/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner variant.
 * Base block: hero
 * Source: https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 * Source selectors: .home-banner (data-content-type="row" with data-background-images)
 * Hero block: 1 column, Row 1 = background image, Row 2 = title + subheading + CTAs (all in single cell)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: Background image
  // Source uses data-background-images JSON attribute on .home-banner
  const bgImagesAttr = element.getAttribute('data-background-images')
    || element.querySelector('[data-background-images]')?.getAttribute('data-background-images');

  if (bgImagesAttr) {
    try {
      const decoded = bgImagesAttr.replace(/\\&quot;/g, '"').replace(/\\"/g, '"');
      const bgData = JSON.parse(decoded);
      const imageUrl = bgData.desktop_image || bgData.mobile_image || Object.values(bgData)[0];
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Hero background';
        cells.push([img]);
      }
    } catch (e) {
      // Fallback: look for an img element
      const fallbackImg = element.querySelector('img');
      if (fallbackImg) cells.push([fallbackImg]);
    }
  }

  // Row 2: Title + Subheading + CTA buttons - ALL in a single cell wrapped in a div
  const contentDiv = document.createElement('div');

  // H1 heading - source: h1[data-content-type="heading"]
  const heading = element.querySelector('h1, h2.text-3xl');
  if (heading) contentDiv.append(heading);

  // H2 subheading - source: h2[data-content-type="heading"] (second heading)
  const subheading = element.querySelector('h2:not(.text-3xl), h3');
  if (subheading) contentDiv.append(subheading);

  // CTA links - source: a.pagebuilder-button-primary, a.pagebuilder-button-secondary
  const ctaLinks = element.querySelectorAll('a.pagebuilder-button-primary, a.pagebuilder-button-secondary, a[data-content-type="button-item"]');
  ctaLinks.forEach((link) => contentDiv.append(link));

  if (contentDiv.childNodes.length > 0) {
    cells.push([contentDiv]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
