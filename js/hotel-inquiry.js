/**
 * Booking Mongolia — accommodation price/room inquiry modal (Formspree)
 * Endpoint shared with tours-dates / contact forms.
 */
(function (global) {
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvwywob";
  const SUCCESS_MSG =
    "Thank you! Your inquiry has been sent. Booking Mongolia will contact you shortly with current room availability and pricing.";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureStyles() {
    if (document.getElementById("bm-hotel-inquiry-css")) return;
    const style = document.createElement("style");
    style.id = "bm-hotel-inquiry-css";
    style.textContent = `
.bm-inq-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10050;display:flex;align-items:flex-end;justify-content:center;padding:12px;opacity:0;pointer-events:none;transition:opacity .2s ease}
.bm-inq-overlay.open{opacity:1;pointer-events:auto}
.bm-inq-modal{width:min(560px,100%);max-height:min(92vh,900px);overflow:auto;background:#fff;border-radius:22px 22px 16px 16px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:20px 18px 18px;transform:translateY(18px);transition:transform .2s ease}
.bm-inq-overlay.open .bm-inq-modal{transform:translateY(0)}
.bm-inq-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
.bm-inq-top h2{margin:0;font-size:22px;color:#0d3b66}
.bm-inq-close{border:0;background:#f1f5f9;color:#0d3b66;width:42px;height:42px;border-radius:999px;font-size:22px;cursor:pointer;line-height:1;flex:0 0 auto}
.bm-inq-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bm-inq-grid .full{grid-column:1/-1}
.bm-inq-modal label{display:block;font-size:13px;font-weight:800;color:#0d3b66;margin:0 0 6px}
.bm-inq-modal input,.bm-inq-modal select,.bm-inq-modal textarea{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:12px;padding:12px 13px;font:inherit;background:#fff;min-height:46px}
.bm-inq-modal textarea{min-height:100px;resize:vertical}
.bm-inq-modal input[readonly]{background:#f8fafc;color:#334155}
.bm-inq-note{font-size:13px;color:#64748b;margin:0 0 12px}
.bm-inq-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.bm-inq-btn{appearance:none;border:0;border-radius:999px;padding:12px 18px;font-weight:800;cursor:pointer;min-height:46px;font:inherit}
.bm-inq-btn.primary{background:#0d3b66;color:#fff}
.bm-inq-btn.ghost{background:#eef4ff;color:#0d3b66}
.bm-inq-btn:disabled{opacity:.55;cursor:not-allowed}
.bm-inq-status{margin-top:12px;padding:12px 14px;border-radius:12px;font-weight:700;display:none}
.bm-inq-status.show{display:block}
.bm-inq-status.ok{background:#ecfdf5;color:#166534;border:1px solid #bbf7d0}
.bm-inq-status.err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
@media(min-width:720px){
  .bm-inq-overlay{align-items:center;padding:24px}
  .bm-inq-modal{border-radius:22px;padding:24px}
}
@media(max-width:640px){
  .bm-inq-grid{grid-template-columns:1fr}
}
`;
    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyles();
    let overlay = document.getElementById("bm-hotel-inquiry-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "bm-hotel-inquiry-overlay";
    overlay.className = "bm-inq-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "bm-inq-title");
    overlay.innerHTML = `
      <div class="bm-inq-modal" onclick="event.stopPropagation()">
        <div class="bm-inq-top">
          <div>
            <h2 id="bm-inq-title">Ask Price &amp; Room Information</h2>
            <p class="bm-inq-note">Send your dates and we will reply with current availability and pricing.</p>
          </div>
          <button type="button" class="bm-inq-close" aria-label="Close" data-bm-inq-close>&times;</button>
        </div>
        <form id="bm-hotel-inquiry-form" novalidate>
          <div class="bm-inq-grid">
            <div class="full">
              <label for="bm_inq_accommodation">Accommodation</label>
              <input id="bm_inq_accommodation" name="accommodation_name" type="text" readonly required>
            </div>
            <div>
              <label for="bm_inq_guest_name">Guest name *</label>
              <input id="bm_inq_guest_name" name="guest_name" type="text" maxlength="120" required autocomplete="name">
            </div>
            <div>
              <label for="bm_inq_email">Email *</label>
              <input id="bm_inq_email" name="email" type="email" maxlength="160" required autocomplete="email">
            </div>
            <div>
              <label for="bm_inq_phone">WhatsApp / Phone</label>
              <input id="bm_inq_phone" name="phone" type="text" maxlength="60" autocomplete="tel" placeholder="+976 / +81 / +82">
            </div>
            <div>
              <label for="bm_inq_guests">Number of guests *</label>
              <input id="bm_inq_guests" name="guests" type="number" min="1" max="50" value="2" required>
            </div>
            <div>
              <label for="bm_inq_checkin">Check-in date *</label>
              <input id="bm_inq_checkin" name="check_in" type="date" required>
            </div>
            <div>
              <label for="bm_inq_checkout">Check-out date *</label>
              <input id="bm_inq_checkout" name="check_out" type="date" required>
            </div>
            <div class="full" id="bm_inq_room_wrap">
              <label for="bm_inq_room">Room / Ger type</label>
              <select id="bm_inq_room" name="room_type"></select>
            </div>
            <div class="full" id="bm_inq_room_text_wrap" hidden>
              <label for="bm_inq_room_text">Room / Ger type</label>
              <input id="bm_inq_room_text" name="room_type_text" type="text" maxlength="120" placeholder="e.g. Double room, Tourist ger">
            </div>
            <div class="full">
              <label for="bm_inq_message">Message</label>
              <textarea id="bm_inq_message" name="message" maxlength="2000" placeholder="Tell us about preferred room type, budget, or special requests."></textarea>
            </div>
          </div>
          <input type="hidden" name="_subject" id="bm_inq_subject" value="Accommodation inquiry — Booking Mongolia">
          <input type="hidden" name="form_source" value="hotel_price_inquiry">
          <input type="hidden" name="accommodation_id" id="bm_inq_accommodation_id" value="">
          <div class="bm-inq-actions">
            <button type="submit" class="bm-inq-btn primary" id="bm_inq_submit">Send inquiry</button>
            <button type="button" class="bm-inq-btn ghost" data-bm-inq-close>Cancel</button>
          </div>
          <div id="bm_inq_status" class="bm-inq-status" role="status"></div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeInquiry();
    });
    overlay.querySelectorAll("[data-bm-inq-close]").forEach((btn) => {
      btn.addEventListener("click", closeInquiry);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeInquiry();
    });

    const form = document.getElementById("bm-hotel-inquiry-form");
    form.addEventListener("submit", onSubmit);

    const checkIn = document.getElementById("bm_inq_checkin");
    const checkOut = document.getElementById("bm_inq_checkout");
    checkIn.addEventListener("change", () => {
      if (checkIn.value) checkOut.min = checkIn.value;
    });

    return overlay;
  }

  function setStatus(msg, type) {
    const el = document.getElementById("bm_inq_status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "bm-inq-status" + (msg ? ` show ${type || ""}` : "");
  }

  function fillRoomField(roomTypes) {
    const selectWrap = document.getElementById("bm_inq_room_wrap");
    const textWrap = document.getElementById("bm_inq_room_text_wrap");
    const select = document.getElementById("bm_inq_room");
    const text = document.getElementById("bm_inq_room_text");
    const rooms = Array.isArray(roomTypes) ? roomTypes.filter(Boolean) : [];

    if (rooms.length) {
      selectWrap.hidden = false;
      textWrap.hidden = true;
      select.innerHTML =
        `<option value="">Select room / ger type</option>` +
        rooms.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
      text.value = "";
    } else {
      selectWrap.hidden = true;
      textWrap.hidden = false;
      select.innerHTML = "";
      text.value = "";
    }
  }

  function openInquiry(stay) {
    const overlay = ensureModal();
    const form = document.getElementById("bm-hotel-inquiry-form");
    form.reset();
    setStatus("", "");

    const name = stay?.name || stay?.accommodation_name || "Accommodation";
    document.getElementById("bm_inq_accommodation").value = name;
    document.getElementById("bm_inq_accommodation_id").value = stay?.id || "";
    document.getElementById("bm_inq_subject").value = `Accommodation inquiry: ${name}`;
    document.getElementById("bm_inq_guests").value = "2";

    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("bm_inq_checkin").min = today;
    document.getElementById("bm_inq_checkout").min = today;

    fillRoomField(stay?.room_types || stay?.rooms || []);

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("bm_inq_guest_name")?.focus(), 50);
  }

  function closeInquiry() {
    const overlay = document.getElementById("bm-hotel-inquiry-overlay");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function validate(form) {
    const guest = form.guest_name.value.trim();
    const email = form.email.value.trim();
    const checkIn = form.check_in.value;
    const checkOut = form.check_out.value;
    const guests = Number(form.guests.value);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!guest) return "Please enter your name.";
    if (!email || !emailOk) return "Please enter a valid email address.";
    if (!checkIn) return "Please choose a check-in date.";
    if (!checkOut) return "Please choose a check-out date.";
    if (checkOut < checkIn) return "Check-out date must be on or after check-in.";
    if (!Number.isFinite(guests) || guests < 1) return "Please enter the number of guests.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById("bm_inq_submit");
    const err = validate(form);
    if (err) {
      setStatus(err, "err");
      return;
    }

    const roomSelect = document.getElementById("bm_inq_room");
    const roomText = document.getElementById("bm_inq_room_text");
    const roomType =
      (!document.getElementById("bm_inq_room_wrap").hidden && roomSelect.value) ||
      roomText.value.trim() ||
      "Not specified";

    const payload = {
      accommodation_name: form.accommodation_name.value.trim(),
      accommodation_id: form.accommodation_id.value.trim(),
      guest_name: form.guest_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || "Not provided",
      check_in: form.check_in.value,
      check_out: form.check_out.value,
      guests: String(form.guests.value),
      room_type: roomType,
      message: form.message.value.trim() || "No additional message",
      form_source: "hotel_price_inquiry",
      _subject: form._subject.value || "Accommodation inquiry — Booking Mongolia",
      _replyto: form.email.value.trim()
    };

    try {
      if (submitBtn) submitBtn.disabled = true;
      setStatus("Sending your inquiry...", "");

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Could not send inquiry. Please try again.");
      }

      setStatus(SUCCESS_MSG, "ok");
      form.reset();
      document.getElementById("bm_inq_accommodation").value = payload.accommodation_name;
      document.getElementById("bm_inq_accommodation_id").value = payload.accommodation_id;
      document.getElementById("bm_inq_subject").value = payload._subject;
      document.getElementById("bm_inq_guests").value = "2";
    } catch (error) {
      setStatus(
        error.message ||
          "Your inquiry could not be sent. Please try again or WhatsApp +976 90283039.",
        "err"
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /** Public: only show price when explicitly confirmed and not a seed/mock listing */
  function isPriceConfirmed(item) {
    if (!item) return false;
    if (item.is_mock === true || item.source === "mock" || String(item.id || "").startsWith("mock-")) {
      return false;
    }
    const flag = item.price_confirmed;
    return flag === true || flag === "true" || flag === 1 || flag === "1" || flag === "yes";
  }

  global.BMHotelInquiry = {
    open: openInquiry,
    close: closeInquiry,
    isPriceConfirmed,
    FORMSPREE_ENDPOINT
  };

  global.openHotelPriceInquiry = openInquiry;
})(typeof window !== "undefined" ? window : globalThis);
