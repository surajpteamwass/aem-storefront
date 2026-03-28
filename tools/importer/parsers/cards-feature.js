/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-feature variant.
 * Base block: cards
 * Source: https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 * Source selectors: .container.py-8.px-8 [data-content-type="row"]
 * Cards block: 2 columns per row. Cell 1 = icon image, Cell 2 = title + description
 * Source has 5 .pagebuilder-column elements but first is heading-only (no figure).
 * Filter for columns with .main-box-height class which have figure + h2 + text.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find feature columns - those with main-box-height class have icon + title + description
  const featureColumns = element.querySelectorAll('.pagebuilder-column.main-box-height');

  featureColumns.forEach((col) => {
    // Cell 1: Icon image from figure[data-content-type="image"] img
    const img = col.querySelector('figure[data-content-type="image"] img, figure img, img');

    // Cell 2: Title (h2) + Description (p)
    const contentDiv = document.createElement('div');

    const title = col.querySelector('h2');
    if (title) contentDiv.append(title);

    // Description paragraph - may be inside div[data-content-type="text"] or directly
    const textContainer = col.querySelector('div[data-content-type="text"]');
    const desc = textContainer
      ? textContainer.querySelector('p')
      : col.querySelector('p');
    if (desc) contentDiv.append(desc);

    if (img || contentDiv.childNodes.length > 0) {
      cells.push([img || '', contentDiv]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
