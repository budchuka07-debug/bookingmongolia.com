(function (global) {
  var TOURS = [
    { slug: "khuvsgul-winter-adventure", path: "/winter-tours/khuvsgul-winter-adventure" },
    { slug: "khentii-chinggis-khan", path: "/winter-tours/khentii-chinggis-khan" },
    { slug: "central-mongolia-winter", path: "/winter-tours/central-mongolia-winter" },
    { slug: "terelj-winter", path: "/winter-tours/terelj-winter" }
  ];

  var FORMSPREE = "https://formspree.io/f/xwvwywob";
  var SUPABASE_URL = "https://ebpjetcuabubihzximbb.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_3F9zG4HoMOCgU4yHvUkiKw_h5VTeeRF";

  function text(key, fallback) {
    if (global.BM_I18N && typeof global.BM_I18N.t === "function") return global.BM_I18N.t(key, fallback);
    return fallback;
  }

  function validateInquiry(input) {
    var errors = [];
    var source = input || {};
    var name = String(source.name || "").trim();
    var email = String(source.email || "").trim();
    var whatsapp = String(source.whatsapp || "").trim();
    var travelers = Number(source.travelers);
    var tour = String(source.tour_slug || "").trim();
    var date = String(source.departure_date || "").trim();
    var nationality = String(source.nationality || "").trim().slice(0, 80);
    var party = String(source.party || "").trim().slice(0, 40);
    var accommodation = String(source.accommodation || "").trim().slice(0, 80);
    var message = String(source.message || "").trim().slice(0, 2000);
    var days = null;

    if (name.length < 2 || name.length > 120) errors.push("name");
    if (email.length < 5 || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
    if (whatsapp.length < 6 || whatsapp.length > 40) errors.push("whatsapp");
    if (!Number.isInteger(travelers) || travelers < 1 || travelers > 99) errors.push("travelers");
    if (!TOURS.some(function (item) { return item.slug === tour; })) errors.push("tour_slug");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("departure_date");
    if (source.days !== undefined && source.days !== null && String(source.days).trim() !== "") {
      days = Number(source.days);
      if (!Number.isInteger(days) || days < 1 || days > 30) errors.push("days");
    }
    if (nationality.length > 80) errors.push("nationality");
    if (party.length > 40) errors.push("party");
    if (accommodation.length > 80) errors.push("accommodation");

    return {
      ok: errors.length === 0,
      errors: errors,
      row: errors.length ? null : {
        name: name,
        email: email,
        whatsapp: whatsapp,
        nationality: nationality,
        travelers: travelers,
        tour_slug: tour,
        departure_date: date,
        days: days,
        party: party,
        accommodation: accommodation,
        message: message,
        status: "pending"
      }
    };
  }

  function inquirySucceeded(supabaseOk, formspreeOk) {
    return !!(supabaseOk || formspreeOk);
  }

  function errorMessage(code) {
    var messages = {
      name: text("wt_err_name", "Please enter your full name."),
      email: text("wt_err_email", "Please enter a valid email address."),
      whatsapp: text("wt_err_whatsapp", "Please enter a WhatsApp number."),
      travelers: text("wt_err_travelers", "Please enter the number of travelers."),
      tour_slug: text("wt_err_tour", "Please choose a tour."),
      departure_date: text("wt_err_date", "Please choose a preferred departure date."),
      days: text("wt_err_days", "Please enter a number of days between 1 and 30, or leave it blank.")
    };
    return messages[code] || text("wt_err_name", "Please check the form.");
  }

  function client() {
    if (!global.supabase || typeof global.supabase.createClient !== "function") return null;
    if (!global.BMWinterClient) {
      global.BMWinterClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return global.BMWinterClient;
  }

  async function insertInquiry(row) {
    var db = client();
    if (!db) return false;
    var result = await db.from("winter_inquiries").insert(row);
    return !result.error;
  }

  async function sendFormspree(row) {
    var response = await global.fetch(FORMSPREE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: row.name,
        email: row.email,
        whatsapp: row.whatsapp,
        nationality: row.nationality,
        travelers: row.travelers,
        tour_slug: row.tour_slug,
        departure_date: row.departure_date,
        days: row.days,
        party: row.party,
        accommodation: row.accommodation,
        message: row.message,
        form_source: "winter_tour_inquiry",
        _subject: "Winter tour inquiry — Booking Mongolia"
      })
    });
    return !!response && response.ok;
  }

  function setTour(slug) {
    var select = document.querySelector('#inquiry select[name="tour_slug"]');
    if (!select || !slug) return;
    if (TOURS.some(function (item) { return item.slug === slug; })) select.value = slug;
  }

  function initMap() {
    var el = document.getElementById("wt-map");
    if (!el || !global.L) return;
    var pins = (el.getAttribute("data-pins") || "").split(";").filter(Boolean).map(function (part) {
      var bits = part.split("|");
      return { lat: Number(bits[0]), lng: Number(bits[1]), label: bits.slice(2).join("|") };
    });
    if (!pins.length) return;
    var map = global.L.map(el, { scrollWheelZoom: false });
    global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    var bounds = [];
    pins.forEach(function (pin) {
      var ll = [pin.lat, pin.lng];
      bounds.push(ll);
      global.L.marker(ll).addTo(map).bindPopup(pin.label);
    });
    if (bounds.length > 1) {
      global.L.polyline(bounds, { color: "#0d3b66", weight: 3, opacity: 0.85 }).addTo(map);
    }
    map.fitBounds(bounds, { padding: [24, 24] });
  }

  async function onSubmit(event) {
    event.preventDefault();
    var form = event.target;
    if (form.dataset.sending === "1") return;
    var note = document.getElementById("wt-form-note");
    var button = form.querySelector('button[type="submit"]');
    var data = new global.FormData(form);
    var validation = validateInquiry({
      name: data.get("name"),
      email: data.get("email"),
      whatsapp: data.get("whatsapp"),
      nationality: data.get("nationality"),
      travelers: data.get("travelers"),
      tour_slug: data.get("tour_slug"),
      departure_date: data.get("departure_date"),
      days: data.get("days"),
      party: data.get("party"),
      accommodation: data.get("accommodation"),
      message: data.get("message")
    });
    if (!validation.ok) {
      if (note) {
        note.className = "wt-note bad";
        note.textContent = errorMessage(validation.errors[0]);
      }
      return;
    }
    form.dataset.sending = "1";
    if (button) {
      button.disabled = true;
      button.textContent = text("wt_sending", "Sending…");
    }
    if (note) {
      note.className = "wt-note";
      note.textContent = text("wt_sending", "Sending…");
    }
    var supabaseOk = false;
    var formspreeOk = false;
    try { supabaseOk = await insertInquiry(validation.row); } catch (e) { supabaseOk = false; }
    try { formspreeOk = await sendFormspree(validation.row); } catch (e2) { formspreeOk = false; }
    if (inquirySucceeded(supabaseOk, formspreeOk)) {
      if (note) {
        note.className = "wt-note ok";
        note.textContent = text("wt_success", "Your inquiry was sent. This is not a confirmed booking. Booking Mongolia will reply about availability.");
      }
      form.reset();
      setTour(document.body.getAttribute("data-tour") || "");
    } else if (note) {
      note.className = "wt-note bad";
      note.textContent = text("wt_failure", "The inquiry was not delivered. Please try again or write to Booking Mongolia.");
    }
    form.dataset.sending = "";
    if (button) {
      button.disabled = false;
      button.textContent = text("wt_form_send", "Send inquiry");
    }
  }

  function init() {
    if (typeof document === "undefined") return;
    var params = new URLSearchParams(global.location.search);
    setTour(params.get("tour") || document.body.getAttribute("data-tour") || "");
    document.querySelectorAll("a[data-tour]").forEach(function (el) {
      el.addEventListener("click", function () {
        setTour(el.getAttribute("data-tour"));
      });
    });
    var form = document.getElementById("inquiry");
    if (form) form.addEventListener("submit", onSubmit);
    initMap();
  }

  var api = {
    TOURS: TOURS,
    validateInquiry: validateInquiry,
    inquirySucceeded: inquirySucceeded,
    FORMSPREE: FORMSPREE
  };
  global.BMWinterTours = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
