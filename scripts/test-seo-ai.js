const fs = require("fs");
const assert = require("assert");
const { catalogTours, priceFacts, faq } = require("./build-seo-facts.js");

const llms = fs.readFileSync("llms.txt", "utf8");
assert.ok(llms.startsWith("# Booking Mongolia\n"), "llms title");
assert.ok(llms.length > 50, "llms length");
assert.ok(/\]\(https:\/\/bookingmongolia\.com\//.test(llms), "llms link");

const toursPage = fs.readFileSync("tours-dates.html", "utf8");
const tours = catalogTours(toursPage);
tours.forEach(function (tour) {
  const facts = priceFacts(tour);
  if (facts.quote) {
    assert.ok(llms.includes("[" + tour.name + "]"), tour.name);
    return;
  }
  assert.ok(llms.includes(facts.line), tour.name + " price missing from llms.txt");
  assert.ok(toursPage.includes(facts.line), tour.name + " price missing from Tour Dates HTML");
});

faq.forEach(function (item) {
  assert.ok(toursPage.includes("<h3>" + item.q + "</h3>"), item.q);
  assert.ok(toursPage.includes(item.a), item.a);
});

const home = fs.readFileSync("index.html", "utf8");
assert.ok(!home.includes('role="tablist"'), "hotel filters are not a tablist");
assert.ok(home.includes('role="group"'), "hotel filters are a group");

const about = fs.readFileSync("about.html", "utf8");
assert.ok(!about.includes("about-ja.html"), "about page does not claim a Japanese translation");
assert.ok(about.includes('hreflang="ko"'), "Korean about page stays linked");

const aboutJa = fs.readFileSync("about-ja.html", "utf8");
assert.ok(aboutJa.includes("noindex"), "English clone is not indexed as Japanese");

const robots = fs.readFileSync("robots.txt", "utf8");
assert.ok(robots.includes("https://bookingmongolia.com/llms.txt"), "robots points at llms.txt");
["Googlebot", "Google-Extended", "GPTBot", "PerplexityBot", "ClaudeBot"].forEach(function (bot) {
  assert.ok(robots.includes("User-agent: " + bot), bot);
});

const gobi = fs.readFileSync("tours/gobi-desert-tour.html", "utf8");
assert.ok(gobi.includes('"price": "1540"'), "Gobi offer is the 7-day total");
assert.ok(!gobi.includes('role="tablist"'));

console.log("seo ai checks passed");
