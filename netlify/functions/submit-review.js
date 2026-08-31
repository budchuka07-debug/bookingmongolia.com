/**
 * Public guest review submission.
 * Forces status=pending. Sets is_verified only when a valid unused invite token is provided.
 * Guests cannot self-mark verified or publish directly.
 */
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(body)
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
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
    const msg =
      (typeof data === "object" && (data?.message || data?.error || data?.hint)) ||
      `Supabase error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function clampRating(value, { required = false } = {}) {
  if (value == null || value === "") return required ? null : null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

function cleanText(value, max) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return "";
  return s.slice(0, max);
}

async function lookupInvite(token) {
  const invites = await supabaseFetch(
    `review_invites?token=eq.${encodeURIComponent(token)}&select=id,token,review_type,hotel_id,driver_id,guest_name,guest_country,booking_ref,service_date,used_at,created_at&limit=1`,
    { method: "GET" }
  );
  return Array.isArray(invites) ? invites[0] : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});

  // Public invite lookup for review.html (safe fields only)
  if (event.httpMethod === "GET") {
    try {
      const params = event.queryStringParameters || {};
      const token = String(params.token || "").trim();
      if (!token) return json(400, { error: "Missing token" });
      const invite = await lookupInvite(token);
      if (!invite) return json(404, { error: "Invalid review link" });
      return json(200, {
        ok: true,
        invite: {
          review_type: invite.review_type,
          hotel_id: invite.hotel_id,
          driver_id: invite.driver_id,
          guest_name: invite.guest_name,
          guest_country: invite.guest_country,
          booking_ref: invite.booking_ref,
          service_date: invite.service_date,
          used: Boolean(invite.used_at)
        }
      });
    } catch (error) {
      return json(500, { error: error.message || "Server error" });
    }
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const reviewType = String(body.review_type || "").trim();
    const targetId = String(body.target_id || "").trim();
    const token = String(body.token || "").trim();

    if (!["hotel", "driver"].includes(reviewType)) {
      return json(400, { error: "Invalid review_type" });
    }
    if (!targetId && !token) {
      return json(400, { error: "Missing hotel/driver id" });
    }

    const guestName = cleanText(body.guest_name, 80);
    const guestCountry = cleanText(body.guest_country, 80);
    const comment = cleanText(body.comment, 2000);
    const rating = clampRating(body.rating, { required: true });

    if (!guestName || !guestCountry || !comment || !rating) {
      return json(400, { error: "Name, country, overall rating and comment are required" });
    }

    let hotelId = null;
    let driverId = null;
    let isVerified = false;
    let inviteId = null;
    let bookingRef = null;
    let serviceDate = body.service_date ? String(body.service_date).slice(0, 10) : null;
    let bookingId = null;

    if (token) {
      const invite = await lookupInvite(token);
      if (!invite) return json(400, { error: "Invalid review link" });
      if (invite.used_at) return json(400, { error: "This review link was already used" });
      if (invite.review_type !== reviewType) {
        return json(400, { error: "Review type does not match invite" });
      }

      hotelId = invite.hotel_id || null;
      driverId = invite.driver_id || null;
      inviteId = invite.id;
      bookingRef = invite.booking_ref || null;
      serviceDate = invite.service_date || serviceDate;
      isVerified = true;

      if (reviewType === "hotel" && hotelId && targetId && hotelId !== targetId) {
        return json(400, { error: "Invite does not match this hotel" });
      }
      if (reviewType === "driver" && driverId && targetId && driverId !== targetId) {
        return json(400, { error: "Invite does not match this driver" });
      }
    } else {
      if (reviewType === "hotel") hotelId = targetId;
      else driverId = targetId;
    }

    if (reviewType === "hotel") {
      if (!hotelId) return json(400, { error: "Missing hotel_id" });
      const rows = await supabaseFetch(
        `property_submissions?id=eq.${encodeURIComponent(hotelId)}&select=id,status,name&limit=1`,
        { method: "GET" }
      );
      if (!Array.isArray(rows) || !rows[0]) return json(404, { error: "Hotel not found" });
    } else {
      if (!driverId) return json(400, { error: "Missing driver_id" });
      const rows = await supabaseFetch(
        `vehicle_submissions?id=eq.${encodeURIComponent(driverId)}&select=id,status,title&limit=1`,
        { method: "GET" }
      );
      if (!Array.isArray(rows) || !rows[0]) return json(404, { error: "Driver not found" });
    }

    const payload = {
      booking_id: bookingId,
      booking_ref: bookingRef,
      review_type: reviewType,
      hotel_id: reviewType === "hotel" ? hotelId : null,
      driver_id: reviewType === "driver" ? driverId : null,
      guest_name: guestName,
      guest_country: guestCountry,
      rating,
      comment,
      cleanliness_rating: reviewType === "hotel" ? clampRating(body.cleanliness_rating) : null,
      location_rating: reviewType === "hotel" ? clampRating(body.location_rating) : null,
      service_rating: reviewType === "hotel" ? clampRating(body.service_rating) : null,
      comfort_rating: reviewType === "hotel" ? clampRating(body.comfort_rating) : null,
      driving_safety_rating: reviewType === "driver" ? clampRating(body.driving_safety_rating) : null,
      communication_rating: reviewType === "driver" ? clampRating(body.communication_rating) : null,
      helpfulness_rating: reviewType === "driver" ? clampRating(body.helpfulness_rating) : null,
      vehicle_condition_rating: reviewType === "driver" ? clampRating(body.vehicle_condition_rating) : null,
      punctuality_rating: reviewType === "driver" ? clampRating(body.punctuality_rating) : null,
      is_verified: isVerified,
      invite_id: inviteId,
      status: "pending",
      service_date: serviceDate
    };

    const inserted = await supabaseFetch("guest_reviews", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (inviteId) {
      await supabaseFetch(`review_invites?id=eq.${encodeURIComponent(inviteId)}`, {
        method: "PATCH",
        body: JSON.stringify({ used_at: new Date().toISOString() })
      });
    }

    return json(200, {
      ok: true,
      message: "Review submitted for moderation",
      item: Array.isArray(inserted) ? inserted[0] : inserted
    });
  } catch (error) {
    return json(500, { error: error.message || "Server error" });
  }
};
