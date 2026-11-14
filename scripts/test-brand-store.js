const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const sql = read("supabase/migrations/20261110_brand_store.sql");
assert.ok(sql.includes("create table if not exists public.brand_sellers"));
assert.ok(sql.includes("create table if not exists public.brand_products"));
assert.ok(sql.includes("status = 'pending'"));
assert.ok(sql.includes("made_in_mongolia = true"));
assert.ok(!/drop table/i.test(sql));
assert.ok(!sql.includes("community_posts"));
assert.ok(!sql.includes("property_submissions"));
assert.ok(!sql.includes("gallery_items"));

const home = read("brand-store/index.html");
["cashmere", "leather-crafts", "art-crafts", "ger-home", "traditional-clothing", "gifts-souvenirs"].forEach((slug) => {
  assert.ok(home.includes("/brand-store/category/" + slug), slug);
  assert.ok(fs.existsSync(path.join(root, "brand-store/category/" + slug + ".html")));
});
assert.ok(home.includes("not for sale"));
assert.ok(!/\$\d/.test(home));

const seller = read("brand-store/become-a-seller.html");
["brand_name", "contact_name", "email", "phone", "category", "product_description", "website", "facebook", "instagram", "images", "production_location", "made_in_mongolia"].forEach((name) => {
  assert.ok(seller.includes('name="' + name + '"'), name);
});

const storeJs = read("js/brand-store.js");
assert.ok(storeJs.includes('status: "pending"'));
assert.ok(!storeJs.includes("checkout"));
assert.ok(!storeJs.includes("qpay"));
assert.ok(!/\$\d+/.test(storeJs));

const admin = read("netlify/functions/admin-action.js");
assert.ok(admin.includes('"brand_sellers"'));
assert.ok(admin.includes("saveBrandProduct"));
assert.ok(admin.includes("departures") === false);

const store = require("../js/brand-store.js");
const SHIPPING = "International shipping is arranged and paid for separately by the buyer. Import duties, customs clearance, taxes, and local delivery are the buyer's responsibility.";
assert.strictEqual(store.SHIPPING_NOTICE, SHIPPING);
assert.ok(storeJs.includes(SHIPPING));
assert.ok(storeJs.includes("https://formspree.io/f/xwvwywob"));
assert.ok(storeJs.includes("product_slug"));
assert.ok(storeJs.includes('dataset.sending'));
assert.ok(storeJs.includes("Sending…"));
assert.ok(!storeJs.includes("miniature"));
assert.ok(!/Ger models/.test(storeJs));
assert.ok(store.categories.filter((item) => item.slug !== "ger-home").every((item) => {
  const original = {
    cashmere: "Sweaters, scarves, shawls, coats and wool accessories from Mongolian makers.",
    "leather-crafts": "Leather bags, wallets, belts and traditional handmade work.",
    "art-crafts": "Paintings, felt art, traditional artwork and artisan pieces.",
    "traditional-clothing": "Deel, traditional clothing, modern Mongolian fashion and accessories.",
    "gifts-souvenirs": "Gifts and handmade souvenirs that can travel home."
  }[item.slug];
  return item.text === original;
}));

assert.strictEqual(store.validateQuote({ name: "", email: "ann@example.com", message: "Please quote this ger." }).ok, false);
assert.strictEqual(store.validateQuote({ name: "Ann", email: "not-an-email", message: "Please quote this ger." }).ok, false);
assert.strictEqual(store.validateQuote({ name: "Ann", email: "ann@example.com", message: "" }).ok, false);
assert.strictEqual(store.validateQuote({ name: "Ann", email: "ann@example.com", message: "Hi" }).ok, false);
const valid = store.validateQuote({ name: "Ann", email: "ann@example.com", message: "Please send a quotation." });
assert.strictEqual(valid.ok, true);
const payload = store.buildQuotePayload({
  slug: "traditional-ereen-ger",
  name: "Traditional Ereen Mongolian Ger",
  price_amount: 2000,
  price_currency: "USD"
}, valid);
assert.strictEqual(payload.product_slug, "traditional-ereen-ger");
assert.strictEqual(payload.price_amount, 2000);
assert.strictEqual(payload.price_currency, "USD");
assert.strictEqual(store.quoteSucceeded(false, false), false);
assert.strictEqual(store.quoteSucceeded(true, false), true);
assert.strictEqual(store.quoteSucceeded(false, true), true);
assert.ok(store.whatsappLink({ name: "Traditional Ereen Mongolian Ger", price_amount: 2000, price_currency: "USD" }).startsWith("https://wa.me/97690283039?text="));

