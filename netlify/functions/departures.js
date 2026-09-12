const {
  listPublishedDepartures,
  getPublishedDeparture
} = require("./lib/tours-sheet");
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
    const id = params.id || params.departure_id || "";
    if (id) {
      const departure = await getPublishedDeparture(id);
      if (!departure) return json(404, { error: "Departure not found" });
      assertNoPrivateFields({ departure });
      return json(200, { departure });
    }
    const departures = await listPublishedDepartures();
    assertNoPrivateFields({ departures });
    return json(200, { departures });
  } catch (err) {
    return json(500, { error: err.message || "Failed to load departures" });
  }
};
