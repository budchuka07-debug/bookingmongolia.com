const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "tours-dates.html"), "utf8");

assert.ok(html.includes('id="winter-\' + escapeHtml(tour.id)'), "winter- anchor rendering");
assert.ok(html.includes("Winter tour routes"), "winter route heading");
assert.ok(html.includes("Winter events, November – April"), "winter events heading");
assert.ok(
  /t\.region === 'winter' \|\| t\.priceMode === 'ask'/.test(html) && html.includes("openDetailModal('${t.id}')"),
  "openDetailModal for winter tours"
);
assert.ok(html.includes("openDetailModal(\\'' + escapeHtml(tour.id) + '\\')"), "route itinerary button opens the modal");

["khuvsgul-winter-adventure", "khentii-chinggis-khan", "central-mongolia-winter", "terelj-winter"].forEach(function (slug) {
  assert.ok(html.includes(slug), slug);
  assert.ok(html.includes("/winter-tours/" + slug), "page " + slug);
});

assert.ok(html.includes("Day 1 — Murun to Khatgal"), "khuvsgul day title");
assert.ok(html.includes("Day 1 — Ulaanbaatar and Tsonjin Boldog"), "khentii day title");
assert.ok(html.includes("Day 1 — Ulaanbaatar, Khugnu Khan, Elsen Tasarkhai"), "central day title");
assert.ok(html.includes("Day 1 — Ulaanbaatar to Terelj"), "terelj day title");
assert.ok(html.includes("Request a Quote"), "quote price text");
assert.ok(!/id="price-khuvsgul-winter-adventure"/.test(html), "winter page route stays out of the 2027 price index");
assert.ok(!/id="price-terelj-winter"/.test(html), "terelj winter stays out of the 2027 price index");

console.log("ok  tours-dates winter routes");
