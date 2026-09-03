/**
 * Record General Travel Agreement acceptance for a booking request.
 * Uses server-side agreement_accepted_at (database default / now()).
 * Does not create tour bookings — Formspree/Netlify Forms remain the booking channel.
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

function cleanText(value, max) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return "";
  return s.slice(0, max);
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const agreementAccepted = body.agreement_accepted === true || body.agreement_accepted === "true";
    if (!agreementAccepted) {
      return json(400, {
        error: "Please read and accept the BookingMongolia General Travel Agreement before continuing."
      });
    }

    const bookingId = cleanText(body.booking_id, 80);
    const travelerName = cleanText(body.traveler_name || body.name, 120);
    const travelerContact = cleanText(body.traveler_contact || body.contact, 180);
    if (!bookingId || !travelerName || !travelerContact) {
      return json(400, { error: "Missing booking or traveler details." });
    }

    let travelerEmail = cleanText(body.traveler_email || body.email, 180);
    if (!travelerEmail && looksLikeEmail(travelerContact)) {
      travelerEmail = travelerContact;
    }

    const row = {
      booking_id: bookingId,
      traveler_name: travelerName,
      traveler_email: travelerEmail || null,
      traveler_contact: travelerContact,
      service_type: cleanText(body.service_type, 80) || null,
      selected_tour: cleanText(body.selected_tour, 200) || null,
      agreement_accepted: true,
      agreement_version: cleanText(body.agreement_version, 20) || "2026",
      source: cleanText(body.source, 60) || "tours-dates"
      // agreement_accepted_at left to DB default now()
    };

    const inserted = await supabaseFetch("booking_agreement_acceptances?on_conflict=booking_id", {
      method: "POST",
      prefer: "return=representation,resolution=merge-duplicates",
      body: JSON.stringify(row)
    });

    const record = Array.isArray(inserted) ? inserted[0] : inserted;
    return json(200, {
      ok: true,
      booking_id: record?.booking_id || bookingId,
      agreement_accepted: true,
      agreement_version: record?.agreement_version || "2026",
      agreement_accepted_at: record?.agreement_accepted_at || null
    });
  } catch (err) {
    return json(500, { error: err.message || "Failed to record agreement acceptance" });
  }
};
