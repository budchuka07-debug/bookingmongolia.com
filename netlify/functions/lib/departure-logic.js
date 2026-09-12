/**
 * Pure departure / booking occupancy rules.
 * No Google credentials, no I/O.
 */
const PRIVATE_KEYS = new Set([
  "email",
  "phone",
  "customer",
  "country",
  "driver",
  "driver_phone",
  "hotel_camp_phones",
  "accommodation",
  "camp_guesthouse",
  "expenses",
  "profit",
  "paid",
  "balance",
  "notes",
  "next_task",
  "reminder_date",
  "traveler_email",
  "traveler_contact",
  "traveler_name",
  "contact",
  "private_key",
  "client_email",
  "credentials"
]);

const PUBLIC_DEPARTURE_KEYS = [
  "departure_id",
  "tour_id",
  "tour_name",
  "start_date",
  "end_date",
  "date_label",
  "route",
  "price",
  "confirmed_pax",
  "seats_available",
  "max_pax",
  "join_status"
];

const PUBLIC_BOOKING_KEYS = [
  "booking_id",
  "departure_id",
  "tour_name",
  "date_label",
  "pax",
  "status",
  "hold_expires_at",
  "hold_minutes",
  "confirmed_pax",
  "seats_available",
  "join_status"
];

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const iso = Date.parse(String(value).trim());
  if (!Number.isNaN(iso)) return new Date(iso);
  return null;
}

function formatDateLabel(start, end) {
  const a = String(start || "").trim();
  const b = String(end || "").trim();
  if (a && b && a !== b) return `${a} – ${b}`;
  return a || b || "";
}

function statusKey(value) {
  return String(value || "").trim().toLowerCase();
}

function isConfirmedStatus(status) {
  const s = statusKey(status);
  if (!s) return false;
  if (/pending|hold|expir|released|cancel|void|reserv|waitlist/.test(s)) return false;
  return s === "confirmed" || s === "complete" || s === "completed" || /^confirmed\b/.test(s);
}

function isPendingStatus(status) {
  const s = statusKey(status);
  return s === "pending" || s === "hold" || s === "reserved" || s === "reservation";
}

function isClosedJoin(joinStatus) {
  const s = statusKey(joinStatus);
  return s === "closed" || s === "close" || s === "not open";
}

function publicPrice(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  if (/ask|quote|tbd/i.test(s)) return s;
  return s;
}

function holdStillActive(record, now) {
  if (!isPendingStatus(record.status)) return false;
  const expires = parseDateValue(record.hold_expires);
  if (!expires) return true;
  return expires.getTime() > now.getTime();
}

function expirePendingHolds(records, now) {
  let changed = 0;
  records.forEach((row) => {
    if (!isPendingStatus(row.status)) return;
    const expires = parseDateValue(row.hold_expires);
    if (!expires || expires.getTime() > now.getTime()) return;
    row.status = "Hold Expired";
    changed += 1;
  });
  return changed;
}

function nextBookingId(records) {
  let max = 0;
  records.forEach((row) => {
    const m = String(row.booking_id || "").trim().toUpperCase().match(/^BM(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `BM${String(max + 1).padStart(3, "0")}`;
}

function groupByDeparture(records) {
  const groups = new Map();
  records.forEach((row) => {
    const id = String(row.departure_id || "").trim();
    if (!id) return;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  });
  return groups;
}

function summarizeDeparture(departureId, rows, now) {
  const published = rows.some((row) => {
    const s = String(row.website_published || "").trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1" || s === "published";
  });
  const closed = rows.some((row) => isClosedJoin(row.join_status));
  let confirmedPax = 0;
  let heldPax = 0;
  let maxPax = 0;
  rows.forEach((row) => {
    maxPax = Math.max(maxPax, toNumber(row.max_pax));
    const pax = toNumber(row.pax);
    if (isConfirmedStatus(row.status)) confirmedPax += pax;
    else if (holdStillActive(row, now)) heldPax += pax;
  });
  const occupied = confirmedPax + heldPax;
  const seats = Math.max(0, maxPax - occupied);
  let joinStatus = "Open for Join";
  if (closed) joinStatus = "Closed";
  else if (seats <= 0) joinStatus = "Fully Booked";

  const seed = rows.find((row) => {
    const s = String(row.website_published || "").trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1" || s === "published";
  }) || rows[0] || {};

  return {
    departure_id: departureId,
    tour_id: String(seed.tour_id || "").trim(),
    tour_name: String(seed.tour_name || "").trim(),
    start_date: String(seed.start_date || "").trim(),
    end_date: String(seed.end_date || "").trim(),
    date_label: formatDateLabel(seed.start_date, seed.end_date),
    route: String(seed.route || "").trim(),
    price: publicPrice(seed.selling_price),
    max_pax: maxPax,
    confirmed_pax: confirmedPax,
    held_pax: heldPax,
    occupied_pax: occupied,
    seats_available: seats,
    join_status: joinStatus,
    website_published: published
  };
}

function canAcceptPax(summary, pax) {
  const n = Math.round(toNumber(pax));
  if (!summary || n < 1) return false;
  if (summary.join_status === "Closed") return false;
  return n <= summary.seats_available && summary.occupied_pax + n <= summary.max_pax;
}

function pickKeys(source, keys) {
  const out = {};
  keys.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

function toPublicDeparture(summary) {
  return pickKeys(summary, PUBLIC_DEPARTURE_KEYS);
}

function toPublicBooking(record) {
  return pickKeys(record, PUBLIC_BOOKING_KEYS);
}

function collectKeys(value, found) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, found));
    return found;
  }
  Object.keys(value).forEach((key) => {
    found.add(key);
    collectKeys(value[key], found);
  });
  return found;
}

function assertNoPrivateFields(payload) {
  const keys = collectKeys(payload, new Set());
  const leaked = [...keys].filter((key) => PRIVATE_KEYS.has(key));
  if (leaked.length) {
    throw new Error("Private fields leaked: " + leaked.join(", "));
  }
  return true;
}

module.exports = {
  PRIVATE_KEYS,
  PUBLIC_DEPARTURE_KEYS,
  PUBLIC_BOOKING_KEYS,
  toNumber,
  parseDateValue,
  formatDateLabel,
  isConfirmedStatus,
  isPendingStatus,
  isClosedJoin,
  publicPrice,
  holdStillActive,
  expirePendingHolds,
  nextBookingId,
  groupByDeparture,
  summarizeDeparture,
  canAcceptPax,
  toPublicDeparture,
  toPublicBooking,
  assertNoPrivateFields
};
