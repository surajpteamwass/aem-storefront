# Product List Page Block

## Overview

The Product List Page block provides a comprehensive product discovery interface with search results, faceted filtering, sorting, pagination, and product actions. It supports both category-based product browsing and search query-based product discovery, integrating with product discovery dropins, cart management, and wishlist functionality.

## Integration

### Block Configuration

| Configuration Key | Type | Default | Description | Required | Side Effects |
|-------------------|------|---------|-------------|----------|--------------|
| `urlpath` | string | `undefined` | Category path for filtering products by category | No | When provided, block operates in category mode and filters products by `categoryPath` |

### URL Parameters

- `q` - Search query phrase for search-based product discovery
- `page` - Current page number for pagination (default: 1)
- `sort` - Sort parameters in format `attribute_direction` (e.g., `price_ASC`, `name_DESC`). Multiple sorts separated by commas. Default: `position_DESC`
- `filter` - Filter parameters in format `attribute:value` separated by `|` (e.g., `categoryPath:shoes|price:10-50`). Supports array values (comma-separated), range values (dash-separated), and single values
- `pageSize` - Number of items per page (default: 8, options: 8, 12, 24, 48)

<!-- ### Local Storage

No localStorage keys are used by this block. -->

### Events

#### Event Listeners

- `events.on('search/result', callback, { eager: true })` - Handles search results before block rendering. Updates result count display, empty state, and filter count badge
- `events.on('search/result', callback, { eager: false })` - Handles search results after block rendering. Updates URL parameters with current search state using `pushState`

#### Event Emitters

This block does not directly emit custom events, but uses dropin containers that may emit events.

## Behavior Patterns

### Page Context Detection

- **Category Page Mode**: When `urlpath` configuration is provided, the block searches all products in the specified category with `categoryPath` filter. Search phrase is empty.
- **Search Page Mode**: When no `urlpath` is provided, the block uses the `q` URL parameter for search-based product discovery.
- **Empty State**: When `totalCount` is 0, block adds `product-list-page--empty` class and hides all controls except product list area.
- **Desktop vs Mobile**: On mobile (< 768px), facets are hidden by default and shown via toggle button. On desktop (≥ 768px), facets are always visible in sidebar layout.

### User Interaction Flows

1. **Initialization**: Block reads URL parameters, determines category or search mode, performs initial search, and renders all dropin containers (SortBy, Facets, SearchResults, Pagination)
2. **Product Filtering**: Users can apply filters via facets, which update URL parameters and trigger new search requests
3. **Sorting**: Users can change sort order via SortBy dropdown, which updates URL and triggers new search
4. **Pagination**: Users can navigate pages via Pagination component, which scrolls to top and updates URL
5. **Page Size Selection**: Users can change items per page via dropdown, which resets to page 1 and updates URL
6. **Product Actions**: Users can add products to cart (directly for simple products, or navigate to PDP for complex products) and toggle wishlist items
7. **Facet Toggle**: On mobile, users can toggle facet visibility via "Filters" button, which shows badge count when filters are active
8. **URL Synchronization**: All search state changes (filters, sort, page, pageSize) are synchronized with URL parameters via `pushState`

### Error Handling

- **Search Errors**: Catches and logs search API errors with `console.error('Error searching for products')`
- **Missing Configuration**: Gracefully handles missing `urlpath` by defaulting to search mode
- **Invalid URL Parameters**: Handles missing or invalid URL parameters with sensible defaults (page: 1, pageSize: 8, sort: position_DESC)
- **Empty Results**: Displays empty state with simplified layout when no products are found
- **Product Image Errors**: Uses `tryRenderAemAssetsImage` for graceful image rendering fallback
- **Fallback Behavior**: Always falls back to appropriate defaults and continues to function even with missing data

