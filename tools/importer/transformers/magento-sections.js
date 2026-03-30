/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Magento Hyva theme section breaks and section-metadata.
 * Selectors from captured DOM of https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 * Runs in afterTransform only. Uses payload.template.sections.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { template } = payload;
    if (!template || !template.sections || template.sections.length < 2) return;

    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
    const doc = element.ownerDocument || document;

    // Process sections in reverse order to avoid shifting indices
    const sections = [...template.sections].reverse();

    sections.forEach((section) => {
      // Find the section element using selector(s)
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = element.querySelector(sel);
        if (sectionEl) break;
      }

      if (!sectionEl) return;

      // Add section-metadata block if section has a style
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(sectionMetadata);
      }

      // Add section break (<hr>) before section if it's not the first
      if (section.id !== template.sections[0].id) {
        const hr = doc.createElement('hr');
        sectionEl.before(hr);
      }
    });
  }
}
