/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Magento Hyva theme cleanup.
 * Selectors from captured DOM of https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove demo store notice banner (blocks visual parsing)
    WebImporter.DOMUtils.remove(element, ['.message.demo']);

    // Remove inline styles and scripts that block parsing
    WebImporter.DOMUtils.remove(element, ['style', 'script', 'noscript']);

    // Remove recommended products Alpine.js blocks (dynamic, not authorable)
    WebImporter.DOMUtils.remove(element, ['[id*="recs_block"]']);

    // Remove page messages container (dynamic flash messages)
    WebImporter.DOMUtils.remove(element, ['.page.messages']);

    // Remove empty contentarea anchor
    const contentarea = element.querySelector('#contentarea');
    if (contentarea) contentarea.remove();
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable site shell elements
    WebImporter.DOMUtils.remove(element, [
      'header.page-header',
      'footer.page-footer',
      'nav',
      'iframe',
      'link',
    ]);

    // Clean up data attributes from PageBuilder
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-pb-style');
      el.removeAttribute('data-content-type');
      el.removeAttribute('data-appearance');
      el.removeAttribute('data-element');
      el.removeAttribute('data-background-images');
      el.removeAttribute('data-background-type');
      el.removeAttribute('data-enable-parallax');
      el.removeAttribute('data-parallax-speed');
      el.removeAttribute('data-video-loop');
      el.removeAttribute('data-video-play-only-visible');
      el.removeAttribute('data-video-lazy-load');
      el.removeAttribute('data-video-fallback-src');
      el.removeAttribute('x-data');
      el.removeAttribute('x-init');
      el.removeAttribute('x-intersect');
      el.removeAttribute('x-show');
      el.removeAttribute('x-if');
      el.removeAttribute('x-for');
      el.removeAttribute('x-bind');
      el.removeAttribute('x-on');
      el.removeAttribute('x-cloak');
    });
  }
}
