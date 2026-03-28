/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category variant.
 * Base block: cards
 * Source: https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 * Source selectors: .container.pt-8.px-8 .category-box
 * Cards block: 2 columns per row. Cell 1 = image, Cell 2 = title + link
 * Source uses data-background-images on .pagebuilder-banner-wrapper (not <img> elements)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all banner elements within the category-box container
  const banners = element.querySelectorAll('[data-content-type="banner"]');

  banners.forEach((banner) => {
    // Cell 1: Image from data-background-images on .pagebuilder-banner-wrapper
    const wrapper = banner.querySelector('.pagebuilder-banner-wrapper')
      || banner.querySelector('[data-background-images]');
    let img = null;

    if (wrapper) {
      const bgAttr = wrapper.getAttribute('data-background-images');
      if (bgAttr) {
        try {
          const decoded = bgAttr.replace(/\\&quot;/g, '"').replace(/\\"/g, '"');
          const bgData = JSON.parse(decoded);
          const imageUrl = bgData.desktop_image || bgData.mobile_image || Object.values(bgData)[0];
          if (imageUrl) {
            img = document.createElement('img');
            img.src = imageUrl;
            // Use h3 text as alt if available
            const titleEl = banner.querySelector('h3, h2, [data-element="content"] h3');
            img.alt = titleEl ? titleEl.textContent.trim() : 'Category image';
          }
        } catch (e) {
          img = banner.querySelector('img');
        }
      }
    }

    if (!img) {
      img = banner.querySelector('img');
    }

    // Cell 2: Title (h3) + link
    const contentDiv = document.createElement('div');

    const title = banner.querySelector('h3, [data-element="content"] h3');
    if (title) contentDiv.append(title);

    // Get the link wrapping the banner
    const link = banner.querySelector('a[href]');
    if (link && title) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = title.textContent.trim();
      contentDiv.append(a);
    } else if (link) {
      contentDiv.append(link);
    }

    if (img || contentDiv.childNodes.length > 0) {
      cells.push([img || '', contentDiv]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
