/**
 * TOURS sheet adapter.
 * Existing rows stay as booking/tour records. Multiple bookings share one Departure ID.
 * Calendar sync (Apps Script syncToursToCalendar) is left unchanged.
 */
const { getSheetsClient, getSpreadsheetId } = require("./google-auth");
const logic = require("./departure-logic");
const {
  toNumber,
  parseDateValue,
  formatDateLabel,
  isPendingStatus,
  isClosedJoin,
  holdStillActive,
  canAcceptPax,
  toPublicBooking,
  assertNoPrivateFields
} = logic;

const TOURS_TAB = process.env.GOOGLE_TOURS_TAB || "TOURS";
const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES || 24 * 60);

const HEADER_ALIASES = {
  tour_id: ["tour id", "tourid", "tour_id"],
  departure_id: ["departure id", "departureid", "departure_id"],
  booking_id: ["booking id", "bookingid", "booking_id"],
  tour_name: ["tour / trip", "tour/trip", "tour", "trip", "tour name", "tour / trip name"],
  start_date: ["start date", "start"],
  end_date: ["end date", "end"],
  customer: ["customer", "customer name", "name", "guest"],
  country: ["country"],
  pax: ["pax", "travelers", "guests"],
  max_pax: ["max pax", "maximum pax", "max guests"],
  current_pax: ["current pax"],
  seats_available: ["seats available", "available seats", "seats"],
  route: ["route"],
  accommodation: ["accommodation(s)", "accommodations", "accommodation"],
  camp_guesthouse: ["camp / guesthouse", "camp/guesthouse", "camp", "guesthouse"],
  hotel_camp_phones: ["hotel / camp phone(s)", "hotel/camp phone(s)", "hotel phone", "camp phone"],
  driver: ["driver"],
  driver_phone: ["driver phone", "driver phones"],
  selling_price: ["selling price", "price", "public price"],
  paid: ["paid"],
  balance: ["balance"],
  expenses: ["expenses"],
  profit: ["profit"],
  status: ["status"],
  join_status: ["join status"],
  website_published: ["website published", "published", "website"],
  reminder_date: ["reminder date"],
  next_task: ["next task"],
  notes: ["notes"],
  email: ["email"],
  phone: ["phone", "whatsapp", "contact"],
  hold_expires: ["hold expires", "hold expires at", "hold expiry"]
};

const REQUIRED_WRITE_HEADERS = [
  "Tour ID",
  "Departure ID",
  "Booking ID",
  "Tour / Trip",
  "Start Date",
  "End Date",
  "Customer",
  "Country",
  "Pax",
  "Max Pax",
  "Current Pax",
  "Seats Available",
  "Route",
  "Selling Price",
  "Status",
  "Join Status",
  "Website Published",
  "Hold Expires",
  "Notes"
];

function normHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ");
}

function colLetter(index) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function truthyFlag(value) {
  const s = String(value || "").trim().toLowerCase();
  return s === "yes" || s === "y" || s === "true" || s === "1" || s === "published";
}

function buildHeaderIndex(headers) {
  const index = {};
  headers.forEach((header, i) => {
    const key = normHeader(header);
    if (key) index[key] = i;
  });
  const mapped = {};
  Object.keys(HEADER_ALIASES).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    for (const alias of aliases) {
      if (index[alias] != null) {
        mapped[field] = index[alias];
        return;
      }
    }
  });
  return { raw: headers, byAlias: mapped, byNorm: index };
}

function rowToRecord(row, headerMap, rowNumber) {
  const rec = { _row: rowNumber, _values: row.slice() };
  Object.keys(HEADER_ALIASES).forEach((field) => {
    const idx = headerMap.byAlias[field];
    rec[field] = idx == null ? "" : (row[idx] == null ? "" : row[idx]);
  });
  return rec;
}

async function readTab(sheets, spreadsheetId, tab) {
  return sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'`,
    valueRenderOption: "FORMATTED_VALUE"
  });
}

async function loadTours() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tabs = [TOURS_TAB, "TOURS", "Tours"];
  let values = [];
  let lastError = null;
  for (const tab of [...new Set(tabs)]) {
    try {
      const res = await readTab(sheets, spreadsheetId, tab);
      values = res.data.values || [];
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError && !values.length) throw lastError;
  if (!values.length) {
    return { sheets, spreadsheetId, headerMap: buildHeaderIndex([]), records: [] };
  }
  const headerMap = buildHeaderIndex(values[0]);
  const records = values.slice(1).map((row, i) => rowToRecord(row, headerMap, i + 2));
  return { sheets, spreadsheetId, headerMap, records };
}

