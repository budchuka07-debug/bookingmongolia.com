const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const pages = [
  "winter-tours/index.html",
  "winter-tours/khuvsgul-winter-adventure.html",
  "winter-tours/khentii-chinggis-khan.html",
  "winter-tours/central-mongolia-winter.html",
  "winter-tours/terelj-winter.html"
];
const scripts = ["js/winter-tours.js", "js/winter-tours-i18n.js", "css/winter-tours.css"];
const blob = pages.concat(scripts).map(read).join("\n");

assert.ok(!/\$\s?\d/.test(blob), "dollar price");
assert.ok(!/\bUSD\s*\d/.test(blob), "usd price");
assert.ok(!/insurance is included/i.test(blob), "insurance is included");
assert.ok(!/\b\d{1,2}:\d{2}\b/.test(blob), "clock or flight time");
assert.ok(!/\bflight\s+(at|departs|arrives)\b/i.test(blob), "flight time");

["Shangri-La", "Shangri La", "Kempinski", "Blue Sky Hotel", "Ramada", "Novotel", "Hyatt", "Hilton", "Best Western", "Holiday Inn", "Terelj Hotel", "Chinggis Khaan Hotel"].forEach((name) => {
  assert.ok(!blob.includes(name), name);
});

let burkhanAt = blob.indexOf("Burkhan Khaldun");
assert.ok(burkhanAt !== -1, "restriction names Burkhan Khaldun");
while (burkhanAt !== -1) {
  const windowText = blob.slice(Math.max(0, burkhanAt - 40), burkhanAt + 240);
  assert.ok(/special planning|access permission|not a guaranteed stop/i.test(windowText), windowText);
  assert.ok(!/guaranteed Burkhan Khaldun stop/i.test(windowText));
  burkhanAt = blob.indexOf("Burkhan Khaldun", burkhanAt + 16);
}

const routes = [
  ["/winter-tours", "https://bookingmongolia.com/winter-tours"],
  ["/winter-tours/khuvsgul-winter-adventure", "https://bookingmongolia.com/winter-tours/khuvsgul-winter-adventure"],
  ["/winter-tours/khentii-chinggis-khan", "https://bookingmongolia.com/winter-tours/khentii-chinggis-khan"],
  ["/winter-tours/central-mongolia-winter", "https://bookingmongolia.com/winter-tours/central-mongolia-winter"],
  ["/winter-tours/terelj-winter", "https://bookingmongolia.com/winter-tours/terelj-winter"]
];
const redirects = read("_redirects");
const sitemap = read("sitemap.xml");
const htmlMap = read("html-sitemap.html");
routes.forEach(([route, canonical]) => {
  assert.ok(redirects.includes(route + "  "), route);
  assert.ok(sitemap.includes(canonical), canonical);
  assert.ok(htmlMap.includes(route), route);
  assert.ok(blob.includes(canonical), "canonical " + canonical);
});

["name", "email", "whatsapp", "nationality", "travelers", "tour_slug", "departure_date", "days", "party", "accommodation", "message", "_subject", "form_source"].forEach((field) => {
  assert.ok(blob.includes('name="' + field + '"'), field);
});
assert.ok(blob.includes("Winter tour inquiry — Booking Mongolia"));
assert.ok(blob.includes("winter_tour_inquiry"));
assert.ok(blob.includes('id="inquiry"'));

const i18n = read("js/winter-tours-i18n.js");
assert.ok(/lang:\s*"en"/.test(i18n));
assert.ok(/lang:\s*"mn"/.test(i18n));
const packs = require("../js/winter-tours-i18n.js").packs;
const enPack = packs.find((item) => item.lang === "en").strings;
const mnPack = packs.find((item) => item.lang === "mn").strings;
const htmlKeys = new Set();
pages.forEach((page) => {
  const html = read(page);
  const re = /data-i18n(?:-alt|-placeholder)?="(wt_[^"]+)"/g;
  let match;
  while ((match = re.exec(html))) htmlKeys.add(match[1]);
});
htmlKeys.forEach((key) => {
  assert.ok(enPack[key], "en " + key);
  assert.ok(mnPack[key], "mn " + key);
  assert.notStrictEqual(enPack[key], mnPack[key], key);
});

const siteI18n = read("js/site-i18n.js");
assert.ok(siteI18n.includes('nav_winter_tours: "Winter Tours"'));
assert.ok(siteI18n.includes('nav_winter_tours: "Өвлийн аялал"'));
assert.ok(siteI18n.includes('lang !== "mn"'));
assert.ok(siteI18n.includes("function lookup"));

const nav = read("js/site-nav.js");
assert.ok(nav.includes('href = "/winter-tours"'));
assert.ok(nav.includes('data-i18n", "nav_winter_tours"'));

const sql = read("supabase/migrations/20261115_winter_inquiries.sql");
assert.ok(sql.includes("create table if not exists public.winter_inquiries"));
assert.ok(sql.includes("grant insert on table public.winter_inquiries to anon"));
assert.ok(!/grant select on table public\.winter_inquiries to anon/i.test(sql));
assert.ok(sql.includes("status = 'pending'"));
assert.ok(sql.includes("add column if not exists details jsonb"));

const admin = read("netlify/functions/admin-action.js");
assert.ok(admin.includes('"winter_inquiries"'));
assert.ok(admin.includes("winterInquiries"));
const adminPage = read("admin.html");
assert.ok(adminPage.includes("winterInquiries"));
assert.ok(adminPage.includes("Request a Quote"));
assert.ok(!/\$\d/.test(adminPage.slice(adminPage.indexOf("winterPanel"), adminPage.indexOf("winterPanel") + 800)));

const tours = require("../js/winter-tours.js");
assert.strictEqual(tours.inquirySucceeded(false, false), false);
assert.strictEqual(tours.inquirySucceeded(true, false), true);
assert.strictEqual(tours.inquirySucceeded(false, true), true);
assert.strictEqual(tours.FORMSPREE, "https://formspree.io/f/xwvwywob");
assert.deepStrictEqual(tours.TOURS.map((item) => item.slug), [
  "khuvsgul-winter-adventure",
  "khentii-chinggis-khan",
  "central-mongolia-winter",
  "terelj-winter"
]);
const bad = tours.validateInquiry({ name: "A", email: "nope", whatsapp: "12", travelers: 0, tour_slug: "nope", departure_date: "" });
assert.strictEqual(bad.ok, false);
const good = tours.validateInquiry({
  name: "Ann Bat",
  email: "ann@example.com",
  whatsapp: "+97690000000",
  nationality: "Mongolia",
  travelers: 2,
  tour_slug: "terelj-winter",
  departure_date: "2026-12-01",
  days: "",
  party: "private",
  accommodation: "heated-ger",
  message: "Please reply about availability."
});
assert.strictEqual(good.ok, true);
assert.strictEqual(good.row.status, "pending");
assert.strictEqual(good.row.days, null);
assert.strictEqual(tours.validateInquiry(Object.assign({}, good.row, { email: "ann@example.com", days: 3 })).ok, true);

const winterPage = read("winter-mongolia.html");
assert.ok(winterPage.includes('href="/winter-tours"'));
assert.ok(winterPage.includes("Tsaatan Reindeer Expedition"));

["47.92", "106.92", "47.81", "107.53", "47.98", "107.45", "50.43", "100.16", "49.02", "111.64", "47.36", "103.69", "47.20", "102.82", "47.76", "105.87"].forEach((coord) => {
  assert.ok(blob.includes(coord), coord);
});

console.log("winter tours checks passed");
