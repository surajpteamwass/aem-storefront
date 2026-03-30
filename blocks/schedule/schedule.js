import ENV from '../../scripts/utils/env.js';
import { loadFragment } from '../fragment/fragment.js';

function log(...args) {
  if (ENV !== 'prod') {
    // eslint-disable-next-line no-console
    console.warn('[schedule]', ...args);
  }
}

async function removeSchedule(a, e) {
  if (ENV === 'prod') {
    a.remove();
    return;
  }
  if (e) log(e);
  log(`Could not load: ${a.href}`);
}

/**
 * Resolve fragment path string to a pathname for loadFragment.
 * @param {string} fragment Fragment URL or path from schedule JSON
 * @returns {string}
 */
function fragmentToPath(fragment) {
  try {
    const u = new URL(fragment, window.location.origin);
    return u.pathname;
  } catch {
    return fragment.startsWith('/') ? fragment : `/${fragment}`;
  }
}

async function loadLocalizedEvent(event) {
  if (!event?.fragment) return null;
  const path = fragmentToPath(event.fragment);
  try {
    const fragment = await loadFragment(path);
    return fragment;
  } catch {
    log(`Error fetching ${path} fragment`);
    return null;
  }
}

/**
 * Determine what ancestor to replace with the fragment
 *
 * @param {Element} a the fragment link
 * @returns {Element} the element that can be replaced
 */
function getReplaceEl(a) {
  let current = a;
  const ancestor = a.closest('.section');

  while (current && current !== ancestor) {
    const childCount = current.parentElement.children.length;
    if (childCount <= 1) {
      current = current.parentElement;
    } else {
      break;
    }
  }

  return current;
}

async function loadEvent(a, event, defEvent) {
  if (!event.fragment) {
    a.remove();
    return;
  }

  let fragment = await loadLocalizedEvent(event);
  if (!fragment) fragment = await loadLocalizedEvent(defEvent);
  if (!fragment) {
    await removeSchedule(a);
    return;
  }
  const elToReplace = getReplaceEl(a);
  const sections = fragment.querySelectorAll(':scope > .section');
  const children = sections.length === 1
    ? fragment.querySelectorAll(':scope > *')
    : [fragment];
  Array.from(children).forEach((child) => {
    elToReplace.insertAdjacentElement('afterend', child);
  });
  elToReplace.remove();
}

function getDate() {
  const now = Date.now();
  if (ENV === 'prod') return now;

  const sim = localStorage.getItem('aem-schedule')
    || new URL(window.location.href).searchParams.get('schedule');
  return sim * 1000 || now;
}

/**
 * @param {HTMLAnchorElement} a Link whose href points to schedule JSON
 */
async function runSchedule(a) {
  const resp = await fetch(a.href);
  if (!resp.ok) {
    await removeSchedule(a);
    return;
  }
  const { data } = await resp.json();
  data.reverse();
  const now = getDate();
  const found = data.find((evt) => {
    try {
      const start = Date.parse(evt.start);
      const end = Date.parse(evt.end);
      return now > start && now < end;
    } catch {
      log(`Could not get scheduled event: ${evt.name}`);
      return false;
    }
  });

  const defEvent = data.find((evt) => !(evt.start && evt.end));

  const event = found || defEvent;
  if (!event) {
    await removeSchedule(a);
    return;
  }

  await loadEvent(a, event, defEvent);
}

/**
 * Resolve schedule link: author-kit passes the anchor as the block root for
 * `linkBlocks` auto-init; table-authored blocks pass a wrapper with an inner link.
 * @param {Element} block
 * @returns {HTMLAnchorElement | null}
 */
function getScheduleAnchor(block) {
  if (block.tagName === 'A' && block.hasAttribute('href')) {
    return block;
  }
  return block.querySelector('a[href]');
}

/**
 * Schedule block: loads JSON from the first link, picks the active time window
 * (or a default entry without start/end), then inlines the matching fragment.
 * @param {Element} block Block wrapper or `<a>` (author-kit linkBlocks pattern)
 */
export default async function decorate(block) {
  const a = getScheduleAnchor(block);
  if (!a) return;
  await runSchedule(a);
}
