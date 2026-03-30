const io = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      entry.target.callback(entry.target);
    }
  });
});

/**
 * Lazy-invoke callback when element enters the viewport (author-kit pattern).
 * @param {Element} el
 * @param {(el: Element) => void} callback
 */
export default function observe(el, callback) {
  el.callback = callback;
  io.observe(el);
}
