const assert = require("assert");
const pricing = require("../js/pricing-2027.js");

function test(name, fn) {
  fn();
  console.log("ok  " + name);
}

test("standard 4+ is $190 a day and is not raised again", function () {
  var q = pricing.quote({ id: "central-classic-5d", name: "Central Mongolia 5 Days", region: "central", days: 5 }, 4);
  assert.strictEqual(q.tier, "standard");
  assert.strictEqual(q.daily, 190);
  assert.strictEqual(q.perPerson, 950);
  assert.strictEqual(q.total, 3800);
});

test("standard 3 and 2 use their own rates once", function () {
  var three = pricing.quote({ name: "Orkhon Valley 5 Days", region: "central", days: 5 }, 3);
  var two = pricing.quote({ name: "Orkhon Valley 5 Days", region: "central", days: 5 }, 2);
  assert.strictEqual(three.daily, 220);
  assert.strictEqual(three.total, 220 * 5 * 3);
  assert.strictEqual(two.daily, 260);
  assert.strictEqual(two.total, 260 * 5 * 2);
});

test("one traveler is a quote", function () {
  var q = pricing.quote({ name: "Central Mongolia 5 Days", region: "central", days: 5 }, 1);
  assert.strictEqual(q.quote, true);
  assert.strictEqual(q.reason, "solo");
});

test("five travelers use the 4+ daily rate", function () {
  var q = pricing.quote({ name: "Central Mongolia 5 Days", region: "central", days: 5 }, "5+");
  assert.strictEqual(q.daily, 190);
  assert.strictEqual(q.travelers, 5);
  assert.strictEqual(q.total, 190 * 5 * 5);
});

test("gobi uses the gobi table once", function () {
  var q = pricing.quote({ id: "gobi-classic-7d", name: "Gobi Classic 7 Days", region: "gobi", days: 7 }, 4);
  assert.strictEqual(q.tier, "gobi");
  assert.strictEqual(q.daily, 220);
  assert.strictEqual(q.perPerson, 1540);
  assert.notStrictEqual(q.daily, 190 + 30 + 30);
});

test("tsaatan and altai use their tables and do not stack on gobi", function () {
  var tsaatan = pricing.quote({ id: "taiga-reindeer-7d", name: "Taiga Reindeer 7 Days", region: "north", days: 7 }, 2);
  var altai = pricing.quote({ id: "altai-tavan-bogd-7d", name: "Altai Tavan Bogd 7 Days", region: "west", days: 7 }, 3);
  assert.strictEqual(tsaatan.tier, "tsaatan");
  assert.strictEqual(tsaatan.daily, 290);
  assert.strictEqual(altai.tier, "altai");
  assert.strictEqual(altai.daily, 250);
});

test("quoted products stay quotes", function () {
  var q = pricing.quote({ name: "VIP Helicopter Expedition", days: 1, priceMode: "ask" }, 4);
  assert.strictEqual(q.quote, true);
});

test("package prices use the itinerary base rate once", function () {
  var tour = { id: "gobi-classic-7d", name: "Gobi Desert Tour", region: "gobi", days: 7 };
  var base = pricing.quote(tour, 4);
  assert.strictEqual(base.daily, 220);
  var budget = pricing.packageQuote(tour, 4, "budget");
  var standard = pricing.packageQuote(tour, 4, "standard");
  var premium = pricing.packageQuote(tour, 4, "premium");
  assert.strictEqual(budget.baseDaily, 220);
  assert.strictEqual(budget.daily, 198);
  assert.strictEqual(budget.perPerson, 1386);
  assert.strictEqual(budget.total, 1386 * 4);
  assert.strictEqual(standard.daily, 220);
  assert.strictEqual(standard.perPerson, 1540);
  assert.strictEqual(standard.total, 1540 * 4);
  assert.strictEqual(premium.daily, 270);
  assert.strictEqual(premium.perPerson, 1890);
  assert.strictEqual(premium.total, 1890 * 4);
  assert.strictEqual(pricing.quote(tour, 4).daily, 220);
});

test("packages follow traveler count, category, and duration", function () {
  var central = { name: "Central Mongolia 5 Days", region: "central", days: 5 };
  var two = pricing.packageQuote(central, 2, "budget");
  var three = pricing.packageQuote(central, 3, "premium");
  var five = pricing.packageQuote(central, "5+", "standard");
  assert.strictEqual(two.baseDaily, 260);
  assert.strictEqual(two.daily, 234);
  assert.strictEqual(two.perPerson, 234 * 5);
  assert.strictEqual(two.total, 234 * 5 * 2);
  assert.strictEqual(three.baseDaily, 220);
  assert.strictEqual(three.daily, 270);
  assert.strictEqual(three.total, 270 * 5 * 3);
  assert.strictEqual(five.daily, 190);
  assert.strictEqual(five.travelers, 5);
  assert.strictEqual(five.total, 190 * 5 * 5);
  var altai = pricing.packageQuote({ id: "altai-tavan-bogd-7d", name: "Altai Tavan Bogd", region: "west", days: 8 }, 3, "budget");
  assert.strictEqual(altai.baseDaily, 250);
  assert.strictEqual(altai.daily, 225);
  assert.strictEqual(altai.perPerson, 225 * 8);
  var solo = pricing.packageQuote(central, 1, "premium");
  assert.strictEqual(solo.quote, true);
  assert.strictEqual(solo.packageName, "Premium");
});
