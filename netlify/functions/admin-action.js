const ALLOWED_TABLES = new Set([
  "community_posts",
  "community_comments",
  "property_submissions",
  "vehicle_submissions",
  "guest_reviews",
  "review_invites",
  "booking_agreement_acceptances"
]);

const RESOURCE_TO_TABLE = {
  community: "community_posts",
  comments: "community_comments",
  hotels: "property_submissions",
  cars: "vehicle_submissions",
  reviews: "guest_reviews",
  invites: "review_invites",
  agreements: "booking_agreement_acceptances"
};

const STATUS_BY_TABLE = {
  community_posts: ["published", "hidden", "pending"],
  community_comments: ["published", "hidden", "pending"],
  property_submissions: ["published", "hidden", "pending", "approved"],
  vehicle_submissions: ["published", "hidden", "pending", "approved"],
  guest_reviews: ["pending", "approved", "rejected"]
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function randomToken() {
  const bytes = require("crypto").randomBytes(24);
  return bytes.toString("base64url");
}

async function supabaseFetch(path, options = {}) {
  const SUPABASE_URL = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data?.message ? data.message : `Supabase error ${res.status}`
    );
  }
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const password = body.password || "";
    const adminPassword = requireEnv("ADMIN_PASSWORD");

    if (password !== adminPassword) {
      return json(401, { error: "Unauthorized" });
    }

    const action = body.action;
    if (action === "ping") return json(200, { ok: true });

    if (action === "list") {
      const table = RESOURCE_TO_TABLE[body.resource];
      if (!table) return json(400, { error: "Invalid resource" });
      const items = await supabaseFetch(`${table}?select=*&order=created_at.desc&limit=200`, {
        method: "GET"
      });
      return json(200, { items });
    }

    if (action === "listCommentsForPost") {
      const postId = body.postId;
      if (!postId) return json(400, { error: "Missing postId" });
      const items = await supabaseFetch(
        `community_comments?select=*&post_id=eq.${encodeURIComponent(postId)}&order=created_at.asc`,
        { method: "GET" }
      );
      return json(200, { items });
    }

    if (action === "updateStatus") {
      const { table, id, status } = body;
      if (!ALLOWED_TABLES.has(table)) return json(400, { error: "Invalid table" });
      if (!id) return json(400, { error: "Missing id" });
      const allowed = STATUS_BY_TABLE[table] || ["published", "hidden", "pending"];
      if (!allowed.includes(status)) return json(400, { error: "Invalid status" });
      const item = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      return json(200, { ok: true, item });
    }

    if (action === "delete") {
      const { table, id } = body;
      if (!ALLOWED_TABLES.has(table)) return json(400, { error: "Invalid table" });
      if (!id) return json(400, { error: "Missing id" });
      const item = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      return json(200, { ok: true, item });
    }

    if (action === "createReviewInvite") {
      const reviewType = String(body.review_type || "").trim();
      const hotelId = body.hotel_id ? String(body.hotel_id).trim() : null;
      const driverId = body.driver_id ? String(body.driver_id).trim() : null;
      const guestName = body.guest_name ? String(body.guest_name).trim().slice(0, 80) : null;
      const guestCountry = body.guest_country
        ? String(body.guest_country).trim().slice(0, 80)
        : null;
      const bookingRef = body.booking_ref ? String(body.booking_ref).trim().slice(0, 120) : null;
      const serviceDate = body.service_date ? String(body.service_date).slice(0, 10) : null;

      if (!["hotel", "driver"].includes(reviewType)) {
        return json(400, { error: "Invalid review_type" });
      }
      if (reviewType === "hotel" && !hotelId) return json(400, { error: "hotel_id required" });
      if (reviewType === "driver" && !driverId) return json(400, { error: "driver_id required" });

      const token = randomToken();
      const payload = {
        token,
        review_type: reviewType,
        hotel_id: reviewType === "hotel" ? hotelId : null,
        driver_id: reviewType === "driver" ? driverId : null,
        guest_name: guestName,
        guest_country: guestCountry,
        booking_ref: bookingRef,
        service_date: serviceDate
      };

      const items = await supabaseFetch("review_invites", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const invite = Array.isArray(items) ? items[0] : items;
      const siteOrigin = String(body.site_origin || "https://bookingmongolia.com").replace(/\/$/, "");
      const params = new URLSearchParams({
        token,
        type: reviewType,
        id: reviewType === "hotel" ? hotelId : driverId
      });
      if (serviceDate) params.set("date", serviceDate);
      if (guestName) params.set("name", guestName);
      if (guestCountry) params.set("country", guestCountry);
      if (bookingRef) params.set("ref", bookingRef);
      const link = `${siteOrigin}/review.html?${params.toString()}`;

      return json(200, { ok: true, invite, link });
    }

    return json(400, { error: "Invalid action" });
  } catch (error) {
    return json(500, { error: error.message || "Server error" });
  }
};
