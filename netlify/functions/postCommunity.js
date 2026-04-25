const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "postCommunity function is working." })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const token = body.token || body.turnstileToken;
    const data = body.data || body;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase environment variables." })
      };
    }

    if (TURNSTILE_SECRET_KEY && token) {
      const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: token
        })
      });

      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: "Captcha verification failed." })
        };
      }
    }

    const payload = {
      type: data.type || "blog",
      name: data.name || "Traveler",
      country: data.country || "",
      country_code: data.country_code || "",
      destination: data.destination || "",
      title: data.title || "Traveler story",
      content: data.content || data.story || "",
      image_url: data.image_url || null,
      travel_dates: data.travel_dates || null,
      people_count: data.people_count || null,
      budget: data.budget || null,
      contact: data.contact || null,
      status: "published"
    };

    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/community_posts`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    const resultText = await supabaseRes.text();

    if (!supabaseRes.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Supabase insert failed.",
          detail: resultText
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Published successfully.",
        post: resultText ? JSON.parse(resultText)[0] : null
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