async function ensureWriteHeaders(ctx) {
  const missing = REQUIRED_WRITE_HEADERS.filter((name) => ctx.headerMap.byNorm[normHeader(name)] == null);
  if (!missing.length) return ctx;
  const nextHeaders = ctx.headerMap.raw.concat(missing);
  await ctx.sheets.spreadsheets.values.update({
    spreadsheetId: ctx.spreadsheetId,
    range: `'${TOURS_TAB}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [nextHeaders] }
  });
  return loadTours();
}

function nextBookingId(records) {
  return logic.nextBookingId(records);
}

function groupByDeparture(records) {
  return logic.groupByDeparture(records);
}

function summarizeDeparture(departureId, rows, now) {
  return logic.summarizeDeparture(departureId, rows, now);
}

function toPublicDeparture(summary) {
  const publicDeparture = logic.toPublicDeparture(summary);
  logic.assertNoPrivateFields(publicDeparture);
  return publicDeparture;
}

async function writeCells(ctx, updates) {
  if (!updates.length) return;
  await ctx.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ctx.spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates.map((item) => ({
        range: `'${TOURS_TAB}'!${item.cell}`,
        values: [[item.value]]
      }))
    }
  });
}

function cellFor(headerMap, field, rowNumber) {
  const idx = headerMap.byAlias[field];
  if (idx == null) return null;
  return `${colLetter(idx)}${rowNumber}`;
}

async function expireHolds(ctx, now) {
  const updates = [];
  ctx.records.forEach((row) => {
    if (!isPendingStatus(row.status)) return;
    const expires = parseDateValue(row.hold_expires);
    if (!expires || expires.getTime() > now.getTime()) return;
    row.status = "Hold Expired";
    const cell = cellFor(ctx.headerMap, "status", row._row);
    if (cell) updates.push({ cell, value: "Hold Expired" });
  });
  await writeCells(ctx, updates);
  return updates.length;
}

async function syncDepartureAggregates(ctx, departureId, now) {
  const rows = ctx.records.filter((row) => String(row.departure_id || "").trim() === departureId);
  if (!rows.length) return null;
  const summary = summarizeDeparture(departureId, rows, now);
  const updates = [];
  rows.forEach((row) => {
    row.current_pax = summary.confirmed_pax;
    row.seats_available = summary.seats_available;
    if (!isClosedJoin(row.join_status)) row.join_status = summary.join_status;
    const currentCell = cellFor(ctx.headerMap, "current_pax", row._row);
    const seatsCell = cellFor(ctx.headerMap, "seats_available", row._row);
    const joinCell = cellFor(ctx.headerMap, "join_status", row._row);
    if (currentCell) updates.push({ cell: currentCell, value: summary.confirmed_pax });
    if (seatsCell) updates.push({ cell: seatsCell, value: summary.seats_available });
    if (joinCell && !isClosedJoin(row.join_status)) updates.push({ cell: joinCell, value: summary.join_status });
  });
  await writeCells(ctx, updates);
  return summary;
}

function recordToLine(headerMap, record) {
  const line = headerMap.raw.map(() => "");
  Object.keys(record).forEach((field) => {
    if (field.startsWith("_")) return;
    const idx = headerMap.byAlias[field];
    if (idx == null) return;
    const value = record[field];
    line[idx] = value == null ? "" : value;
  });
  return line;
}

async function listPublishedDepartures() {
  const now = new Date();
  let ctx = await loadTours();
  ctx = await ensureWriteHeaders(ctx);
  await expireHolds(ctx, now);
  return logic.listJoinablePublicDepartures(ctx.records, now);
}

async function getPublishedDeparture(departureId) {
  const id = String(departureId || "").trim();
  if (!id) return null;
  const now = new Date();
  let ctx = await loadTours();
  await expireHolds(ctx, now);
  const rows = ctx.records.filter((row) => String(row.departure_id || "").trim() === id);
  if (!rows.length) return null;
  const summary = summarizeDeparture(id, rows, now);
  if (!summary.website_published) return null;
  const withdrawn = rows.some((row) => {
    if (!logic.isWebsitePublished(row.website_published)) return false;
    return /cancel|expired|void/i.test(String(row.join_status || ""));
  });
  if (withdrawn) return null;
  return toPublicDeparture(summary);
}

async function getPublicBookingStatus(bookingId) {
  const id = String(bookingId || "").trim().toUpperCase();
  if (!id) return null;
  const now = new Date();
  let ctx = await loadTours();
  await expireHolds(ctx, now);
  const row = ctx.records.find((item) => String(item.booking_id || "").trim().toUpperCase() === id);
  if (!row) return null;
  const activeHold = holdStillActive(row, now);
  let status = String(row.status || "").trim() || "Pending";
  if (isPendingStatus(status) && !activeHold) status = "Hold Expired";
  const publicBooking = toPublicBooking({
    booking_id: id,
    departure_id: String(row.departure_id || "").trim(),
    tour_name: String(row.tour_name || "").trim(),
    date_label: formatDateLabel(row.start_date, row.end_date),
    pax: toNumber(row.pax),
    status,
    hold_expires_at: isPendingStatus(row.status) ? String(row.hold_expires || "").trim() : ""
  });
  assertNoPrivateFields(publicBooking);
  return publicBooking;
}

async function createPendingBooking(input) {
  const now = new Date();
  let ctx = await loadTours();
  ctx = await ensureWriteHeaders(ctx);
  await expireHolds(ctx, now);

  const departureId = String(input.departure_id || "").trim();
  if (!departureId) throw Object.assign(new Error("Missing Departure ID"), { statusCode: 400 });

  const paxRaw = toNumber(input.pax);
  if (!paxRaw) throw Object.assign(new Error("Number of travelers is required"), { statusCode: 400 });
  const pax = Math.max(1, Math.min(20, Math.round(paxRaw)));

  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim();
  const phone = String(input.phone || "").trim();
  const country = String(input.country || "").trim();
  if (!name || !email || !phone || !country) {
    throw Object.assign(new Error("Name, email, phone and country are required"), { statusCode: 400 });
  }

  const rows = ctx.records.filter((row) => String(row.departure_id || "").trim() === departureId);
  if (!rows.length) {
    throw Object.assign(new Error("Departure not found"), { statusCode: 404 });
  }

  const summary = summarizeDeparture(departureId, rows, now);
  if (!logic.isPubliclyJoinable(summary)) {
    if (summary.join_status === "Closed") {
      throw Object.assign(new Error("This departure is closed"), { statusCode: 409 });
    }
    if (!summary.website_published) {
      throw Object.assign(new Error("This departure is not open on the website"), { statusCode: 400 });
    }
    if (summary.seats_available <= 0 || summary.join_status === "Fully Booked") {
      throw Object.assign(new Error("Not enough seats available"), { statusCode: 409 });
    }
    throw Object.assign(new Error("This departure is not open on the website"), { statusCode: 400 });
  }
  if (!canAcceptPax(summary, pax)) {
    const message = summary.join_status === "Closed"
      ? "This departure is closed"
      : "Not enough seats available";
    throw Object.assign(new Error(message), { statusCode: 409 });
  }

  const holdUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
  const bookingId = nextBookingId(ctx.records);
  const seed = rows.find((row) => truthyFlag(row.website_published)) || rows[0];
  const notes = String(input.notes || "").trim();

  const record = {
    tour_id: seed.tour_id || "",
    departure_id: departureId,
    booking_id: bookingId,
    tour_name: seed.tour_name || "",
    start_date: seed.start_date || "",
    end_date: seed.end_date || "",
    customer: name,
    country,
    email,
    phone,
    pax,
    max_pax: seed.max_pax || summary.max_pax,
    current_pax: summary.confirmed_pax,
    seats_available: Math.max(0, summary.seats_available - pax),
    route: seed.route || "",
    selling_price: seed.selling_price || "",
    status: "Pending",
    join_status: seed.join_status || "Open for Join",
    website_published: "",
    hold_expires: holdUntil.toISOString(),
    notes: notes ? `Website join. ${notes}` : "Website join. Seat hold until confirmation."
  };

  const line = recordToLine(ctx.headerMap, record);
  await ctx.sheets.spreadsheets.values.append({
    spreadsheetId: ctx.spreadsheetId,
    range: `'${TOURS_TAB}'!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [line] }
  });

  ctx = await loadTours();
  const created = ctx.records.find((row) => String(row.booking_id || "").trim().toUpperCase() === bookingId);
  let after = summarizeDeparture(departureId, ctx.records.filter((row) => String(row.departure_id || "").trim() === departureId), now);
  if (after.occupied_pax > after.max_pax && created) {
    created.status = "Hold Expired";
    const statusCell = cellFor(ctx.headerMap, "status", created._row);
    if (statusCell) await writeCells(ctx, [{ cell: statusCell, value: "Hold Expired" }]);
    throw Object.assign(new Error("Not enough seats available"), { statusCode: 409 });
  }
  after = await syncDepartureAggregates(ctx, departureId, now);

  const publicBooking = toPublicBooking({
    booking_id: bookingId,
    departure_id: departureId,
    tour_name: summary.tour_name,
    date_label: summary.date_label,
    pax,
    status: "Pending",
    hold_expires_at: holdUntil.toISOString(),
    hold_minutes: HOLD_MINUTES,
    confirmed_pax: after ? after.confirmed_pax : summary.confirmed_pax,
    seats_available: after ? after.seats_available : Math.max(0, summary.seats_available - pax),
    join_status: after ? after.join_status : summary.join_status
  });
  assertNoPrivateFields(publicBooking);
  return publicBooking;
}

module.exports = {
  HOLD_MINUTES,
  listPublishedDepartures,
  getPublishedDeparture,
  getPublicBookingStatus,
  createPendingBooking
};
