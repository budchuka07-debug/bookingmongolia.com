/**
 * Booking Mongolia — shared Guest Reviews helpers
 * Hotels = property_submissions, Drivers = vehicle_submissions
 */
(function (global) {
  const BMReviews = {
    HOTEL_ASPECTS: [
      { key: "cleanliness_rating", label: "Cleanliness" },
      { key: "location_rating", label: "Location" },
      { key: "service_rating", label: "Service" },
      { key: "comfort_rating", label: "Comfort" }
    ],
    DRIVER_ASPECTS: [
      { key: "driving_safety_rating", label: "Driving & safety" },
      { key: "communication_rating", label: "Communication" },
      { key: "helpfulness_rating", label: "Helpfulness" },
      { key: "vehicle_condition_rating", label: "Vehicle condition" },
      { key: "punctuality_rating", label: "Punctuality" }
    ],

    escapeHtml(str) {
      return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    stars(n, max = 5) {
      const rating = Math.max(0, Math.min(max, Number(n) || 0));
      const full = Math.round(rating);
      return "★".repeat(full) + "☆".repeat(max - full);
    },

    formatDate(value) {
      if (!value) return "";
      try {
        return new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      } catch (e) {
        return String(value);
      }
    },

    average(values) {
      const nums = (values || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
      if (!nums.length) return null;
      return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
    },

    distribution(reviews) {
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      (reviews || []).forEach((r) => {
        const n = Math.round(Number(r.rating) || 0);
        if (counts[n] != null) counts[n] += 1;
      });
      return counts;
    },

    aspectAverages(reviews, aspects) {
      return (aspects || []).map((a) => ({
        key: a.key,
        label: a.label,
        avg: BMReviews.average((reviews || []).map((r) => r[a.key]))
      })).filter((a) => a.avg != null);
    },

    async fetchApproved(supabaseClient, { reviewType, targetId }) {
      if (!supabaseClient || !reviewType || !targetId) return [];
      const col = reviewType === "hotel" ? "hotel_id" : "driver_id";
      const { data, error } = await supabaseClient
        .from("guest_reviews")
        .select("*")
        .eq("review_type", reviewType)
        .eq(col, targetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    renderSummaryHtml(reviews, { title = "Guest Reviews", reviewType = "hotel" } = {}) {
      const list = reviews || [];
      const avg = BMReviews.average(list.map((r) => r.rating));
      const dist = BMReviews.distribution(list);
      const aspects = reviewType === "driver" ? BMReviews.DRIVER_ASPECTS : BMReviews.HOTEL_ASPECTS;
      const aspectAvgs = BMReviews.aspectAverages(list, aspects);
      const total = list.length;

      if (!total) {
        return `
          <section class="bm-reviews" id="guest-reviews">
            <h3>${BMReviews.escapeHtml(title)}</h3>
            <p class="bm-reviews-empty">No guest reviews yet. Be the first to share your experience.</p>
          </section>`;
      }

      const distRows = [5, 4, 3, 2, 1].map((n) => {
        const count = dist[n] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
          <div class="bm-dist-row">
            <span>${n}★</span>
            <div class="bm-dist-bar"><i style="width:${pct}%"></i></div>
            <span>${count}</span>
          </div>`;
      }).join("");

      const aspectHtml = aspectAvgs.length
        ? `<div class="bm-aspect-grid">${aspectAvgs.map((a) => `
            <div class="bm-aspect">
              <span>${BMReviews.escapeHtml(a.label)}</span>
              <strong>${a.avg.toFixed(1)}</strong>
            </div>`).join("")}</div>`
        : "";

      return `
        <section class="bm-reviews" id="guest-reviews">
          <h3>${BMReviews.escapeHtml(title)}</h3>
          <div class="bm-reviews-summary">
            <div class="bm-reviews-score">
              <div class="bm-stars" aria-hidden="true">${BMReviews.stars(avg)}</div>
              <div class="bm-avg"><strong>${avg.toFixed(1)}</strong> / 5</div>
              <div class="bm-count">${total} Guest Review${total === 1 ? "" : "s"}</div>
            </div>
            <div class="bm-dist">${distRows}</div>
          </div>
          ${aspectHtml}
        </section>`;
    },

    renderListHtml(reviews) {
      const list = reviews || [];
      if (!list.length) return "";
      return `<div class="bm-review-list">${list.map((r) => `
        <article class="bm-review-card">
          <div class="bm-review-head">
            <div class="bm-stars" aria-label="Rating ${BMReviews.escapeHtml(r.rating)} of 5">${BMReviews.stars(r.rating)}</div>
            <div class="bm-review-meta">
              <strong>${BMReviews.escapeHtml(r.guest_name || "Guest")}</strong>
              ${r.guest_country ? ` — ${BMReviews.escapeHtml(r.guest_country)}` : ""}
            </div>
          </div>
          ${r.is_verified ? `<span class="bm-verified">Verified Guest</span>` : ""}
          <p class="bm-review-comment">"${BMReviews.escapeHtml(r.comment || "")}"</p>
          <div class="bm-review-date">${BMReviews.escapeHtml(BMReviews.formatDate(r.created_at))}</div>
        </article>`).join("")}</div>`;
    },

    /** Mobile-friendly star rating control markup */
    ratingField(name, label, { required = false, value = 0 } = {}) {
      const req = required ? "required" : "";
      const stars = [1, 2, 3, 4, 5].map((n) => `
        <button type="button" class="bm-star-btn${Number(value) >= n ? " on" : ""}" data-rating-for="${BMReviews.escapeHtml(name)}" data-value="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("");
      return `
        <div class="bm-rating-field" data-rating-field="${BMReviews.escapeHtml(name)}">
          <label>${BMReviews.escapeHtml(label)}${required ? " *" : ""}</label>
          <div class="bm-star-input" role="radiogroup" aria-label="${BMReviews.escapeHtml(label)}">${stars}</div>
          <input type="hidden" name="${BMReviews.escapeHtml(name)}" id="${BMReviews.escapeHtml(name)}" value="${Number(value) || ""}" ${req}>
        </div>`;
    },

    formHtml({ reviewType, targetId, prefill = {}, showServiceDate = false } = {}) {
      const aspects = reviewType === "driver" ? BMReviews.DRIVER_ASPECTS : BMReviews.HOTEL_ASPECTS;
      const aspectFields = aspects.map((a) => BMReviews.ratingField(a.key, a.label)).join("");
      return `
        <form id="bm-guest-review-form" class="bm-review-form" novalidate>
          <input type="hidden" name="review_type" value="${BMReviews.escapeHtml(reviewType)}">
          <input type="hidden" name="target_id" value="${BMReviews.escapeHtml(targetId || "")}">
          ${BMReviews.ratingField("rating", "Overall rating", { required: true, value: prefill.rating || 0 })}
          <div class="bm-aspect-fields">${aspectFields}</div>
          <div class="bm-form-grid">
            <div>
              <label for="guest_name">Your name *</label>
              <input id="guest_name" name="guest_name" type="text" maxlength="80" required value="${BMReviews.escapeHtml(prefill.guest_name || "")}" placeholder="Michael">
            </div>
            <div>
              <label for="guest_country">Country *</label>
              <input id="guest_country" name="guest_country" type="text" maxlength="80" required value="${BMReviews.escapeHtml(prefill.guest_country || "")}" placeholder="Australia">
            </div>
            ${showServiceDate ? `
            <div class="full">
              <label for="service_date">Service / stay date</label>
              <input id="service_date" name="service_date" type="date" value="${BMReviews.escapeHtml(prefill.service_date || "")}">
            </div>` : ""}
            <div class="full">
              <label for="comment">Your review *</label>
              <textarea id="comment" name="comment" maxlength="2000" required placeholder="Share what stood out about your stay or trip...">${BMReviews.escapeHtml(prefill.comment || "")}</textarea>
            </div>
          </div>
          <p class="bm-form-note">Reviews are moderated by Booking Mongolia before appearing publicly. Guests cannot self-verify.</p>
          <div id="bm-review-notice" class="bm-notice" hidden></div>
          <button type="submit" class="btn btn-primary bm-submit-review">Submit review</button>
        </form>`;
    },

    bindStarInputs(root) {
      const el = root || document;
      el.querySelectorAll(".bm-star-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.getAttribute("data-rating-for");
          const value = Number(btn.getAttribute("data-value"));
          const field = el.querySelector(`[data-rating-field="${name}"]`);
          const input = el.querySelector(`#${CSS.escape(name)}`);
          if (input) input.value = String(value);
          if (field) {
            field.querySelectorAll(".bm-star-btn").forEach((b) => {
              b.classList.toggle("on", Number(b.getAttribute("data-value")) <= value);
            });
          }
        });
      });
    },

    collectForm(form) {
      const fd = new FormData(form);
      const getNum = (k) => {
        const v = fd.get(k);
        if (v == null || String(v).trim() === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      return {
        review_type: String(fd.get("review_type") || "").trim(),
        target_id: String(fd.get("target_id") || "").trim(),
        guest_name: String(fd.get("guest_name") || "").trim(),
        guest_country: String(fd.get("guest_country") || "").trim(),
        rating: getNum("rating"),
        comment: String(fd.get("comment") || "").trim(),
        cleanliness_rating: getNum("cleanliness_rating"),
        location_rating: getNum("location_rating"),
        service_rating: getNum("service_rating"),
        comfort_rating: getNum("comfort_rating"),
        driving_safety_rating: getNum("driving_safety_rating"),
        communication_rating: getNum("communication_rating"),
        helpfulness_rating: getNum("helpfulness_rating"),
        vehicle_condition_rating: getNum("vehicle_condition_rating"),
        punctuality_rating: getNum("punctuality_rating"),
        service_date: String(fd.get("service_date") || "").trim() || null
      };
    },

    async submitReview(payload, { token } = {}) {
      const res = await fetch("/.netlify/functions/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, token: token || undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Submit failed (${res.status})`);
      return data;
    },

    injectJsonLd({ name, reviewType, reviews, url }) {
      const list = reviews || [];
      if (!list.length || !name) return;
      const avg = BMReviews.average(list.map((r) => r.rating));
      if (avg == null) return;

      const schemaType = reviewType === "driver" ? "LocalBusiness" : "LodgingBusiness";
      const node = {
        "@context": "https://schema.org",
        "@type": schemaType,
        name,
        url: url || (typeof location !== "undefined" ? location.href : undefined),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: avg,
          bestRating: 5,
          worstRating: 1,
          reviewCount: list.length
        },
        review: list.slice(0, 20).map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.guest_name || "Guest" },
          datePublished: r.created_at ? String(r.created_at).slice(0, 10) : undefined,
          reviewBody: r.comment || undefined,
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1
          }
        }))
      };

      document.querySelectorAll('script[data-bm-review-jsonld="1"]').forEach((n) => n.remove());
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-bm-review-jsonld", "1");
      script.textContent = JSON.stringify(node);
      document.head.appendChild(script);
    },

    cssText: `
.bm-reviews{margin:22px 0}
.bm-reviews h3{margin:0 0 12px;color:var(--primary,#0d3b66)}
.bm-reviews-empty{color:var(--muted,#6b7280);margin:0}
.bm-reviews-summary{display:grid;grid-template-columns:minmax(140px,180px) 1fr;gap:18px;align-items:start;margin-bottom:14px}
.bm-reviews-score .bm-avg{font-size:22px;color:var(--primary,#0d3b66);margin-top:4px}
.bm-reviews-score .bm-count{color:var(--muted,#6b7280);font-size:14px;font-weight:700}
.bm-stars{color:#c98b2f;letter-spacing:1px;font-size:18px;line-height:1}
.bm-dist{display:grid;gap:6px}
.bm-dist-row{display:grid;grid-template-columns:28px 1fr 28px;gap:8px;align-items:center;font-size:12px;font-weight:700;color:#475569}
.bm-dist-bar{height:8px;background:#eef2f7;border-radius:999px;overflow:hidden}
.bm-dist-bar i{display:block;height:100%;background:#c98b2f;border-radius:999px}
.bm-aspect-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:12px 0 18px}
.bm-aspect{background:#f8fafc;border:1px solid var(--line,#e5e7eb);border-radius:12px;padding:10px 12px;display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:700}
.bm-review-list{display:grid;gap:12px}
.bm-review-card{border:1px solid var(--line,#e5e7eb);border-radius:14px;padding:14px;background:#f8fafc}
.bm-review-head{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-bottom:6px}
.bm-verified{display:inline-flex;align-items:center;background:#ecfdf5;color:#166534;border:1px solid #86efac;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800}
.bm-review-comment{margin:8px 0;color:#1f2937}
.bm-review-date{font-size:12px;color:var(--muted,#6b7280);font-weight:700}
.bm-review-form{margin-top:16px;padding:16px;border:1px solid var(--line,#e5e7eb);border-radius:16px;background:#fff}
.bm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.bm-form-grid .full{grid-column:1/-1}
.bm-review-form label{display:block;font-weight:800;font-size:13px;margin-bottom:6px;color:#0d3b66}
.bm-review-form input,.bm-review-form textarea{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:12px 13px;font:inherit;background:#fff;box-sizing:border-box}
.bm-review-form textarea{min-height:110px;resize:vertical}
.bm-rating-field{margin:10px 0}
.bm-star-input{display:flex;gap:6px;flex-wrap:wrap}
.bm-star-btn{appearance:none;border:0;background:transparent;color:#d1d5db;font-size:32px;line-height:1;cursor:pointer;padding:4px 2px;min-width:44px;min-height:44px}
.bm-star-btn.on,.bm-star-btn:hover{color:#c98b2f}
.bm-aspect-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px 14px}
.bm-form-note{font-size:13px;color:var(--muted,#6b7280);margin:12px 0}
.bm-notice{padding:12px 14px;border-radius:12px;margin:10px 0;font-weight:700}
.bm-notice.ok{background:#ecfdf5;color:#166534;border:1px solid #bbf7d0}
.bm-notice.err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.bm-write-review{margin-top:16px}
@media(max-width:720px){
  .bm-reviews-summary{grid-template-columns:1fr}
  .bm-form-grid{grid-template-columns:1fr}
  .bm-star-btn{font-size:36px}
}
`
  };

  function ensureStyles() {
    if (document.getElementById("bm-guest-reviews-css")) return;
    const style = document.createElement("style");
    style.id = "bm-guest-reviews-css";
    style.textContent = BMReviews.cssText;
    document.head.appendChild(style);
  }

  BMReviews.mountStyles = ensureStyles;
  global.BMReviews = BMReviews;
})(typeof window !== "undefined" ? window : globalThis);
