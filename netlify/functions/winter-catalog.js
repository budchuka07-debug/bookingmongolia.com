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

function fromRow(row) {
  var highlights = row.highlights;
  if (typeof highlights === "string") {
    try { highlights = JSON.parse(highlights); } catch (e) { highlights = []; }
  }
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    destination: row.destination,
    location: row.location || row.destination,
    category: row.category,
    summary: row.summary,
    highlights: Array.isArray(highlights) ? highlights : [],
    duration: row.duration,
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    priceLabel: row.price_label || "Request a Quote",
    groupLabel: row.group_label,
    availability: row.availability || "on_request",
    image: row.image,
    alt: row.alt,
    featured: row.featured,
    published: row.published
  };
}

exports.handler = async function () {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return json(200, { items: null, source: "seed" });
  try {
    const res = await fetch(
      base + "/rest/v1/winter_items?select=*&published=eq.true&order=sort.asc",
      { headers: { apikey: key, Authorization: "Bearer " + key } }
    );
    if (!res.ok) return json(200, { items: null, source: "seed" });
    const rows = await res.json();
    return json(200, { items: (rows || []).map(fromRow), source: "supabase" });
  } catch (error) {
    return json(200, { items: null, source: "seed" });
  }
};
