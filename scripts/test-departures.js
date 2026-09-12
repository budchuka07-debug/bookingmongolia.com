/**
 * Departure occupancy, public-API sanitization, handler guards, and frontend checks.
 * Does not call Google Sheets and does not deploy.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.join(__dirname, "..");
const logic = require("../netlify/functions/lib/departure-logic");

let failed = 0;
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("ok  " + name);
  } catch (err) {
    failed += 1;
    console.error("FAIL  " + name);
    console.error("      " + (err && err.message ? err.message : err));
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log("ok  " + name);
  } catch (err) {
    failed += 1;
    console.error("FAIL  " + name);
    console.error("      " + (err && err.message ? err.message : err));
  }
}

function gobiRows(now) {
  const future = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const past = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  return [
    {
      departure_id: "GC-2026-09-20",
      booking_id: "BM001",
      tour_id: "gobi-classic-7d",
      tour_name: "Gobi Classic 7 Days",
      start_date: "Sep 20, 2026",
      end_date: "Sep 26, 2026",
      pax: 2,
      max_pax: 6,
      status: "Confirmed",
      join_status: "Open for Join",
      website_published: "YES",
      selling_price: "$990",
      route: "UB → Gobi",
      email: "secret@example.com",
      phone: "+976000000",
      driver_phone: "+976111",
      hotel_camp_phones: "+976222",
      expenses: "400",
      profit: "200",
      paid: "500",
      balance: "490",
      notes: "internal only",
      customer: "Alice"
    },
    {
      departure_id: "GC-2026-09-20",
      booking_id: "BM002",
      tour_name: "Gobi Classic 7 Days",
      pax: 1,
      max_pax: 6,
      status: "Confirmed",
      website_published: "",
      email: "bob@example.com"
    },
    {
      departure_id: "GC-2026-09-20",
      booking_id: "BM003",
      tour_name: "Gobi Classic 7 Days",
      pax: 2,
      max_pax: 6,
      status: "Pending",
      hold_expires: future,
      website_published: ""
    },
    {
      departure_id: "GC-2026-09-20",
      booking_id: "BM004",
      tour_name: "Gobi Classic 7 Days",
      pax: 2,
      max_pax: 6,
      status: "Pending",
      hold_expires: past,
      website_published: ""
    }
  ];
}

const now = new Date("2026-09-12T05:00:00.000Z");

test("multiple booking IDs share one departure", () => {
  const groups = logic.groupByDeparture(gobiRows(now));
  assert.strictEqual(groups.size, 1);
  assert.strictEqual(groups.get("GC-2026-09-20").length, 4);
  assert.deepStrictEqual(
    groups.get("GC-2026-09-20").map((row) => row.booking_id),
    ["BM001", "BM002", "BM003", "BM004"]
  );
});

test("confirmed pax counts only Confirmed bookings", () => {
  const rows = gobiRows(now);
  const summary = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(summary.confirmed_pax, 3);
});

test("Paid / Booked statuses do not count as confirmed", () => {
  assert.strictEqual(logic.isConfirmedStatus("Paid"), false);
  assert.strictEqual(logic.isConfirmedStatus("Booked"), false);
  assert.strictEqual(logic.isConfirmedStatus("Pending"), false);
  assert.strictEqual(logic.isConfirmedStatus("Confirmed"), true);
  assert.strictEqual(logic.isConfirmedStatus("Confirmed - deposit"), true);
});

test("pending bookings reserve seats while hold is active", () => {
  const summary = logic.summarizeDeparture("GC-2026-09-20", gobiRows(now), now);
  assert.strictEqual(summary.held_pax, 2);
  assert.strictEqual(summary.occupied_pax, 5);
});

test("expired pending holds release seats", () => {
  const rows = gobiRows(now);
  const before = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(before.seats_available, 1);
  const expired = logic.expirePendingHolds(rows, now);
  assert.strictEqual(expired, 1);
  const after = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(after.held_pax, 2);
  assert.strictEqual(after.seats_available, 1);
  assert.strictEqual(rows.find((row) => row.booking_id === "BM004").status, "Hold Expired");
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  logic.expirePendingHolds(rows, later);
  const released = logic.summarizeDeparture("GC-2026-09-20", rows, later);
  assert.strictEqual(released.held_pax, 0);
  assert.strictEqual(released.confirmed_pax, 3);
  assert.strictEqual(released.seats_available, 3);
});

test("seats = max - confirmed - active pending holds", () => {
  const summary = logic.summarizeDeparture("GC-2026-09-20", gobiRows(now), now);
  assert.strictEqual(summary.max_pax, 6);
  assert.strictEqual(summary.seats_available, 6 - 3 - 2);
});

test("never accept pax that would exceed max", () => {
  const summary = logic.summarizeDeparture("GC-2026-09-20", gobiRows(now), now);
  assert.strictEqual(logic.canAcceptPax(summary, 1), true);
  assert.strictEqual(logic.canAcceptPax(summary, 2), false);
  assert.strictEqual(summary.occupied_pax + 1 <= summary.max_pax, true);
  assert.strictEqual(summary.occupied_pax + 2 <= summary.max_pax, false);
});

test("closed departures reject joins even if seats remain", () => {
  const rows = gobiRows(now).map((row) => Object.assign({}, row, { join_status: "Closed" }));
  const summary = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(summary.join_status, "Closed");
  assert.strictEqual(logic.canAcceptPax(summary, 1), false);
});

test("next booking id increments across existing BM IDs", () => {
  assert.strictEqual(logic.nextBookingId(gobiRows(now)), "BM005");
  assert.strictEqual(logic.nextBookingId([]), "BM001");
});

test("public departure payload omits private fields", () => {
  const summary = logic.summarizeDeparture("GC-2026-09-20", gobiRows(now), now);
  const pub = logic.toPublicDeparture(summary);
  logic.assertNoPrivateFields(pub);
  assert.strictEqual(pub.tour_name, "Gobi Classic 7 Days");
  assert.strictEqual("email" in pub, false);
  assert.strictEqual("phone" in pub, false);
  assert.strictEqual("driver_phone" in pub, false);
  assert.strictEqual("hotel_camp_phones" in pub, false);
  assert.strictEqual("expenses" in pub, false);
  assert.strictEqual("profit" in pub, false);
  assert.strictEqual("paid" in pub, false);
  assert.strictEqual("balance" in pub, false);
  assert.strictEqual("notes" in pub, false);
  assert.strictEqual("customer" in pub, false);
  assert.strictEqual("held_pax" in pub, false);
});

test("public booking payload omits private fields", () => {
  const pub = logic.toPublicBooking({
    booking_id: "BM001",
    departure_id: "GC-2026-09-20",
    tour_name: "Gobi Classic 7 Days",
    pax: 2,
    status: "Pending",
    email: "secret@example.com",
    phone: "+976",
    notes: "do not leak",
    paid: "100",
    profit: "50"
  });
  logic.assertNoPrivateFields(pub);
  assert.strictEqual(pub.booking_id, "BM001");
  assert.strictEqual("email" in pub, false);
  assert.strictEqual("notes" in pub, false);
  assert.strictEqual("paid" in pub, false);
});

test("assertNoPrivateFields throws on leaked keys", () => {
  assert.throws(() => logic.assertNoPrivateFields({ email: "a@b.c" }));
  assert.doesNotThrow(() => logic.assertNoPrivateFields({ tour_name: "Gobi", seats_available: 4 }));
});

test("published open departures are joinable public group dates", () => {
  const summary = logic.summarizeDeparture("GC-2026-09-20", gobiRows(now), now);
  assert.strictEqual(summary.publicly_joinable, true);
  const listed = logic.listJoinablePublicDepartures(gobiRows(now), now);
  assert.strictEqual(listed.length, 1);
  assert.strictEqual(listed[0].departure_id, "GC-2026-09-20");
  assert.strictEqual(listed[0].tour_name, "Gobi Classic 7 Days");
  assert.strictEqual(listed[0].tour_id, "gobi-classic-7d");
  assert.strictEqual("publicly_joinable" in listed[0], false);
  assert.strictEqual("website_published" in listed[0], false);
  assert.strictEqual("booking_id" in listed[0], false);
});

test("a normal booking row is not a public tour or join card", () => {
  const privateOnly = [{
    departure_id: "PRIVATE-2026-05-01",
    booking_id: "BM099",
    tour_name: "Private Gobi request",
    start_date: "May 1, 2026",
    end_date: "May 7, 2026",
    pax: 2,
    max_pax: 4,
    status: "Confirmed",
    join_status: "Open for Join",
    website_published: ""
  }];
  const summary = logic.summarizeDeparture("PRIVATE-2026-05-01", privateOnly, now);
  assert.strictEqual(summary.website_published, false);
  assert.strictEqual(summary.publicly_joinable, false);
  assert.strictEqual(logic.listJoinablePublicDepartures(privateOnly.concat(gobiRows(now)), now).length, 1);
  assert.strictEqual(
    logic.listJoinablePublicDepartures(privateOnly.concat(gobiRows(now)), now)[0].departure_id,
    "GC-2026-09-20"
  );
});

test("published without Open for Join is not listed", () => {
  const rows = gobiRows(now).map((row) => Object.assign({}, row, {
    website_published: row.booking_id === "BM001" ? "YES" : "",
    join_status: ""
  }));
  const summary = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(summary.website_published, true);
  assert.strictEqual(summary.publicly_joinable, false);
  assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 0);
});

test("cancelled and expired join statuses are not available", () => {
  ["Cancelled", "Canceled", "Expired"].forEach((joinStatus) => {
    const rows = gobiRows(now).map((row) => Object.assign({}, row, { join_status: joinStatus }));
    const summary = logic.summarizeDeparture("GC-2026-09-20", rows, now);
    assert.strictEqual(summary.join_status, "Closed");
    assert.strictEqual(summary.publicly_joinable, false);
    assert.strictEqual(logic.canAcceptPax(summary, 1), false);
    assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 0);
  });
});

test("fully booked published departures are not join options", () => {
  const rows = gobiRows(now).map((row) => Object.assign({}, row, { max_pax: 3, pax: row.booking_id === "BM001" ? 3 : 0 }));
  rows[1].status = "Hold Expired";
  rows[2].status = "Hold Expired";
  rows[3].status = "Hold Expired";
  const summary = logic.summarizeDeparture("GC-2026-09-20", rows, now);
  assert.strictEqual(summary.confirmed_pax, 3);
  assert.strictEqual(summary.seats_available, 0);
  assert.strictEqual(summary.join_status, "Fully Booked");
  assert.strictEqual(summary.publicly_joinable, false);
  assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 0);
});

test("TEST departure IDs are hidden from the public join list", () => {
  const rows = gobiRows(now).map((row) => Object.assign({}, row, { departure_id: "TEST-GC-2026-09-20" }));
  const summary = logic.summarizeDeparture("TEST-GC-2026-09-20", rows, now);
  assert.strictEqual(summary.publicly_joinable, true);
  assert.strictEqual(logic.isTestDepartureId("TEST-GC-2026-09-20"), true);
  assert.strictEqual(logic.isPubliclyJoinable(summary), false);
  assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 0);
});

test("ALLOW_TEST_DEPARTURES can list TEST ids for local checks only", () => {
  const rows = gobiRows(now).map((row) => Object.assign({}, row, { departure_id: "TEST-GC-2026-09-20" }));
  process.env.ALLOW_TEST_DEPARTURES = "1";
  try {
    assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 1);
  } finally {
    delete process.env.ALLOW_TEST_DEPARTURES;
  }
  assert.strictEqual(logic.listJoinablePublicDepartures(rows, now).length, 0);
});

test("frontend JS has no Google credentials", () => {
  const files = [
    "js/departures.js",
    "js/index-app.js",
    "tours-dates.html",
    "booking.html"
  ];
  const banned = [
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_CLIENT_EMAIL",
    "private_key",
    "client_email"
  ];
  files.forEach((rel) => {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    banned.forEach((token) => {
      assert.strictEqual(text.includes(token), false, rel + " contains " + token);
    });
  });
});

test("credentials exist only in server google-auth helper", () => {
  const auth = fs.readFileSync(path.join(root, "netlify/functions/lib/google-auth.js"), "utf8");
  assert.ok(auth.includes("process.env.GOOGLE_SERVICE_ACCOUNT_JSON"));
  assert.ok(auth.includes("process.env.GOOGLE_PRIVATE_KEY"));
  assert.ok(auth.includes("1BbbiaPNG-A7B4La53or4Dsv7E46XE6O35JXTQX0HeeU"));
});

test("legacy Sheet1 spreadsheet id is ignored in favor of Tour Manager", () => {
  const googleAuth = require("../netlify/functions/lib/google-auth");
  const previous = process.env.GOOGLE_SHEET_ID;
  try {
    process.env.GOOGLE_SHEET_ID = "1tRE1n9oNVyGnxWkepw-MvtRw5X3nhL6wiN9kZxAGeGE";
    assert.strictEqual(googleAuth.getSpreadsheetId(), "1BbbiaPNG-A7B4La53or4Dsv7E46XE6O35JXTQX0HeeU");
    delete process.env.GOOGLE_SHEET_ID;
    assert.strictEqual(googleAuth.getSpreadsheetId(), "1BbbiaPNG-A7B4La53or4Dsv7E46XE6O35JXTQX0HeeU");
  } finally {
    if (previous == null) delete process.env.GOOGLE_SHEET_ID;
    else process.env.GOOGLE_SHEET_ID = previous;
  }
});

test("parses GOOGLE_SERVICE_ACCOUNT_JSON including broken private_key newlines", () => {
  const googleAuth = require("../netlify/functions/lib/google-auth");
  const email = "demo@example.iam.gserviceaccount.com";
  const valid = JSON.stringify({
    type: "service_account",
    client_email: email,
    private_key: "-----BEGIN PRIVATE KEY-----\nABC123\n-----END PRIVATE KEY-----\n"
  });
  const broken = [
    "{",
    '  "type": "service_account",',
    '  "client_email": "' + email + '",',
    '  "private_key": "-----BEGIN PRIVATE KEY-----',
    "ABC123",
    '-----END PRIVATE KEY-----',
    '"',
    "}"
  ].join("\n");
  const previous = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  try {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = valid;
    let parsed = googleAuth.parseServiceAccount();
    assert.strictEqual(parsed.client_email, email);
    assert.ok(parsed.private_key.indexOf("BEGIN PRIVATE KEY") !== -1);

    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = broken;
    parsed = googleAuth.parseServiceAccount();
    assert.strictEqual(parsed.client_email, email);
    assert.ok(parsed.private_key.indexOf("BEGIN PRIVATE KEY") !== -1);
  } finally {
    if (previous == null) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previous;
  }
});

test("production TOURS headers map without duplicating Booking/Tour columns", () => {
  const sheet = require("../netlify/functions/lib/tours-sheet");
  const headers = [
    "No.",
    "Booking No.",
    "Tour /",
    "Start Date",
    "End Date",
    "Customer",
    "Country",
    "Pax",
    "Route",
    "Accommodation(s)",
    "Camp / Guesthouse",
    "Hotel / Camp",
    "Driver",
    "Driver Phone",
    "Selling Price",
    "Paid",
    "Balance",
    "Expenses",
    "Profit"
  ];
  const map = sheet.buildHeaderIndex(headers);
  assert.ok(map.byAlias.booking_id != null);
  assert.ok(map.byAlias.tour_name != null);
  assert.ok(map.byAlias.start_date != null);
  assert.ok(map.byAlias.driver_phone != null);
  assert.ok(map.byAlias.paid != null);
  assert.strictEqual(map.byAlias.departure_id, undefined);
  assert.strictEqual(map.byAlias.max_pax, undefined);
  assert.strictEqual(map.byAlias.join_status, undefined);
  assert.strictEqual(map.byAlias.website_published, undefined);
});

test("Formspree inquiry path is still in tours-dates", () => {
  const html = fs.readFileSync(path.join(root, "tours-dates.html"), "utf8");
  assert.ok(html.includes("https://formspree.io/f/xwvwywob"));
  assert.ok(html.includes("fetch(FORMSPREE_ENDPOINT"));
  assert.ok(html.includes("if (departureId)"));
  assert.ok(html.includes("const tours = ["));
  assert.ok(html.includes("gobi-classic-7d"));
  assert.ok(html.includes('id="tourGrid"'));
  assert.ok(html.includes('id="joinDeparturesGrid"'));
  assert.ok(html.includes('id="join-now"'));
  assert.ok(html.includes("Browse Tours / Itineraries"));
  assert.ok(html.includes("Available group departures"));
  assert.ok(html.includes("const filtered = tours"));
  assert.ok(html.includes("Confirm Dates"));
  assert.ok(html.includes("function openBooking(tour)"));
  assert.ok(html.includes("function renderTours()"));
  assert.ok(html.includes("openTourFromHash"));
  assert.ok(html.includes("#tour-"));
});

test("existing itinerary pages were not removed or replaced by sheet rows", () => {
  [
    "tours/gobi-desert-tour.html",
    "tours/central-mongolia-tour.html",
    "tours/khuvsgul-lake-tour.html",
    "tours/horse-riding-tour.html",
    "tours/terelj-hustai-tour.html",
    "tours/reindeer-taiga-tour.html",
    "tours/altai-tavan-bogd-tour.html",
    "tours/naadam-festival-tour.html",
    "tours/mongolia-grand-tour.html",
    "tours.html"
  ].forEach((rel) => {
    assert.ok(fs.existsSync(path.join(root, rel)), rel + " missing");
  });
  const catalog = fs.readFileSync(path.join(root, "tours-dates.html"), "utf8");
  assert.ok(catalog.includes("'gobi-classic-7d': {route:"));
  const front = fs.readFileSync(path.join(root, "js/departures.js"), "utf8");
  assert.ok(front.includes("View Itinerary"));
  assert.ok(front.includes("already joined"));
  assert.ok(front.includes("FEATURED_ITINERARY_PAGES"));
  assert.ok(front.includes("/tours/gobi-desert-tour.html"));
  assert.ok(front.includes("Does not create tour itinerary pages from booking rows"));
  const sheet = fs.readFileSync(path.join(root, "netlify/functions/lib/tours-sheet.js"), "utf8");
  assert.ok(sheet.includes('website_published: ""'));
  assert.ok(sheet.includes("listJoinablePublicDepartures"));
  assert.ok(sheet.includes('GOOGLE_TOURS_TAB || "TOURS"'));
  assert.ok(sheet.includes("/^sheet1$/i"));
  assert.ok(front.includes("TEST([-_]|$)"));
});

test("API pretty URLs are mapped in _redirects", () => {
  const redirects = fs.readFileSync(path.join(root, "_redirects"), "utf8");
  assert.ok(redirects.includes("/api/departures  /.netlify/functions/departures  200"));
  assert.ok(redirects.includes("/api/create-booking  /.netlify/functions/create-booking  200"));
  assert.ok(redirects.includes("/api/booking-status  /.netlify/functions/booking-status  200"));
  const front = fs.readFileSync(path.join(root, "js/departures.js"), "utf8");
  assert.ok(front.includes('"/api/departures"'));
  assert.ok(front.includes('"/api/create-booking"'));
});

test("syntax: node --check on backend and frontend JS", () => {
  const files = [
    "netlify/functions/lib/departure-logic.js",
    "netlify/functions/lib/tours-sheet.js",
    "netlify/functions/lib/google-auth.js",
    "netlify/functions/departures.js",
    "netlify/functions/create-booking.js",
    "netlify/functions/booking-status.js",
    "js/departures.js"
  ];
  const { execFileSync } = require("child_process");
  files.forEach((rel) => {
    execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "pipe" });
  });
});

test("inline scripts in tours-dates and booking parse", () => {
  ["tours-dates.html", "booking.html"].forEach((rel) => {
    const html = fs.readFileSync(path.join(root, rel), "utf8");
    const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.ok(scripts.length > 0, rel + " has inline scripts");
    scripts.forEach((match, i) => {
      try {
        new vm.Script(match[1], { filename: rel + "#script" + i });
      } catch (err) {
        throw new Error(rel + " script " + i + ": " + err.message);
      }
    });
  });
});

async function runHandlerTests() {
  const departures = require("../netlify/functions/departures");
  const createBooking = require("../netlify/functions/create-booking");
  const bookingStatus = require("../netlify/functions/booking-status");

  await testAsync("GET handler rejects non-GET", async () => {
    const res = await departures.handler({ httpMethod: "POST", queryStringParameters: {} });
    assert.strictEqual(res.statusCode, 405);
  });

  await testAsync("POST handler rejects non-POST", async () => {
    const res = await createBooking.handler({ httpMethod: "GET", body: "{}" });
    assert.strictEqual(res.statusCode, 405);
  });

  await testAsync("POST create-booking rejects invalid JSON", async () => {
    const res = await createBooking.handler({ httpMethod: "POST", body: "{bad" });
    assert.strictEqual(res.statusCode, 400);
    logic.assertNoPrivateFields(JSON.parse(res.body));
  });

  await testAsync("GET booking-status requires id", async () => {
    const res = await bookingStatus.handler({ httpMethod: "GET", queryStringParameters: {} });
    assert.strictEqual(res.statusCode, 400);
  });

  await testAsync("OPTIONS handlers are empty 204", async () => {
    const a = await departures.handler({ httpMethod: "OPTIONS" });
    const b = await createBooking.handler({ httpMethod: "OPTIONS" });
    const c = await bookingStatus.handler({ httpMethod: "OPTIONS" });
    assert.strictEqual(a.statusCode, 204);
    assert.strictEqual(b.statusCode, 204);
    assert.strictEqual(c.statusCode, 204);
  });

  await testAsync("GET /departures without credentials does not leak secrets", async () => {
    const res = await departures.handler({ httpMethod: "GET", queryStringParameters: {} });
    assert.ok(res.statusCode === 500 || res.statusCode === 200);
    const body = JSON.parse(res.body);
    logic.assertNoPrivateFields(body);
    const text = JSON.stringify(body);
    assert.strictEqual(text.includes("BEGIN PRIVATE KEY"), false);
    assert.strictEqual(text.includes("client_email"), false);
  });
}

(async () => {
  try {
    await runHandlerTests();
  } catch (err) {
    failed += 1;
    console.error("FAIL  handler suite could not load");
    console.error("      " + (err && err.message ? err.message : err));
  }

  console.log("");
  console.log(passed + " passed, " + failed + " failed");
  if (failed) process.exit(1);
})();
