/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsCategoryParser from './parsers/cards-category.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import carouselArticleParser from './parsers/carousel-article.js';

// TRANSFORMER IMPORTS
import magentoCleanupTransformer from './transformers/magento-cleanup.js';
import magentoSectionsTransformer from './transformers/magento-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-category': cardsCategoryParser,
  'cards-feature': cardsFeatureParser,
  'carousel-article': carouselArticleParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Magento Hyva theme homepage with hero banner, product categories, and promotional content',
  urls: [
    'https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.home-banner'],
    },
    {
      name: 'cards-category',
      instances: ['.container.pt-8.px-8 .category-box'],
    },
    {
      name: 'cards-feature',
      instances: ['.container.py-8.px-8 [data-content-type="row"]'],
    },
    {
      name: 'carousel-article',
      instances: ['.pb-1.top-bottom-padding [data-content-type="slider"]'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero Banner',
      selector: '.column.main > div[data-content-type="block"]:nth-child(4)',
      style: 'dark',
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: 'section-2-categories',
      name: 'Shop By Category',
      selector: '.column.main > .container.pt-8.px-8',
      style: null,
      blocks: ['cards-category'],
      defaultContent: [
        '.container.pt-8.px-8 h2[data-content-type="heading"]',
        '.container.pt-8.px-8 .home-browse-all',
      ],
    },
    {
      id: 'section-3-differentiators',
      name: 'What Makes Us Different',
      selector: '.column.main > .container.py-8.px-8',
      style: 'light',
      blocks: ['cards-feature'],
      defaultContent: [
        '.container.py-8.px-8 h2[data-content-type="heading"]',
      ],
    },
    {
      id: 'section-4-products',
      name: 'Popular Products',
      selector: '.column.main > .container.home-slider',
      style: null,
      blocks: [],
      defaultContent: [
        '.container.home-slider h2',
      ],
    },
    {
      id: 'section-5-knowledge',
      name: 'Explore Our Knowledge Center',
      selector: '.column.main > .pb-1.top-bottom-padding',
      style: 'light',
      blocks: ['carousel-article'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  magentoCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [magentoSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path: path || '/index',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
