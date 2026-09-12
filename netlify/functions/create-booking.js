const { createPendingBooking } = require("./lib/tours-sheet");
const { assertNoPrivateFields } = require("./lib/departure-logic");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  try {
    const result = await createPendingBooking({
      departure_id: clean(body.departure_id, 80),
      name: clean(body.name || body.fullname || body.customer, 120),
      email: clean(body.email, 180),
      phone: clean(body.phone || body.contact, 80),
      country: clean(body.country, 80),
      pax: body.pax || body.travelers,
      notes: clean(body.notes || body.message, 2000)
    });
    assertNoPrivateFields({ booking: result });
    return json(200, { ok: true, booking: result });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return json(statusCode, { error: err.message || "Could not create booking" });
  }
};
