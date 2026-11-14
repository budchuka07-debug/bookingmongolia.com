(function (global) {
  var SUPABASE_URL = "https://ebpjetcuabubihzximbb.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_3F9zG4HoMOCgU4yHvUkiKw_h5VTeeRF";
  var CLOUDINARY_CLOUD_NAME = "dflwo8gmz";
  var CLOUDINARY_UPLOAD_PRESET = "unsigned_upload";
  var CLOUDINARY_FOLDER = "bookingmongolia/brand-store";
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvwywob";
  var SHIPPING_NOTICE = "International shipping is arranged and paid for separately by the buyer. Import duties, customs clearance, taxes, and local delivery are the buyer's responsibility.";
  var PRODUCT_COLUMNS = "id,slug,category_slug,name,description,price_amount,price_currency,brand_name,origin,materials,sizes,colors,image_urls,stock_status,shipping_note";
  var GER_SLUGS = { "traditional-ereen-ger": true, "luxury-hand-carved-ger": true };
  var SPEC_ROWS = [
    ["dimensions", "Dimensions"],
    ["total_weight_kg", "Total weight (kg)"],
    ["wooden_structure_weight", "Wooden structure weight"],
    ["complete_package_weight", "Complete package weight"],
    ["number_of_packages", "Number of packages"],
    ["package_dimensions", "Individual package dimensions"],
    ["total_cbm", "Total CBM"],
    ["packaging_type", "Packaging type"],
    ["shipping_methods", "Available shipping methods"],
    ["production_lead_time", "Production lead time"],
    ["customization_notes", "Customization notes"]
  ];
  var CATEGORIES = [
    { slug: "cashmere", image: "/images/hero/hero-nomadic-mongolia.webp", title: "Mongolian Cashmere", text: "Sweaters, scarves, shawls, coats and wool accessories from Mongolian makers." },
    { slug: "leather-crafts", image: "/images/experiences/exp-nomadic-life.webp", title: "Leather & Handmade Crafts", text: "Leather bags, wallets, belts and traditional handmade work." },
    { slug: "art-crafts", image: "/images/destinations/hustai.webp", title: "Mongolian Art & Crafts", text: "Paintings, felt art, traditional artwork and artisan pieces." },
    { slug: "ger-home", image: "/images/destinations/dest-khuvsgul-lake.webp", title: "Mongolian Ger & Home", text: "Mongolian Ger Collection. Traditional Ereen and luxury hand-carved gers, with starting prices in USD. Shipping is not included." },
    { slug: "traditional-clothing", image: "/images/hero/hero-horse-riders.webp", title: "Traditional Mongolian Clothing", text: "Deel, traditional clothing, modern Mongolian fashion and accessories." },
    { slug: "gifts-souvenirs", image: "/images/destinations/bayanzag.webp", title: "Mongolian Gifts & Souvenirs", text: "Gifts and handmade souvenirs that can travel home." }
  ];
  var activeManifest = [];
  var gerCatalogPromise = null;

  function t(key) {
    return global.BMStoreI18n ? global.BMStoreI18n.t(key) : key;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch];
    });
  }

  function client() {
    if (!global.supabase || typeof global.supabase.createClient !== "function") return null;
    if (!global.BMStoreClient) global.BMStoreClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return global.BMStoreClient;
  }

  function category(slug) {
    return CATEGORIES.filter(function (item) { return item.slug === slug; })[0] || null;
  }

  function isSafeProductImage(url) {
    var value = String(url || "").trim();
    if (!value) return false;
    if (/naadam|terelj|khuvsgul|steppe/i.test(value)) return false;
    if (/\/images\/(destinations|tour|hero|experiences|guide)\//i.test(value)) return false;
    if (/^https:\/\//i.test(value)) return true;
    return /^\/images\/mongolian-ger\//i.test(value);
  }

  function visibleProductImages(urls, manifestFiles) {
    var allow = {};
    (manifestFiles || []).forEach(function (file) { allow[String(file)] = true; });
    return (urls || []).filter(function (url) {
      var value = String(url || "").trim();
      if (!isSafeProductImage(value)) return false;
      if (/^https:\/\//i.test(value)) return true;
      return !!allow[value];
    });
  }

  function images(product) {
    var list = Array.isArray(product.image_urls) ? product.image_urls : [];
    return list.filter(function (url) { return /^https:\/\//i.test(String(url || "")) && isSafeProductImage(url); });
  }

  function displaySpec(value) {
    var text = String(value == null ? "" : value).trim();
    if (!text) return "To be confirmed";
    return text;
  }

  function startingLabel(amount, currency) {
    var number = Number(amount);
    if (!Number.isFinite(number)) return "";
    var formatted = number.toLocaleString("en-US");
    if ((currency || "USD") === "USD") return "Starting at $" + formatted;
    return "Starting at " + (currency || "USD") + " " + formatted;
  }

  function money(product) {
    if (product.ger_collection || GER_SLUGS[product.slug]) {
      var starting = startingLabel(product.price_amount, product.price_currency);
      if (starting) return starting;
    }
    if (product.price_amount == null || product.price_amount === "") return t("price_unset");
    var amount = Number(product.price_amount);
    if (!Number.isFinite(amount)) return t("price_unset");
    return (product.price_currency || "USD") + " " + amount.toLocaleString("en-US");
  }

  function productLink(product) {
    return "/brand-store/product/" + encodeURIComponent(product.slug);
  }

  function isGerProduct(product) {
    return !!(product && (product.ger_collection || GER_SLUGS[product.slug]));
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function flattenImages(product) {
    var urls = [];
    (product.galleries || []).forEach(function (group) {
      (group.images || []).forEach(function (url) { urls.push(url); });
    });
    if (!urls.length && Array.isArray(product.image_urls)) urls = product.image_urls.slice();
    return urls;
  }

  function normalizeGerProduct(product, shippingNotice) {
    var copy = Object.assign({}, product);
    copy.ger_collection = true;
    copy.origin = copy.origin || "Mongolia";
    copy.image_urls = flattenImages(copy);
    copy.shipping_note = shippingNotice || copy.shipping_note || SHIPPING_NOTICE;
    copy.shipping_included = false;
    return copy;
  }

  function mergeGerProduct(local, remote) {
    var base = normalizeGerProduct(local || {}, SHIPPING_NOTICE);
    if (!remote) return base;
    var specs = Object.assign({}, base.specs || {});
    var remoteSpecs = remote.specs && typeof remote.specs === "object" && !Array.isArray(remote.specs) ? remote.specs : {};
    Object.keys(remoteSpecs).forEach(function (key) {
      var value = String(remoteSpecs[key] == null ? "" : remoteSpecs[key]).trim();
      if (value) specs[key] = value;
    });
    var remoteImages = Array.isArray(remote.image_urls) ? remote.image_urls.map(function (url) { return String(url || "").trim(); }).filter(Boolean) : [];
    var galleries = remoteImages.length ? [{ id: "photos", label: "Photographs", images: remoteImages }] : base.galleries;
    return Object.assign({}, base, remote, {
      ger_collection: true,
      specs: specs,
      features: base.features,
      requests: base.requests,
      galleries: galleries,
      package_note: base.package_note,
      seo_title: base.seo_title,
      seo_description: base.seo_description,
      keywords: base.keywords,
      image_urls: remoteImages.length ? remoteImages : base.image_urls,
      shipping_included: false,
      shipping_note: SHIPPING_NOTICE
    });
  }

  function offerAvailability(stock) {
    if (stock === "in_stock") return "https://schema.org/InStock";
    if (stock === "out_of_stock") return "https://schema.org/OutOfStock";
    if (stock === "made_to_order" || stock === "unlisted" || !stock) return "https://schema.org/PreOrder";
    return null;
  }

  function productJsonLd(product, manifestFiles) {
    var url = "https://bookingmongolia.com/brand-store/product/" + product.slug;
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.seo_description || product.description || "",
      sku: product.slug,
      brand: { "@type": "Brand", name: product.brand_name || "Booking Mongolia" },
      url: url
    };
    var photos = visibleProductImages(product.image_urls, manifestFiles).map(function (path) {
      return /^https:\/\//i.test(path) ? path : "https://bookingmongolia.com" + path;
    });
    if (photos.length) data.image = photos;
    if (product.price_amount != null && product.price_amount !== "" && Number.isFinite(Number(product.price_amount))) {
      var offer = {
        "@type": "Offer",
        price: String(product.price_amount),
        priceCurrency: product.price_currency || "USD",
        url: url,
        description: "Starting price. Shipping is not included."
      };
      var availability = offerAvailability(product.stock_status);
      if (availability) offer.availability = availability;
      data.offers = offer;
    }
    return data;
  }

  function validateQuote(fields) {
    var name = String(fields && fields.name || "").trim();
    var email = String(fields && fields.email || "").trim();
    var message = String(fields && fields.message || "").trim();
    var errors = [];
    if (!name) errors.push("Name is required.");
    if (name.length > 120) errors.push("Name is too long.");
    if (!email) errors.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) errors.push("Enter a valid email address.");
    if (!message) errors.push("Message is required.");
    else if (message.length < 5) errors.push("Message must be at least 5 characters.");
    else if (message.length > 2000) errors.push("Message is too long.");
    return { ok: errors.length === 0, errors: errors, name: name, email: email, message: message };
  }

  function buildQuotePayload(product, fields) {
    var clean = validateQuote(fields);
    return {
      name: clean.name.slice(0, 120),
      email: clean.email.slice(0, 160),
      message: clean.message.slice(0, 2000),
      product_slug: String(product && product.slug || "").slice(0, 80),
      product_name: String(product && product.name || "").slice(0, 140),
      price_amount: product ? product.price_amount : null,
      price_currency: (product && product.price_currency) || "USD",
      status: "pending"
    };
  }

  function quoteSucceeded(supabaseOk, formspreeOk) {
    return !!(supabaseOk || formspreeOk);
  }

  function whatsappLink(product) {
    var text = "Hello, I would like a quotation for " + (product.name || "a Mongolian ger") + ". " + (startingLabel(product.price_amount, product.price_currency) || "Price to be confirmed") + ". Shipping is not included.";
    return "https://wa.me/97690283039?text=" + encodeURIComponent(text);
  }

  function loadGerCatalog() {
    if (!gerCatalogPromise) {
      gerCatalogPromise = fetch("/data/mongolian-ger-catalog.json", { credentials: "same-origin" })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (!data || !Array.isArray(data.products)) return null;
          var notice = data.shipping_notice || SHIPPING_NOTICE;
          return {
            shipping_notice: notice,
            products: data.products.map(function (product) { return normalizeGerProduct(product, notice); })
          };
        })
        .catch(function () { return null; });
    }
    return gerCatalogPromise;
  }

  function loadGerManifest() {
    return fetch("/data/mongolian-ger-manifest.json", { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : { files: [] }; })
      .catch(function () { return { files: [] }; })
      .then(function (data) { return Array.isArray(data && data.files) ? data.files : []; });
  }

  async function publishedProducts(slug) {
    var db = client();
    if (!db) return [];
    async function run(columns) {
      var query = db.from("brand_products").select(columns).eq("status", "published").order("created_at", { ascending: false }).limit(24);
      if (slug) query = query.eq("category_slug", slug);
      return query;
    }
    var result = await run(PRODUCT_COLUMNS + ",specs");
    if (result.error) result = await run(PRODUCT_COLUMNS);
    if (result.error || !Array.isArray(result.data)) return [];
    return result.data.filter(function (row) { return row.origin === "Mongolia"; });
  }

  function mergeGerList(localProducts, remoteRows) {
    var bySlug = {};
    (remoteRows || []).forEach(function (row) { if (row && row.slug) bySlug[row.slug] = row; });
    var seen = {};
    var list = (localProducts || []).map(function (local) {
      seen[local.slug] = true;
      return mergeGerProduct(local, bySlug[local.slug] || null);
    });
    (remoteRows || []).forEach(function (row) {
      if (row && row.category_slug === "ger-home" && !seen[row.slug]) list.push(row);
    });
    return list;
  }

  function card(product) {
    var gallery = isGerProduct(product) ? visibleProductImages(product.image_urls, activeManifest) : images(product);
    var cover = gallery[0] || "";
    var photo = cover
      ? '<img src="' + esc(cover) + '" alt="' + esc(product.name) + '">'
      : (isGerProduct(product)
        ? '<div class="ph ger-wait-card"><p>Product photographs are waiting for the manufacturer\'s upload.</p></div>'
        : '<div class="ph"></div>');
    var shipping = isGerProduct(product) ? '<p>Shipping is not included.</p>' : "";
    return '<article class="store-card">' + photo +
      '<div><p class="store-origin">' + esc(t("origin")) + '</p><h3>' + esc(product.name) + '</h3>' +
      '<p>' + esc(product.description) + '</p><p class="store-price">' + esc(money(product)) + '</p>' + shipping +
      '<p class="store-brand">' + esc(product.brand_name || "") + '</p>' +
      '<a class="store-btn dark" href="' + esc(productLink(product)) + '">' + esc(t("view")) + '</a></div></article>';
  }

  function renderProducts(list, target) {
    if (!target) return;
    if (!list.length) {
      target.innerHTML = '<div class="store-empty">' + esc(t("empty_products")) + '</div>';
      return;
    }
    target.innerHTML = list.map(card).join("");
  }

  async function renderBrands() {
    var target = document.getElementById("store-brands");
    if (!target) return;
    var db = client();
    var rows = [];
    if (db) {
      var result = await db.from("brand_sellers_public").select("id,brand_name,category,product_description,production_location").limit(6);
      if (!result.error && Array.isArray(result.data)) rows = result.data;
    }
    if (!rows.length) {
      target.innerHTML = '<div class="store-empty">' + esc(t("brands_empty")) + '</div>';
      return;
    }
    target.innerHTML = rows.map(function (row) {
      var cat = category(row.category);
      return '<article class="store-brand-card"><p class="store-origin">' + esc(t("origin")) + '</p><h3>' + esc(row.brand_name) + '</h3><p>' + esc(cat ? cat.title : row.category) + '</p><p>' + esc(row.product_description) + '</p><p>' + esc(row.production_location) + '</p></article>';
    }).join("");
  }

  function choices(label, values, name) {
    var list = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!list.length) return '<p>' + esc(label) + '</p>';
    return '<p>' + esc(name) + '</p><div class="store-choice">' + list.map(function (value, index) {
      return '<button type="button" data-choice="' + esc(name) + '" aria-pressed="' + (index === 0 ? "true" : "false") + '">' + esc(value) + '</button>';
    }).join("") + '</div>';
  }

  async function fetchProduct(slug) {
    var db = client();
    if (!db || !slug) return null;
    async function run(columns) {
      return db.from("brand_products").select(columns).eq("slug", slug).eq("status", "published").maybeSingle();
    }
    var result = await run(PRODUCT_COLUMNS + ",specs");
    if (result.error) result = await run(PRODUCT_COLUMNS);
    if (result.error || !result.data || result.data.origin !== "Mongolia") return null;
    return result.data;
  }

  function setMeta(selector, attr, value) {
    var node = document.head && document.head.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  }

  function setRobots(content) {
    if (!document.head) return;
    var node = document.head.querySelector('meta[name="robots"]');
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", "robots");
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  }

  function applyGerSeo(product, manifestFiles) {
    var title = product.seo_title || (product.name + " | Mongolia Brand Store");
    var description = product.seo_description || product.description || "";
    var url = "https://bookingmongolia.com/brand-store/product/" + product.slug;
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setRobots("index,follow");
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "product");
    var photos = visibleProductImages(product.image_urls, manifestFiles);
    var ogImage = document.head.querySelector('meta[property="og:image"]');
    if (photos.length) {
      var absolute = /^https:\/\//i.test(photos[0]) ? photos[0] : "https://bookingmongolia.com" + photos[0];
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute("content", absolute);
    } else if (ogImage) {
      ogImage.parentNode.removeChild(ogImage);
    }
    var existing = document.getElementById("store-product-jsonld");
    if (existing) existing.parentNode.removeChild(existing);
    var script = document.createElement("script");
    script.id = "store-product-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        productJsonLd(product, manifestFiles),
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://bookingmongolia.com/" },
            { "@type": "ListItem", position: 2, name: "Brand Store", item: "https://bookingmongolia.com/brand-store" },
            { "@type": "ListItem", position: 3, name: "Mongolian Ger Collection", item: "https://bookingmongolia.com/brand-store/category/ger-home" },
            { "@type": "ListItem", position: 4, name: product.name, item: url }
          ]
        }
      ]
    });
    document.head.appendChild(script);
  }

  function renderGallery(product) {
    var groups = Array.isArray(product.galleries) && product.galleries.length
      ? product.galleries
      : [{ id: "photos", label: "Photographs", images: product.image_urls || [] }];
    var blocks = [];
    var first = "";
    groups.forEach(function (group) {
      var urls = visibleProductImages(group.images && group.images.length ? group.images : product.image_urls, activeManifest);
      if (!urls.length) return;
      if (!first) first = urls[0];
      blocks.push('<section class="ger-group"><h3>' + esc(group.label || "Photographs") + '</h3><div class="store-thumbs ger-gallery">' + urls.map(function (url, index) {
        return '<button type="button" data-photo="' + esc(url) + '" aria-label="' + esc(product.name) + ' ' + (index + 1) + '"><img src="' + esc(url) + '" alt="' + esc(product.name) + '"></button>';
      }).join("") + '</div></section>');
    });
    if (!blocks.length) {
      return '<div class="ger-wait"><p>Product photographs are waiting for the manufacturer\'s upload.</p></div>';
    }
    return '<div class="store-gallery"><img id="store-main-photo" src="' + esc(first) + '" alt="' + esc(product.name) + '">' + blocks.join("") + '</div>';
  }

  function renderSpecTable(product) {
    var specs = product.specs || {};
    return '<table class="ger-specs"><tbody>' + SPEC_ROWS.map(function (row) {
      return '<tr><th scope="row">' + esc(row[1]) + '</th><td>' + esc(displaySpec(specs[row[0]])) + '</td></tr>';
    }).join("") + '</tbody></table>';
  }

  function renderList(title, items) {
    var list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return "";
    return '<section><h2>' + esc(title) + '</h2><ul>' + list.map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join("") + '</ul></section>';
  }

  function renderGerProduct(product) {
    var keywords = Array.isArray(product.keywords) ? product.keywords.filter(Boolean).join(". ") : "";
    return '<nav class="store-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/brand-store">Brand Store</a><span aria-hidden="true">/</span><a href="/brand-store/category/ger-home">Mongolian Ger Collection</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(product.name) + '</span></nav>' +
      '<section class="ger-hero"><p class="store-kicker">Mongolian Ger Collection</p><h1>' + esc(product.name) + '</h1>' +
      '<p class="ger-price">' + esc(money(product)) + '</p><p>Starting price in USD. Shipping is not included.</p>' +
      (keywords ? '<p>' + esc(keywords) + '</p>' : '') +
      '<div class="store-actions"><a class="store-btn" href="#store-inquiry">Request a quotation</a><a class="store-btn dark" href="' + esc(whatsappLink(product)) + '">WhatsApp</a></div></section>' +
      '<div class="ger-layout"><div>' + renderGallery(product) + '</div><div>' +
      '<p>' + esc(product.description) + '</p>' +
      '<p class="store-price">' + esc(money(product)) + '</p>' +
      '<h2>Specifications</h2>' + renderSpecTable(product) +
      renderList("Available designs", product.features) +
      renderList("Customization requests", product.requests) +
      '<p>These are requests. The manufacturer confirms what can be made. A request is not a guaranteed specification.</p>' +
      '<h2>Package</h2><p>' + esc(product.package_note || "Package contents: To be confirmed.") + '</p>' +
      '<h2>Shipping</h2><p>' + esc(SHIPPING_NOTICE) + '</p>' +
      '<p class="store-brand">' + esc(product.brand_name || "Booking Mongolia") + ' · ' + esc(product.origin || "Mongolia") + '</p>' +
      '<form id="store-inquiry" class="store-form" novalidate><h2 class="full">Request a quotation</h2>' +
      '<label class="full">Name<input name="name" autocomplete="name" required></label>' +
      '<label class="full">Email<input name="email" type="email" autocomplete="email" required></label>' +
      '<label class="full">Message<textarea name="message" rows="5" required></textarea></label>' +
      '<button class="store-btn dark full" id="store-inquiry-submit" type="submit">Request a quotation</button>' +
      '<p id="store-inquiry-note" class="full" role="status"></p></form></div></div>';
  }

  async function renderProduct() {
    var root = document.getElementById("store-product");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    var slug = params.get("slug") || "";
    if (!slug) {
      var parts = location.pathname.split("/").filter(Boolean);
      slug = decodeURIComponent(parts[parts.length - 1] || "");
      if (slug === "product.html" || slug === "product") slug = "";
    }
    var catalog = await loadGerCatalog();
    var local = catalog && catalog.products.filter(function (item) { return item.slug === slug; })[0];
    var remote = await fetchProduct(slug);
    var product = local ? mergeGerProduct(local, remote) : remote;
    if (!product) {
      setRobots("noindex");
      root.innerHTML = '<div class="store-empty"><h1>' + esc(t("no_product")) + '</h1><p>' + esc(t("empty_products")) + '</p><a class="store-btn dark" href="/brand-store">' + esc(t("hero_cta")) + '</a></div>';
      return;
    }
    activeManifest = await loadGerManifest();
    if (isGerProduct(product)) {
      applyGerSeo(product, activeManifest);
      root.innerHTML = renderGerProduct(product);
    } else {
      setRobots("noindex");
      document.title = product.name + " | Mongolia Brand Store";
      var desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", String(product.description || "").slice(0, 180));
      var gallery = images(product);
      var main = gallery[0] ? '<img id="store-main-photo" src="' + esc(gallery[0]) + '" alt="' + esc(product.name) + '">' : '<div class="ph" style="min-height:320px;border-radius:24px"></div>';
      var thumbs = gallery.map(function (url, index) {
        return '<button type="button" data-photo="' + esc(url) + '" aria-label="' + esc(product.name) + ' ' + (index + 1) + '"><img src="' + esc(url) + '" alt=""></button>';
      }).join("");
      var canSave = product.price_amount != null && product.stock_status !== "out_of_stock";
      root.innerHTML = '<div class="store-product"><div class="store-gallery">' + main + '<div class="store-thumbs">' + thumbs + '</div></div><div>' +
        '<p class="store-origin">' + esc(t("origin")) + '</p><h1>' + esc(product.name) + '</h1>' +
        '<p class="store-price">' + esc(money(product)) + '</p><p>' + esc(product.description) + '</p>' +
        choices(t("sizes_empty"), product.sizes, t("sizes")) +
        choices(t("colors_empty"), product.colors, t("colors")) +
        '<p><strong>' + esc(t("materials")) + '</strong><br>' + esc(product.materials || "—") + '</p>' +
        '<p><strong>' + esc(t("stock")) + '</strong><br>' + esc(product.stock_status || "unlisted") + '</p>' +
        '<p><strong>' + esc(t("shipping")) + '</strong><br>' + esc(product.shipping_note || t("shipping_fallback")) + '</p>' +
        '<p class="store-brand">' + esc(product.brand_name) + ' · ' + esc(product.origin || "Mongolia") + '</p>' +
        '<div class="store-actions"><button class="store-btn dark" type="button" id="store-add"' + (canSave ? "" : " disabled") + '>' + esc(t("add")) + '</button>' +
        '<a class="store-btn" href="#store-inquiry">' + esc(t("inquire")) + '</a></div>' +
        '<p class="store-note">' + esc(t("not_order")) + '</p>' +
        '<form id="store-inquiry" class="store-form" style="margin-top:18px" novalidate><label class="full">Name<input name="name" required></label><label class="full">Email<input name="email" type="email" required></label><label class="full">Message<textarea name="message" rows="4" required></textarea></label><button class="store-btn dark full" id="store-inquiry-submit" type="submit">' + esc(t("inquire")) + '</button><p id="store-inquiry-note" class="full" role="status"></p></form></div></div>';
      var add = document.getElementById("store-add");
      if (add) add.addEventListener("click", function () { saveLocal(product); });
    }
    root.querySelectorAll("[data-photo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var photo = document.getElementById("store-main-photo");
        if (photo) photo.src = btn.getAttribute("data-photo");
      });
    });
    root.querySelectorAll("[data-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        root.querySelectorAll('[data-choice="' + btn.getAttribute("data-choice") + '"]').forEach(function (peer) {
          peer.setAttribute("aria-pressed", peer === btn ? "true" : "false");
        });
      });
    });
    var form = document.getElementById("store-inquiry");
    if (form) form.addEventListener("submit", function (event) { submitInquiry(event, product); });
  }

  function readCart() {
    try { return JSON.parse(localStorage.getItem("bm_brand_cart") || "[]"); } catch (e) { return []; }
  }

  function saveLocal(product) {
    var cart = readCart().filter(function (item) { return item.slug !== product.slug; });
    cart.push({ slug: product.slug, name: product.name, price: money(product), brand: product.brand_name });
    localStorage.setItem("bm_brand_cart", JSON.stringify(cart.slice(-12)));
    renderCart(true);
  }

  function renderCart(open) {
    var box = document.getElementById("store-cart");
    if (!box) return;
    var cart = readCart();
    if (open) box.hidden = false;
    var lines = cart.length ? cart.map(function (item) {
      return '<li>' + esc(item.name) + ' · ' + esc(item.price) + '</li>';
    }).join("") : '<li>' + esc(t("cart_empty")) + '</li>';
    box.innerHTML = '<strong>' + esc(t("cart")) + '</strong><ul>' + lines + '</ul><p>' + esc(t("not_order")) + '</p><button type="button" id="store-cart-close">Close</button>';
    var close = document.getElementById("store-cart-close");
    if (close) close.addEventListener("click", function () { box.hidden = true; });
  }

  async function insertInquiry(payload, product) {
    var db = client();
    if (!db) return false;
    var row = {
      name: payload.name,
      email: payload.email,
      message: payload.message,
      status: "pending",
      product_slug: payload.product_slug
    };
    if (isUuid(product && product.id)) row.product_id = product.id;
    var result = await db.from("brand_inquiries").insert(row);
    if (result.error && /product_slug|schema cache|column/i.test(String(result.error.message || result.error.details || ""))) {
      var retry = {
        name: payload.name,
        email: payload.email,
        message: (payload.message + "\n\nProduct slug: " + payload.product_slug).slice(0, 2000),
        status: "pending"
      };
      if (row.product_id) retry.product_id = row.product_id;
      result = await db.from("brand_inquiries").insert(retry);
    }
    return !result.error;
  }

  async function sendFormspree(payload) {
    var response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        product_slug: payload.product_slug,
        product_name: payload.product_name,
        price_amount: payload.price_amount,
        price_currency: payload.price_currency,
        _subject: "Brand Store quotation: " + (payload.product_name || payload.product_slug)
      })
    });
    return response.ok;
  }

  async function submitInquiry(event, product) {
    event.preventDefault();
    var form = event.target;
    if (form.dataset.sending === "1") return;
    var note = document.getElementById("store-inquiry-note");
    var button = document.getElementById("store-inquiry-submit");
    var data = new FormData(form);
    var validation = validateQuote({
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message")
    });
    if (!validation.ok) {
      if (note) note.textContent = validation.errors[0];
      return;
    }
    var payload = buildQuotePayload(product, validation);
    form.dataset.sending = "1";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }
    if (note) note.textContent = "Sending…";
    var saved = false;
    try {
      var supabaseOk = false;
      try { supabaseOk = await insertInquiry(payload, product); } catch (e) { supabaseOk = false; }
      var formspreeOk = false;
      if (!supabaseOk) {
        try { formspreeOk = await sendFormspree(payload); } catch (e2) { formspreeOk = false; }
      }
      saved = quoteSucceeded(supabaseOk, formspreeOk);
    } catch (error) {
      saved = false;
    }
    if (saved) {
      if (note) note.textContent = "Your quotation request was sent.";
      form.reset();
    } else if (note) {
      note.textContent = "The quotation request was not sent. Please try again.";
    }
    form.dataset.sending = "";
    if (button) {
      button.disabled = false;
      button.textContent = isGerProduct(product) ? "Request a quotation" : t("inquire");
    }
  }

  async function uploadImages(files) {
    var urls = [];
    for (var i = 0; i < Math.min(files.length, 6); i += 1) {
      var form = new FormData();
      form.append("file", files[i]);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("folder", CLOUDINARY_FOLDER);
      var response = await fetch("https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload", { method: "POST", body: form });
      var body = await response.json();
      if (!response.ok || !body.secure_url) throw new Error((body.error && body.error.message) || "Image upload failed");
      urls.push(body.secure_url);
    }
    return urls;
  }

  function bindSeller() {
    var form = document.getElementById("seller-form");
    if (!form) return;
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var note = document.getElementById("seller-note");
      var data = new FormData(form);
      if (!form.querySelector('[name="made_in_mongolia"]').checked) {
        note.textContent = t("confirm_origin");
        return;
      }
      note.textContent = "Saving…";
      try {
        var photos = await uploadImages(form.querySelector('[name="images"]').files || []);
        var db = client();
        if (!db) throw new Error("offline");
        var result = await db.from("brand_sellers").insert({
          brand_name: String(data.get("brand_name") || "").trim().slice(0, 140),
          contact_name: String(data.get("contact_name") || "").trim().slice(0, 140),
          email: String(data.get("email") || "").trim().slice(0, 160),
          phone: String(data.get("phone") || "").trim().slice(0, 40),
          category: String(data.get("category") || ""),
          product_description: String(data.get("product_description") || "").trim().slice(0, 4000),
          website: String(data.get("website") || "").trim().slice(0, 240),
          facebook: String(data.get("facebook") || "").trim().slice(0, 240),
          instagram: String(data.get("instagram") || "").trim().slice(0, 240),
          image_urls: photos,
          production_location: String(data.get("production_location") || "").trim().slice(0, 180),
          made_in_mongolia: true,
          status: "pending"
        });
        if (result.error) throw result.error;
        note.textContent = t("sent");
        form.reset();
      } catch (error) {
        note.textContent = t("fail");
      }
    });
  }

  async function renderGerCategory() {
    var target = document.getElementById("store-products");
    var catalog = await loadGerCatalog();
    if (!catalog) return;
    var remote = await publishedProducts("ger-home");
    activeManifest = await loadGerManifest();
    renderProducts(mergeGerList(catalog.products, remote), target);
  }

  async function refresh() {
    var page = document.querySelector("[data-store-page]");
    if (!page) return;
    var kind = page.getAttribute("data-store-page");
    if (kind === "home") {
      renderProducts(await publishedProducts(), document.getElementById("store-products"));
      await renderBrands();
    }
    if (kind === "category") {
      var slug = page.getAttribute("data-category");
      if (slug === "ger-home") await renderGerCategory();
      else renderProducts(await publishedProducts(slug), document.getElementById("store-products"));
    }
    if (kind === "product") await renderProduct();
  }

  function init() {
    bindSeller();
    var cartBtn = document.getElementById("store-cart-open");
    if (cartBtn) cartBtn.addEventListener("click", function () { renderCart(true); });
    refresh();
  }

  var api = {
    refresh: refresh,
    categories: CATEGORIES,
    SHIPPING_NOTICE: SHIPPING_NOTICE,
    validateQuote: validateQuote,
    buildQuotePayload: buildQuotePayload,
    quoteSucceeded: quoteSucceeded,
    mergeGerProduct: mergeGerProduct,
    visibleProductImages: visibleProductImages,
    isSafeProductImage: isSafeProductImage,
    displaySpec: displaySpec,
    startingLabel: startingLabel,
    whatsappLink: whatsappLink,
    productJsonLd: productJsonLd,
    offerAvailability: offerAvailability
  };
  global.BMStore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
