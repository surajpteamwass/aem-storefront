# Combined Search Block

A unified search component that combines commerce (product) search and content search in a tabbed interface.

## Features

### Dual Search Interface
- **Tabbed Navigation**: Switch between "Commerce" and "Content" search results
- **Commerce Tab**: Full-featured product search with filtering, sorting, and pagination
- **Content Tab**: Content search results from the content index

### Commerce Search Features
- **Product Search**: Search products by phrase or browse by category
- **Facets**: Filter products by attributes (categories, price ranges, etc.)
  - Mobile: Collapsible facets panel with toggle button
  - Desktop: Always-visible sidebar facets
  - Filter count badge on the facets button
- **Sorting**: Sort products by various attributes (position, price, name, etc.)
- **Pagination**: Navigate through multiple pages of results
- **Product Actions**:
  - Add to Cart (direct add for simple products, link to PDP for complex products)
  - Wishlist toggle
- **Product Images**: AEM Assets integration with product SKU aliases
- **URL State Management**: Search parameters (query, page, sort, filters) are synced with URL

### Content Search Features
- **Content Index Integration**: Fetches and filters content from `/content-index.json`
- **Search Filtering**: Filters content by title and description based on search query
- **Content Display**: Shows content title and last modified date
- **Lazy Loading**: Content results load after commerce results (500ms delay)

### Additional Features
- **Category Page Support**: Can display products filtered by category path
- **Search Page Support**: Can display products based on search query
- **Empty State Handling**: Gracefully handles no results scenarios
- **Responsive Design**: 
  - Mobile: Stacked layout with collapsible facets
  - Desktop: Sidebar layout with persistent facets
- **Event Bus Integration**: Listens to and emits search events for inter-component communication
- **URL Parameter Support**:
  - `q`: Search query phrase
  - `page`: Current page number
  - `sort`: Sort parameters (format: `attribute_direction,attribute_direction`)
  - `filter`: Filter parameters (format: `attribute:value|attribute:value1,value2|attribute:from-to`)

## Configuration

The block accepts configuration via `readBlockConfig()`:

- `urlpath`: Category path for category page filtering

## Usage

Add the block to your page:

```html
<div class="combined-search"></div>
```

The block will automatically:
1. Detect if it's a category page (via `urlpath` config) or search page
2. Load initial search results based on URL parameters
3. Render commerce and content search interfaces
4. Handle user interactions (filtering, sorting, pagination, tab switching)

## Dependencies

- `@dropins/storefront-product-discovery`: Product search, facets, sorting, pagination
- `@dropins/storefront-wishlist`: Wishlist functionality
- `@dropins/storefront-cart`: Add to cart functionality
- `@dropins/tools`: UI components and utilities
- Event bus for inter-component communication
- AEM Assets for product images

## Styling

The block uses CSS custom properties for theming:
- `--spacing-*`: Spacing variables
- `--color-brand-*`: Brand colors
- `--color-neutral-*`: Neutral colors

Key CSS classes:
- `.search__tabs`: Tab navigation container
- `.search__tab--active`: Active tab state
- `.search__panel--active`: Active panel state
- `.search__facets--visible`: Visible facets state (mobile)
- `.product-list-page--empty`: Empty state modifier

