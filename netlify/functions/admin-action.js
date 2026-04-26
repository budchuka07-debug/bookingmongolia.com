const ALLOWED_TABLES = new Set([
  "community_posts",
  "community_comments",
  "property_submissions",
  "vehicle_submissions"
]);

const RESOURCE_TO_TABLE = {
  community: "community_posts",
  comments: "community_comments",
  hotels: "property_submissions",
  cars: "vehicle_submissions"
};

function json(statusCode, body){
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function requireEnv(name){
  const value = process.env[name];
  if(!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function supabaseFetch(path, options = {}){
  const SUPABASE_URL = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if(!res.ok){
    throw new Error(typeof data === "object" && data?.message ? data.message : `Supabase error ${res.status}`);
  }
  return data;
}

exports.handler = async (event) => {
  if(event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try{
    const body = JSON.parse(event.body || "{}");
    const password = body.password || "";
    const adminPassword = requireEnv("ADMIN_PASSWORD");

    if(password !== adminPassword){
      return json(401, { error: "Unauthorized" });
    }

    const action = body.action;
    if(action === "ping") return json(200, { ok: true });

    if(action === "list"){
      const table = RESOURCE_TO_TABLE[body.resource];
      if(!table) return json(400, { error: "Invalid resource" });
      const items = await supabaseFetch(`${table}?select=*&order=created_at.desc&limit=200`, { method:"GET" });
      return json(200, { items });
    }

    if(action === "listCommentsForPost"){
      const postId = body.postId;
      if(!postId) return json(400, { error: "Missing postId" });
      const items = await supabaseFetch(`community_comments?select=*&post_id=eq.${encodeURIComponent(postId)}&order=created_at.asc`, { method:"GET" });
      return json(200, { items });
    }

    if(action === "updateStatus"){
      const { table, id, status } = body;
      if(!ALLOWED_TABLES.has(table)) return json(400, { error: "Invalid table" });
      if(!id) return json(400, { error: "Missing id" });
      if(!["published","hidden","pending"].includes(status)) return json(400, { error: "Invalid status" });
      const item = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method:"PATCH",
        body: JSON.stringify({ status })
      });
      return json(200, { ok:true, item });
    }

    if(action === "delete"){
      const { table, id } = body;
      if(!ALLOWED_TABLES.has(table)) return json(400, { error: "Invalid table" });
      if(!id) return json(400, { error: "Missing id" });
      const item = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(id)}`, { method:"DELETE" });
      return json(200, { ok:true, item });
    }

    return json(400, { error: "Invalid action" });
  }catch(error){
    return json(500, { error: error.message || "Server error" });
  }
};
