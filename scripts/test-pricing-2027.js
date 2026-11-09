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
