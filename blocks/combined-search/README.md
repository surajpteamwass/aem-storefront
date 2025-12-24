# Combined Search Block

## Overview

The Combined Search block provides a unified search interface that combines commerce (product) search and content search in a tabbed interface. It supports product filtering, sorting, pagination, and content search with seamless tab navigation between commerce and content results.

## Integration

### Block Configuration

| Configuration Key | Type | Default | Description | Required | Side Effects |
|-------------------|------|---------|-------------|----------|--------------|
| `urlpath` | string | `undefined` | Category path for category page filtering. When provided, the block displays products filtered by this category path. | No | When set, filters products by category and changes behavior from search page to category page |

### URL Parameters

The block reads and manages the following URL parameters:

| Parameter | Type | Format | Description | Example |
|-----------|------|--------|-------------|---------|
| `q` | string | Plain text | Search query phrase for product and content search | `?q=shoes` |
| `page` | number | Integer | Current page number for pagination | `?page=2` |
| `sort` | string | `attribute_direction,attribute_direction` | Sort parameters for product results | `?sort=price_ASC,position_DESC` |
| `filter` | string | `attribute:value\|attribute:value1,value2\|attribute:from-to` | Filter parameters for product results | `?filter=category:shoes\|price:10-100` |

**Note**: The block automatically syncs these parameters with the URL when search results change.

### Local Storage

No localStorage keys are used by this block.

### Events

#### Event Listeners

- **`search/result`** (eager: true): Listens for search results to update result info display and filter count badge
- **`search/result`** (eager: false): Listens for search results to update URL parameters with current search state

#### Event Emitters

No events are emitted by this block.

## Behavior Patterns

### Page Context Detection

- **Category Page**: When `urlpath` configuration is provided, the block operates in category browsing mode:
  - Filters products by the specified category path
  - Uses position-based sorting by default
  - Displays all products in the category (empty search phrase)
  
- **Search Page**: When `urlpath` is not provided, the block operates in search mode:
  - Uses the `q` URL parameter as the search phrase
  - Supports full-text product search
  - Displays search results matching the query

### User Interaction Flows

1. **Initial Load**:
   - Block detects page context (category vs search) from configuration
   - Reads URL parameters for initial state
   - Loads commerce search results based on context
   - Loads content results after 500ms delay

2. **Tab Navigation**:
   - User clicks "Commerce" or "Content" tab
   - Active tab and panel are updated
   - Content panel displays filtered content results
   - Commerce panel displays product search results

3. **Product Search Interaction**:
   - User applies filters via facets → URL updates with filter parameters
   - User changes sort order → URL updates with sort parameters
   - User navigates pages → URL updates with page number
   - User searches → URL updates with query parameter
   - All changes trigger new search requests

4. **Content Search**:
   - Content results filter based on search query (if present)
   - Results display title and last modified date
   - Clicking a result navigates to the content page

5. **Product Actions**:
   - Add to Cart: Simple products add directly; complex products link to PDP
   - Wishlist Toggle: Users can add/remove products from wishlist

### Responsive Behavior

- **Mobile (< 768px)**:
  - Stacked layout with all elements in single column
  - Facets are hidden by default with toggle button
  - Filter count badge displayed on facets button
  
- **Desktop (≥ 768px)**:
  - Sidebar layout with facets always visible
  - Two-column grid: facets sidebar + product list
  - Facets toggle button hidden

## Error Handling

- **Content Index Fetch Errors**: If `/content-index.json` fails to load:
  - Error is logged to console
  - Content panel displays: "Error loading content results."
  - Commerce search continues to function normally

- **Content Index Format Errors**: If content index data is malformed or missing:
  - Checks for valid data structure (`data.data` array)
  - Displays "No content found." if structure is invalid
  - Gracefully handles missing or undefined properties

- **Search Errors**: If product search fails:
  - Error is logged to console
  - Search continues with previous results or empty state
  - User can retry by changing filters or search query

- **Empty State Handling**: 
  - When no products found: Block adds `product-list-page--empty` class
  - Hides all controls except product list area
  - Displays appropriate "No results" message

- **Configuration Errors**: 
  - If `readBlockConfig()` fails, block defaults to search page mode
  - Missing `urlpath` is handled gracefully (treats as search page)

- **URL Parameter Errors**:
  - Invalid page numbers default to page 1
  - Malformed sort/filter parameters are ignored
  - Missing parameters use sensible defaults

- **Fallback Behavior**: 
  - Always falls back to search page mode if category configuration is invalid
  - Content search failures don't affect commerce search functionality
  - Tab switching always works even if one panel has errors

## Dependencies

- `@dropins/storefront-product-discovery`: Product search, facets, sorting, pagination
- `@dropins/storefront-wishlist`: Wishlist functionality
- `@dropins/storefront-cart`: Add to cart functionality
- `@dropins/tools`: UI components and utilities
- Event bus (`@dropins/tools/event-bus.js`): Inter-component communication
- AEM Assets: Product image rendering with SKU aliases

## Styling

The block uses CSS custom properties for theming:
- `--spacing-*`: Spacing variables (xxsmall, xsmall, small, medium, large)
- `--color-brand-*`: Brand colors (700 for active states)
- `--color-neutral-*`: Neutral colors (100, 300, 600, 900)

Key CSS classes:
- `.search__tabs`: Tab navigation container
- `.search__tab--active`: Active tab state
- `.search__panel--active`: Active panel state
- `.search__facets--visible`: Visible facets state (mobile)
- `.product-list-page--empty`: Empty state modifier
