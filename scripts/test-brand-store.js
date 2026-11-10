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

console.log("ok  brand store structure");
