var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    var _a;
    const cells = [];
    const bgImagesAttr = element.getAttribute("data-background-images") || ((_a = element.querySelector("[data-background-images]")) == null ? void 0 : _a.getAttribute("data-background-images"));
    if (bgImagesAttr) {
      try {
        const decoded = bgImagesAttr.replace(/\\&quot;/g, '"').replace(/\\"/g, '"');
        const bgData = JSON.parse(decoded);
        const imageUrl = bgData.desktop_image || bgData.mobile_image || Object.values(bgData)[0];
        if (imageUrl) {
          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = "Hero background";
          cells.push([img]);
        }
      } catch (e) {
        const fallbackImg = element.querySelector("img");
        if (fallbackImg) cells.push([fallbackImg]);
      }
    }
    const contentDiv = document.createElement("div");
    const heading = element.querySelector("h1, h2.text-3xl");
    if (heading) contentDiv.append(heading);
    const subheading = element.querySelector("h2:not(.text-3xl), h3");
    if (subheading) contentDiv.append(subheading);
    const ctaLinks = element.querySelectorAll('a.pagebuilder-button-primary, a.pagebuilder-button-secondary, a[data-content-type="button-item"]');
    ctaLinks.forEach((link) => contentDiv.append(link));
    if (contentDiv.childNodes.length > 0) {
      cells.push([contentDiv]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  function parse2(element, { document }) {
    const cells = [];
    const banners = element.querySelectorAll('[data-content-type="banner"]');
    banners.forEach((banner) => {
      const wrapper = banner.querySelector(".pagebuilder-banner-wrapper") || banner.querySelector("[data-background-images]");
      let img = null;
      if (wrapper) {
        const bgAttr = wrapper.getAttribute("data-background-images");
        if (bgAttr) {
          try {
            const decoded = bgAttr.replace(/\\&quot;/g, '"').replace(/\\"/g, '"');
            const bgData = JSON.parse(decoded);
            const imageUrl = bgData.desktop_image || bgData.mobile_image || Object.values(bgData)[0];
            if (imageUrl) {
              img = document.createElement("img");
              img.src = imageUrl;
              const titleEl = banner.querySelector('h3, h2, [data-element="content"] h3');
              img.alt = titleEl ? titleEl.textContent.trim() : "Category image";
            }
          } catch (e) {
            img = banner.querySelector("img");
          }
        }
      }
      if (!img) {
        img = banner.querySelector("img");
      }
      const contentDiv = document.createElement("div");
      const title = banner.querySelector('h3, [data-element="content"] h3');
      if (title) contentDiv.append(title);
      const link = banner.querySelector("a[href]");
      if (link && title) {
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = title.textContent.trim();
        contentDiv.append(a);
      } else if (link) {
        contentDiv.append(link);
      }
      if (img || contentDiv.childNodes.length > 0) {
        cells.push([img || "", contentDiv]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-category", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function parse3(element, { document }) {
    const cells = [];
    const featureColumns = element.querySelectorAll(".pagebuilder-column.main-box-height");
    featureColumns.forEach((col) => {
      const img = col.querySelector('figure[data-content-type="image"] img, figure img, img');
      const contentDiv = document.createElement("div");
      const title = col.querySelector("h2");
      if (title) contentDiv.append(title);
      const textContainer = col.querySelector('div[data-content-type="text"]');
      const desc = textContainer ? textContainer.querySelector("p") : col.querySelector("p");
      if (desc) contentDiv.append(desc);
      if (img || contentDiv.childNodes.length > 0) {
        cells.push([img || "", contentDiv]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-article.js
  function parse4(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll('.explore-slider[data-content-type="slide"], [data-content-type="slide"]');
    slides.forEach((slide) => {
      const img = slide.querySelector('figure[data-content-type="image"] img.pagebuilder-mobile-hidden') || slide.querySelector('figure[data-content-type="image"] img') || slide.querySelector("figure img");
      const contentDiv = document.createElement("div");
      const desktopTitle = slide.querySelector("h2.desktop-title");
      const mobileTitle = slide.querySelector("h2.mobile-title");
      const title = desktopTitle || mobileTitle || slide.querySelector(".knowledge-mobile h2") || slide.querySelector("h2");
      if (title) contentDiv.append(title);
      const textDivs = slide.querySelectorAll('.knowledge-mobile div[data-content-type="text"], .gap-16 div[data-content-type="text"]');
      if (textDivs.length > 0) {
        textDivs.forEach((textDiv) => {
          const p = textDiv.querySelector("p");
          if (p) contentDiv.append(p);
        });
      } else {
        const paragraphs = slide.querySelectorAll('div[data-content-type="text"] p');
        paragraphs.forEach((p) => contentDiv.append(p));
      }
      const ctaLink = slide.querySelector("a.pagebuilder-button-primary, a.pagebuilder-button-secondary") || slide.querySelector(".knowledge-mobile a[href]");
      if (ctaLink) contentDiv.append(ctaLink);
      if (img || contentDiv.childNodes.length > 0) {
        cells.push([img || "", contentDiv]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/magento-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [".message.demo"]);
      WebImporter.DOMUtils.remove(element, ["style", "script", "noscript"]);
      WebImporter.DOMUtils.remove(element, ['[id*="recs_block"]']);
      WebImporter.DOMUtils.remove(element, [".page.messages"]);
      const contentarea = element.querySelector("#contentarea");
      if (contentarea) contentarea.remove();
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.page-header",
        "footer.page-footer",
        "nav",
        "iframe",
        "link"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-pb-style");
        el.removeAttribute("data-content-type");
        el.removeAttribute("data-appearance");
        el.removeAttribute("data-element");
        el.removeAttribute("data-background-images");
        el.removeAttribute("data-background-type");
        el.removeAttribute("data-enable-parallax");
        el.removeAttribute("data-parallax-speed");
        el.removeAttribute("data-video-loop");
        el.removeAttribute("data-video-play-only-visible");
        el.removeAttribute("data-video-lazy-load");
        el.removeAttribute("data-video-fallback-src");
        el.removeAttribute("x-data");
        el.removeAttribute("x-init");
        el.removeAttribute("x-intersect");
        el.removeAttribute("x-show");
        el.removeAttribute("x-if");
        el.removeAttribute("x-for");
        el.removeAttribute("x-bind");
        el.removeAttribute("x-on");
        el.removeAttribute("x-cloak");
      });
    }
  }

  // tools/importer/transformers/magento-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
      const doc = element.ownerDocument || document;
      const sections = [...template.sections].reverse();
      sections.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== template.sections[0].id) {
          const hr = doc.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-banner": parse,
    "cards-category": parse2,
    "cards-feature": parse3,
    "carousel-article": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Magento Hyva theme homepage with hero banner, product categories, and promotional content",
    urls: [
      "https://master-7rqtwti-dtgu53s3tm7ku.us-4.magentosite.cloud/"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".home-banner"]
      },
      {
        name: "cards-category",
        instances: [".container.pt-8.px-8 .category-box"]
      },
      {
        name: "cards-feature",
        instances: ['.container.py-8.px-8 [data-content-type="row"]']
      },
      {
        name: "carousel-article",
        instances: ['.pb-1.top-bottom-padding [data-content-type="slider"]']
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero Banner",
        selector: '.column.main > div[data-content-type="block"]:nth-child(4)',
        style: "dark",
        blocks: ["hero-banner"],
        defaultContent: []
      },
      {
        id: "section-2-categories",
        name: "Shop By Category",
        selector: ".column.main > .container.pt-8.px-8",
        style: null,
        blocks: ["cards-category"],
        defaultContent: [
          '.container.pt-8.px-8 h2[data-content-type="heading"]',
          ".container.pt-8.px-8 .home-browse-all"
        ]
      },
      {
        id: "section-3-differentiators",
        name: "What Makes Us Different",
        selector: ".column.main > .container.py-8.px-8",
        style: "light",
        blocks: ["cards-feature"],
        defaultContent: [
          '.container.py-8.px-8 h2[data-content-type="heading"]'
        ]
      },
      {
        id: "section-4-products",
        name: "Popular Products",
        selector: ".column.main > .container.home-slider",
        style: null,
        blocks: [],
        defaultContent: [
          ".container.home-slider h2"
        ]
      },
      {
        id: "section-5-knowledge",
        name: "Explore Our Knowledge Center",
        selector: ".column.main > .pb-1.top-bottom-padding",
        style: "light",
        blocks: ["carousel-article"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path: path || "/index",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
