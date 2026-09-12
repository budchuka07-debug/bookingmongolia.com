const { getPublicBookingStatus } = require("./lib/tours-sheet");
const { assertNoPrivateFields } = require("./lib/departure-logic");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const params = event.queryStringParameters || {};
    const id = params.id || params.booking_id || "";
    if (!id) return json(400, { error: "Missing booking id" });
    const booking = await getPublicBookingStatus(id);
    if (!booking) return json(404, { error: "Booking not found" });
    assertNoPrivateFields({ booking });
    return json(200, { booking });
  } catch (err) {
    return json(500, { error: err.message || "Failed to load booking status" });
  }
};
