import observe from '../../scripts/utils/observer.js';

function renderIframe(el) {
  el.innerHTML = `<iframe src="${el.dataset.src}" class="youtube"
  webkitallowfullscreen mozallowfullscreen allowfullscreen
  allow="encrypted-media; accelerometer; gyroscope; picture-in-picture"
  scrolling="no"
  title="Youtube Video">`;
}

/**
 * Maps a YouTube anchor URL to a lazy-loaded nocookie embed (author-kit init).
 * @param {HTMLAnchorElement} a
 */
function embedFromAnchor(a) {
  const div = document.createElement('div');
  div.className = 'video';
  const params = new URLSearchParams(a.search);
  const id = params.get('v') || a.pathname.split('/').pop();
  if (!id) return;
  params.append('rel', '0');
  params.delete('v');
  div.dataset.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
  a.parentElement.replaceChild(div, a);
  observe(div, renderIframe);
}

/**
 * Block loader passes the block root; authored content is a YouTube link in a cell.
 * @param {Element} block
 */
export default function decorate(block) {
  const a = block.querySelector('a[href*="youtube.com"], a[href*="youtu.be"]');
  if (!a) return;
  embedFromAnchor(a);
}