const catalog = JSON.parse(read("data/mongolian-ger-catalog.json"));
const manifest = JSON.parse(read("data/mongolian-ger-manifest.json"));
assert.deepStrictEqual(manifest.files, []);
assert.strictEqual(catalog.shipping_notice, SHIPPING);
assert.strictEqual(catalog.products.length, 2);
const forbidden = /naadam|terelj|khuvsgul|steppe|\/images\/(?:destinations|tour|hero|experiences|guide)\//i;
const specKeys = ["dimensions", "total_weight_kg", "wooden_structure_weight", "complete_package_weight", "number_of_packages", "package_dimensions", "total_cbm", "packaging_type", "shipping_methods", "production_lead_time", "customization_notes"];
catalog.products.forEach((product) => {
  assert.strictEqual(product.category_slug, "ger-home");
  assert.strictEqual(product.shipping_included, false);
  assert.strictEqual(product.stock_status, "made_to_order");
  assert.ok(!forbidden.test(JSON.stringify(product.galleries || [])));
  product.galleries.forEach((group) => {
    group.images.forEach((url) => {
      assert.ok(url.startsWith("/images/mongolian-ger/"), url);
      assert.strictEqual(store.isSafeProductImage(url), true, url);
      assert.deepStrictEqual(store.visibleProductImages([url], []), []);
    });
  });
  specKeys.forEach((key) => {
    const value = product.specs[key];
    assert.ok(value === "To be confirmed" || value === "Available upon request", key + "=" + value);
    assert.ok(!/\d/.test(value), key);
  });
  const ld = store.productJsonLd(product, []);
  assert.strictEqual(ld.offers.priceCurrency, "USD");
  assert.strictEqual(ld.offers.availability, "https://schema.org/PreOrder");
  assert.ok(!ld.offers.shippingDetails);
  assert.ok(!JSON.stringify(ld).includes("InStock"));
  assert.ok(!ld.image);
});
const ereen = catalog.products.find((item) => item.slug === "traditional-ereen-ger");
const luxury = catalog.products.find((item) => item.slug === "luxury-hand-carved-ger");
assert.strictEqual(ereen.price_amount, 2000);
assert.strictEqual(luxury.price_amount, 35000);
assert.strictEqual(store.productJsonLd(ereen, []).offers.price, "2000");
assert.strictEqual(store.productJsonLd(luxury, []).offers.price, "35000");
assert.strictEqual(store.startingLabel(2000, "USD"), "Starting at $2,000");
assert.strictEqual(store.startingLabel(35000, "USD"), "Starting at $35,000");
const overridden = store.mergeGerProduct(ereen, { slug: "traditional-ereen-ger", price_amount: 2100, price_currency: "USD", description: "Admin description", origin: "Mongolia", image_urls: [] });
assert.strictEqual(overridden.price_amount, 2100);
assert.strictEqual(overridden.description, "Admin description");
assert.strictEqual(overridden.shipping_note, SHIPPING);
assert.strictEqual(store.displaySpec(""), "To be confirmed");
assert.strictEqual(store.displaySpec("To be confirmed"), "To be confirmed");
assert.ok(!store.isSafeProductImage("/images/destinations/khuvsgul-lake.webp"));
assert.ok(!store.isSafeProductImage("/images/tour/mongolia-jeep-tour.jpg"));

const gerPage = read("brand-store/category/ger-home.html");
assert.ok(gerPage.includes("Mongolian Ger Collection"));
assert.ok(gerPage.includes("Starting at $2,000"));
assert.ok(gerPage.includes("Starting at $35,000"));
assert.ok(gerPage.includes("/brand-store/product/traditional-ereen-ger"));
assert.ok(gerPage.includes("/brand-store/product/luxury-hand-carved-ger"));
assert.ok(gerPage.includes(SHIPPING));
assert.ok(!gerPage.includes("og:image"));
assert.ok(!/khuvsgul|miniature|destinations\/|images\/tour/i.test(gerPage));
assert.ok(gerPage.includes("https://schema.org/PreOrder"));
assert.ok(!gerPage.includes("InStock"));

const productPage = read("brand-store/product.html");
assert.ok(!productPage.includes("og:image"));
assert.ok(!/images\/(?:destinations|tour|hero|experiences)/.test(productPage));

["ereen", "luxury-carved", "components", "interior", "doors", "crown-ring"].forEach((folder) => {
  assert.ok(fs.existsSync(path.join(root, "images/mongolian-ger", folder)));
  const names = fs.readdirSync(path.join(root, "images/mongolian-ger", folder)).filter((name) => !name.startsWith("."));
  assert.deepStrictEqual(names, [], folder);
});
const photoReadme = read("images/mongolian-ger/README.md");
["ereen-exterior-01.jpg", "luxury-carved-exterior-01.jpg", "painted-wall-component-01.jpg", "carved-column-component-01.jpg", "luxury-interior-01.jpg", "carved-door-01.jpg", "carved-crown-ring-01.jpg"].forEach((name) => {
  assert.ok(photoReadme.includes(name), name);
});

const specsSql = read("supabase/migrations/20261114_brand_product_specs.sql");
assert.ok(specsSql.includes("add column if not exists specs jsonb"));
assert.ok(/sql editor/i.test(specsSql));
assert.ok(!/drop table/i.test(specsSql));

const adminPage = read("admin.html");
["bpPrice", "bpDimensions", "bpWeightTotal", "bpWeightWood", "bpWeightPackage", "bpPackageCount", "bpPackageDimensions", "bpCbm", "bpPackaging", "bpShipMethods", "bpLead", "bpCustom", "bpStatus", "bpImages"].forEach((id) => {
  assert.ok(adminPage.includes('id="' + id + '"'), id);
});
assert.ok(admin.includes("specs"));
assert.ok(admin.includes("Destination and tour images are not product photos."));

const css = read("css/brand-store.css");
assert.ok(css.includes("max-width:900px"));
assert.ok(css.includes(".ger-layout"));

console.log("ok  brand store structure");
