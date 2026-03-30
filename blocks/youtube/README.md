# YouTube Block

Embeds a YouTube video using a **privacy-oriented** `youtube-nocookie.com` iframe. The iframe loads only when the block scrolls into view (Intersection Observer).

## Authoring

### Block (table)

Add a **YouTube** block with a single cell containing a normal link to the video (`youtube.com/watch?v=…` or `youtu.be/…`).

| YouTube |
|---------|
| [Link to your video](https://www.youtube.com/watch?v=VIDEO_ID) |

The first matching link in the block is used (`youtube.com` or `youtu.be`).

### Inline link (author-kit `linkBlocks`)

YouTube links in prose are auto-decorated via `buildLinkBlocksFromMain` in `scripts/scripts.js` (patterns in `linkBlocks`). Links inside a table-authored `div.youtube` wrapper are skipped.

## Behavior

- The link is replaced by a responsive 16:9 container and an embed URL: `https://www.youtube-nocookie.com/embed/{id}`.
- Query parameters on the author link (except `v`) are preserved on the embed; `rel=0` is appended to reduce related-video leakage.
- For `youtu.be/SHORT_ID`, the last path segment is treated as the video id.

## Dependencies

- `scripts/utils/observer.js` — lazy-loads the iframe when the placeholder enters the viewport.

## Variants

None. Use the base `YouTube` block name.
