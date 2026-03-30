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
  const outer = document.createElement('div');
  outer.className = 'youtube';
  const div = document.createElement('div');
  div.className = 'video';
  const params = new URLSearchParams(a.search);
  const id = params.get('v') || a.pathname.split('/').pop();
  if (!id) return;
  params.append('rel', '0');
  params.delete('v');
  div.dataset.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
  outer.append(div);
  a.parentElement.replaceChild(outer, a);
  observe(div, renderIframe);
}

/**
 * Resolve YouTube link: anchor-as-block (author-kit linkBlocks) or wrapper + inner link.
 * @param {Element} block
 * @returns {HTMLAnchorElement | null}
 */
function getYoutubeAnchor(block) {
  if (block.tagName === 'A' && block.href) {
    const { href } = block;
    if (href.includes('youtube.com') || href.includes('youtu.be')) {
      return block;
    }
    return null;
  }
  return block.querySelector('a[href*="youtube.com"], a[href*="youtu.be"]');
}

/**
 * Block loader passes the block root; authored content is a YouTube link in a cell.
 * Block may be the `<a>` itself when matched by scripts `linkBlocks` (see scripts.js).
 * @param {Element} block
 */
export default function decorate(block) {
  const a = getYoutubeAnchor(block);
  if (!a) return;
  embedFromAnchor(a);
}
