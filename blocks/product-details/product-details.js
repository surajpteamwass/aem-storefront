import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';

import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Cart Dropin
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { render as CartProvider } from '@dropins/storefront-cart/render.js';

// Libs
import {
  rootLink,
  setJsonLd,
  fetchPlaceholders,
  getProductLink,
} from '../../scripts/commerce.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';

/**
 * Checks if the page has prerendered product JSON-LD data
 * @returns {boolean} True if product JSON-LD exists and contains @type=Product
 */
function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

// Function to update the Add to Cart button text
function updateAddToCartButtonText(addToCartInstance, inCart, labels) {
  const buttonText = inCart
    ? labels.Global?.UpdateProductInCart
    : labels.Global?.AddProductToCart;
  if (addToCartInstance) {
    addToCartInstance.setProps((prev) => ({
      ...prev,
      children: buttonText,
    }));
  }
}

export default async function decorate(block) {
  const product = events.lastPayload('pdp/data') ?? null;
  const labels = await fetchPlaceholders();

  // Read itemUid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');

  // State to track if we are in update mode
  let isUpdateMode = false;

  const cartItem = JSON.parse(
    sessionStorage.getItem('DROPIN__CART__CART__DATA'),
  )?.items?.find((el) => {
    // Match by topLevelSku for configurable products
    if (el.topLevelSku === product.sku) {
      // If optionsUIDs exist, also match those to ensure correct variant
      if (product.optionsUIDs && el.selectedOptionsUIDs) {
        const elOptionUIDs = Object.values(el.selectedOptionsUIDs);
        return product.optionsUIDs.every((uid) => elOptionUIDs.includes(uid))
              && product.optionsUIDs.length === elOptionUIDs.length;
      }
      return true;
    }
    // Match by sku for simple products
    return el.sku === product.sku;
  });
  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__alert"></div>
    <div class="product-details__wrapper">
      <div class="product-details__left-column">
        <div class="product-details__gallery"></div>
      </div>
      <div class="product-details__right-column">
        <div class="product-details__header"></div>
        <div class="product-details__price"></div>
        <div class="product-details__warehouse-availability"></div>
        <div class="product-details__gallery"></div>
        <div class="product-details__short-description"></div>
        <div class="product-details__gift-card-options"></div>
        <div class="product-details__configuration">
          <div class="product-details__options"></div>
          <div class="product-details__quantity"></div>
          <div class="product-details__gift-options"></div>
          <div class="product-details__buttons">
            <div class="product-details__buttons__add-to-cart"></div>
            <div class="product-details__buttons__add-to-wishlist"></div>
          </div>
        </div>
        <div class="product-details__description"></div>
        <div class="product-details__attributes"></div>
      </div>
    </div>
  `);

  const $alert = fragment.querySelector('.product-details__alert');
  const $gallery = fragment.querySelector('.product-details__gallery');
  const $header = fragment.querySelector('.product-details__header');
  const $price = fragment.querySelector('.product-details__price');
  const $warehouseAvailability = fragment.querySelector('.product-details__warehouse-availability');
  const $galleryMobile = fragment.querySelector('.product-details__right-column .product-details__gallery');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $options = fragment.querySelector('.product-details__options');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $giftCardOptions = fragment.querySelector('.product-details__gift-card-options');
  const $giftOptions = fragment.querySelector('.product-details__gift-options');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $wishlistToggleBtn = fragment.querySelector('.product-details__buttons__add-to-wishlist');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');

  block.replaceChildren(fragment);

  const gallerySlots = {
    CarouselThumbnail: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
        wrapper: document.createElement('span'),
      });
    },

    CarouselMainImage: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
      });
    },
  };

  // Alert
  let inlineAlert = null;
  const routeToWishlist = '/wishlist';

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    wishlistToggleBtn,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($galleryMobile),

    // Gallery (Desktop)
    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsColumn',
      arrows: true,
      peak: true,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($gallery),

    // Header
    pdpRendered.render(ProductHeader, {})($header),

    // Price
    pdpRendered.render(ProductPrice, {})($price),

    // Short Description
    pdpRendered.render(ProductShortDescription, {})($shortDescription),

    // Configuration - Swatches
    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: (ctx) => {
          tryRenderAemAssetsImage(ctx, {
            ...imageSlotConfig(ctx),
            wrapper: document.createElement('span'),
          });
        },
      },
    })($options),

    // Configuration  Quantity
    pdpRendered.render(ProductQuantity, {})($quantity),

    // Configuration  Gift Card Options
    pdpRendered.render(ProductGiftCardOptions, {})($giftCardOptions),

    // Gift Options
    CartProvider.render(GiftOptions, {
      item: cartItem ?? null,
      view: 'product',
      onGiftOptionsChange: async (data) => {
        console.info('onGiftOptionsChange :>> ', data);
        if (data) {
          sessionStorage.setItem('updatedGiftOptions', JSON.stringify(data));
        }
      },
    })($giftOptions),

    // Description
    pdpRendered.render(ProductDescription, {})($description),

    // Attributes
    pdpRendered.render(ProductAttributes, {})($attributes),

    // Wishlist button - WishlistToggle Container
    wishlistRender.render(WishlistToggle, {
      product,
    })($wishlistToggleBtn),
  ]);

  // Configuration – Button - Add to Cart
  const addToCart = await UI.render(Button, {
    children: labels.Global?.AddProductToCart,
    icon: h(Icon, { source: 'Cart' }),
    onClick: async () => {
      const buttonActionText = isUpdateMode
        ? labels.Global?.UpdatingInCart
        : labels.Global?.AddingToCart;
      try {
        addToCart.setProps((prev) => ({
          ...prev,
          children: buttonActionText,
          disabled: true,
        }));

        // get the current selection values
        const values = pdpApi.getProductConfigurationValues();
        const valid = pdpApi.isProductConfigurationValid();

        // add or update the product in the cart
        if (valid) {
          if (isUpdateMode) {
            // --- Update existing item ---
            const { updateProductsFromCart } = await import(
              '@dropins/storefront-cart/api.js'
            );

            await updateProductsFromCart([{ ...values, uid: itemUidFromUrl }]);

            // --- START REDIRECT ON UPDATE ---
            const updatedSku = values?.sku;
            if (updatedSku) {
              const cartRedirectUrl = new URL(
                rootLink('/cart'),
                window.location.origin,
              );
              cartRedirectUrl.searchParams.set('itemUid', itemUidFromUrl);
              window.location.href = cartRedirectUrl.toString();
            } else {
              // Fallback if SKU is somehow missing (shouldn't happen in normal flow)
              console.warn(
                'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
              );
              window.location.href = rootLink('/cart');
            }
            return;
          }
          // --- Add new item ---
          const { addProductsToCart, updateProductsFromCart } = await import(
            '@dropins/storefront-cart/api.js'
          );
          // await addProductsToCart([{ ...values }]);
          const addResponse = await addProductsToCart([{ ...values }]);

          const updatedGiftOptions = JSON.parse(
            sessionStorage.getItem('updatedGiftOptions'),
          );

          if (!updatedGiftOptions || !addResponse) return;

          // Wait for cart to be persisted (small delay to ensure cart/data event is processed)
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });

          // Get the latest cart data from sessionStorage
          const latestCartData = JSON.parse(
            sessionStorage.getItem('DROPIN__CART__CART__DATA'),
          );

          if (!latestCartData || !latestCartData.items) {
            console.error('Cart data not available after adding product');
            return;
          }

          // For configurable products, match by topLevelSku and optionsUIDs
          // For simple products, match by sku
          const dropinCartData = latestCartData.items.find((el) => {
            // Match by topLevelSku for configurable products
            if (el.topLevelSku === values.sku) {
              // If optionsUIDs exist, also match those to ensure correct variant
              if (values.optionsUIDs && el.selectedOptionsUIDs) {
                const elOptionUIDs = Object.values(el.selectedOptionsUIDs);
                return values.optionsUIDs.every((uid) => elOptionUIDs.includes(uid))
                      && values.optionsUIDs.length === elOptionUIDs.length;
              }
              return true;
            }
            // Match by sku for simple products
            return el.sku === values.sku;
          });

          if (!dropinCartData) {
            console.error(`Product not found in cart. SKU: ${values.sku}, OptionsUIDs:`, values.optionsUIDs);
            return;
          }

          const {
            recipientName,
            senderName,
            message,
            giftWrappingId,
            isGiftWrappingSelected,
          } = updatedGiftOptions;

          const giftOptions = {
            gift_message: {
              to: recipientName,
              from: senderName,
              message,
            },
            gift_wrapping_id: isGiftWrappingSelected
              ? giftWrappingId
              : null,
          };

          await updateProductsFromCart([
            {
              uid: dropinCartData.uid,
              quantity: dropinCartData.quantity,
              giftOptions,
            },
          ]);
        }

        // reset any previous alerts if successful
        inlineAlert?.remove();
      } catch (error) {
        // add alert message
        inlineAlert = await UI.render(InLineAlert, {
          heading: 'Error',
          description: error.message,
          icon: h(Icon, { source: 'Warning' }),
          'aria-live': 'assertive',
          role: 'alert',
          onDismiss: () => {
            inlineAlert.remove();
          },
        })($alert);

        // Scroll the alertWrapper into view
        $alert.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        // Reset button text using the helper function which respects the current mode
        updateAddToCartButtonText(addToCart, isUpdateMode, labels);
        // Re-enable button
        addToCart.setProps((prev) => ({
          ...prev,
          children: labels.PDP?.Product?.AddToCart?.label,
          disabled: false,
        }));
      }
    },
  })($addToCart);

  // Lifecycle Events
  events.on('pdp/valid', (valid) => {
    // update add to cart button disabled state based on product selection validity
    addToCart.setProps((prev) => ({ ...prev, disabled: !valid }));
  }, { eager: true });

  // Handle option changes
  events.on('pdp/values', () => {
    if (wishlistToggleBtn) {
      const configValues = pdpApi.getProductConfigurationValues();

      // Check URL parameter for empty optionsUIDs
      const urlOptionsUIDs = urlParams.get('optionsUIDs');

      // If URL has empty optionsUIDs parameter, treat as base product (no options)
      const optionUIDs = urlOptionsUIDs === '' ? undefined : (configValues?.optionsUIDs || undefined);

      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
        },
      }));
    }

    // Update warehouse availability when product options change
    if ($warehouseAvailability) {
      const configValues = pdpApi.getProductConfigurationValues();
      const newSku = configValues?.sku || configValues?.variantSku || product?.sku;
      if (newSku) {
        resetWarehouseAvailability($warehouseAvailability, newSku);
      }
    }
  }, { eager: true });

  events.on('wishlist/alert', ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($alert);

    setTimeout(() => {
      $alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      $alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  });

  // --- Add new event listener for cart/data ---
  events.on(
    'cart/data',
    (cartData) => {
      let itemIsInCart = false;
      if (itemUidFromUrl && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUidFromUrl,
        );
      }
      // Set the update mode state
      isUpdateMode = itemIsInCart;

      // Update button text based on whether the item is in the cart
      updateAddToCartButtonText(addToCart, itemIsInCart, labels);
    },
    { eager: true },
  );

  // Set JSON-LD and Meta Tags
  events.on('aem/lcp', () => {
    const isPrerendered = isProductPrerendered();
    if (product && !isPrerendered) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  // Initialize warehouse availability button (lazy load)
  if (product?.sku && $warehouseAvailability) {
    initializeWarehouseAvailabilityButton(product.sku, $warehouseAvailability);
  }

  return Promise.resolve();
}

async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  // get variants
  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            inStock
            images(roles: ["image"]) {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}

/**
 * Returns the configuration for an image slot.
 * @param ctx - The context of the slot.
 * @returns The configuration for the image slot.
 */
function imageSlotConfig(ctx) {
  const { data, defaultImageProps } = ctx;
  return {
    alias: data.sku,
    imageProps: defaultImageProps,

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  };
}

/**
 * Fetches user IP address using a service
 * @returns {Promise<string>} User IP address or default
 */
async function getUserIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data.ip || '3.131.150.126';
    }
  } catch (error) {
    console.warn('Failed to fetch user IP:', error);
  }
  return '3.131.150.126';
}

/**
 * Fetches warehouse availability for a product via GraphQL
 * @param {string} sku - Product SKU
 * @param {string} ipAddress - User IP address
 * @returns {Promise<Object|null>} Warehouse availability data or null on error
 */
async function fetchWarehouseAvailability(sku, ipAddress) {
  try {
    const { data, errors } = await pdpApi.fetchGraphQl(`
      query GetProductWithWarehouse($sku: String!, $ipAddress: String!) {
        productWithWarehouse(sku: $sku, ipAddress: $ipAddress) {
          sku
          warehouseAvailability {
            customer_location {
              city
              coordinates {
                lat
                lon
              }
              country
              ip
              postal_code
              state
            }
            product_name
            sku
            success
            timestamp
            total_available
            warehouses {
              address {
                city
                postal_code
                state
              }
              distance_miles
              quantity_available
              warehouse_id
              warehouse_name
            }
          }
        }
      }
    `, {
      method: 'POST',
      variables: { sku, ipAddress },
    });

    if (errors) {
      console.error('GraphQL errors:', errors);
      throw new Error(errors.map((e) => e.message).join(', '));
    }

    return data?.productWithWarehouse?.warehouseAvailability || null;
  } catch (error) {
    console.error('Error fetching warehouse availability:', error);
    return null;
  }
}

/**
 * Initializes warehouse availability button (lazy load)
 * @param {string} sku - Product SKU
 * @param {HTMLElement} container - Container element to render into
 */
function initializeWarehouseAvailabilityButton(sku, container) {
  if (!container || !sku) {
    return;
  }

  container.innerHTML = `
    <div class="warehouse-availability">
      <div class="warehouse-availability__header">
        <h3 class="warehouse-availability__title">Warehouse Availability</h3>
      </div>
      <div class="warehouse-availability__content">
        <button type="button" class="warehouse-availability__toggle-btn" aria-expanded="false">
          <span class="warehouse-availability__toggle-text">Check Warehouse Availability</span>
          <span class="warehouse-availability__toggle-icon">▼</span>
        </button>
        <div class="warehouse-availability__data" style="display: none;"></div>
      </div>
    </div>
  `;

  const toggleBtn = container.querySelector('.warehouse-availability__toggle-btn');
  const dataContainer = container.querySelector('.warehouse-availability__data');
  const state = {
    isLoaded: false,
    currentSku: sku,
  };

  toggleBtn.addEventListener('click', async () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

    if (!isExpanded && !state.isLoaded) {
      dataContainer.innerHTML = '<div class="warehouse-availability__loading">Checking availability...</div>';
      dataContainer.style.display = 'block';
      toggleBtn.disabled = true;

      try {
        getUserIPAddress();
        const warehouseData = await fetchWarehouseAvailability(state.currentSku, '3.131.150.126');

        if (!warehouseData) {
          dataContainer.innerHTML = '<div class="warehouse-availability__error">Unable to load warehouse availability at this time.</div>';
          toggleBtn.disabled = false;
          return;
        }

        renderWarehouseData(warehouseData, dataContainer);
        state.isLoaded = true;
      } catch (error) {
        console.error('Error loading warehouse availability:', error);
        dataContainer.innerHTML = '<div class="warehouse-availability__error">Unable to load warehouse availability at this time.</div>';
      } finally {
        toggleBtn.disabled = false;
      }
    } else {
      dataContainer.style.display = isExpanded ? 'none' : 'block';
    }

    const newExpandedState = !isExpanded;
    toggleBtn.setAttribute('aria-expanded', newExpandedState.toString());
    const icon = toggleBtn.querySelector('.warehouse-availability__toggle-icon');
    icon.textContent = newExpandedState ? '▲' : '▼';
  });

  // Store state and current SKU for reset function
  container.dataset.currentSku = sku;
  container.dataset.warehouseState = JSON.stringify(state);
  container.warehouseState = state;
}

/**
 * Resets warehouse availability when product SKU changes
 * @param {HTMLElement} container - Container element
 * @param {string} newSku - New product SKU
 */
function resetWarehouseAvailability(container, newSku) {
  if (!container || !newSku) {
    return;
  }

  const { currentSku } = container.dataset;
  if (currentSku === newSku) {
    return;
  }

  const toggleBtn = container.querySelector('.warehouse-availability__toggle-btn');
  const dataContainer = container.querySelector('.warehouse-availability__data');

  if (toggleBtn && dataContainer && container.warehouseState) {
    // Reset state
    container.warehouseState.currentSku = newSku;
    container.warehouseState.isLoaded = false;
    container.dataset.currentSku = newSku;

    // Reset UI
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.disabled = false;
    dataContainer.style.display = 'none';
    dataContainer.innerHTML = '';
    const icon = toggleBtn.querySelector('.warehouse-availability__toggle-icon');
    if (icon) {
      icon.textContent = '▼';
    }
  }
}

/**
 * Renders warehouse data into the container
 * @param {Object} data - Warehouse availability data
 * @param {HTMLElement} container - Container element
 */
function renderWarehouseData(data, container) {
  if (!data || !container) {
    return;
  }

  const warehouses = data.warehouses || [];

  if (warehouses.length === 0) {
    container.innerHTML = '<div class="warehouse-availability__no-results">No warehouses found within the specified distance.</div>';
    return;
  }

  const warehousesList = warehouses.map((warehouse) => {
    const distance = warehouse.distance_miles ? `${warehouse.distance_miles.toFixed(2)} miles` : 'Distance unknown';
    const quantityAvailable = warehouse.quantity_available ?? 0;
    const isAvailable = quantityAvailable > 0;
    const statusClass = isAvailable ? 'warehouse-availability__item--available' : 'warehouse-availability__item--unavailable';

    let addressText = '';
    if (warehouse.address && typeof warehouse.address === 'object') {
      const addressParts = [];
      if (warehouse.address.city) addressParts.push(warehouse.address.city);
      if (warehouse.address.state) addressParts.push(warehouse.address.state);
      if (warehouse.address.postal_code) addressParts.push(warehouse.address.postal_code);
      addressText = addressParts.filter(Boolean).join(', ');
    } else if (typeof warehouse.address === 'string') {
      addressText = warehouse.address;
    }

    return `
      <div class="warehouse-availability__item ${statusClass}">
        <div class="warehouse-availability__item-name">${warehouse.warehouse_name || 'Warehouse'}</div>
        <div class="warehouse-availability__item-id">${warehouse.warehouse_id ? `ID: ${warehouse.warehouse_id}` : ''}</div>
        <div class="warehouse-availability__item-details">
          <span class="warehouse-availability__item-distance">${distance}</span>
          <span class="warehouse-availability__item-status">${isAvailable ? `Available (${quantityAvailable})` : 'Not Available'}</span>
        </div>
        ${addressText ? `<div class="warehouse-availability__item-address">${addressText}</div>` : ''}
      </div>
    `;
  }).join('');

  const totalAvailable = data.total_available !== undefined ? data.total_available : null;
  const totalAvailableText = totalAvailable !== null ? `<div class="warehouse-availability__total">Total Available: <strong>${totalAvailable}</strong></div>` : '';

  container.innerHTML = `
    ${totalAvailableText}
    <div class="warehouse-availability__list">
      ${warehousesList}
    </div>
  `;
}
