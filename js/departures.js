/**
 * Public joinable group departures for /tours-dates and /booking.html.
 * Reads only public fields from /api/departures.
 * Does not create tour itinerary pages from booking rows.
 */
(function () {
  var API = "/api/departures";
  var CREATE_API = "/api/create-booking";

  var FEATURED_ITINERARY_PAGES = {
    "gobi-highlights-5d": "/tours/gobi-desert-tour.html",
    "gobi-classic-7d": "/tours/gobi-desert-tour.html",
    "deep-gobi-10d": "/tours/gobi-desert-tour.html",
    "gobi-central-7d": "/tours/gobi-desert-tour.html",
    "gobi-flight-5d": "/tours/gobi-desert-tour.html",
    "central-classic-5d": "/tours/central-mongolia-tour.html",
    "orkhon-valley-5d": "/tours/central-mongolia-tour.html",
    "kharkhorum-3d": "/tours/central-mongolia-tour.html",
    "horse-steppe-3d": "/tours/horse-riding-tour.html",
    "horse-nomad-5d": "/tours/horse-riding-tour.html",
    "mountain-horse-7d": "/tours/horse-riding-tour.html",
    "khuvsgul-lake-5d": "/tours/khuvsgul-lake-tour.html",
    "khuvsgul-north-7d": "/tours/khuvsgul-lake-tour.html",
    "khuvsgul-flight-5d": "/tours/khuvsgul-lake-tour.html",
    "taiga-reindeer-7d": "/tours/reindeer-taiga-tour.html",
    "altai-tavan-bogd-7d": "/tours/altai-tavan-bogd-tour.html",
    "western-ultimates-9d": "/tours/altai-tavan-bogd-tour.html",
    "helicopter-expedition-1d": "/vip-helicopter-expedition.html",
    "gobi-khuvsgul-loop-14d": "/tours/mongolia-grand-tour.html",
    "gobi-khuvsgul-comfort-14d": "/tours/mongolia-grand-tour.html",
    "central-gobi-classic-10d": "/tours/gobi-desert-tour.html",
    "terelj-horse-nature-2d": "/tours/terelj-hustai-tour.html",
    "hustai-nomad-elsen-4d": "/tours/terelj-hustai-tour.html",
    "naadam-terelj-3d": "/tours/naadam-festival-tour.html",
    "naadam-gobi-7d": "/tours/naadam-festival-tour.html",
    "naadam-khuvsgul-8d": "/tours/naadam-festival-tour.html",
    "gobi-khuvsgul-flight-10d": "/tours/mongolia-grand-tour.html"
  };

  var NAME_TO_TOUR_ID = {
    "gobi highlights 5 days": "gobi-highlights-5d",
    "gobi classic 7 days": "gobi-classic-7d",
    "deep gobi expedition 10 days": "deep-gobi-10d",
    "gobi + central 7 days": "gobi-central-7d",
    "gobi central 7 days": "gobi-central-7d",
    "central mongolia 5 days": "central-classic-5d",
    "orkhon valley 5 days": "orkhon-valley-5d",
    "kharkhorum & erdene zuu 3 days": "kharkhorum-3d",
    "horse riding steppe 3 days": "horse-steppe-3d",
    "nomadic horse tour 5 days": "horse-nomad-5d",
    "mountain horse trek 7 days": "mountain-horse-7d",
    "khuvsgul lake 5 days": "khuvsgul-lake-5d",
    "northern khuvsgul 7 days": "khuvsgul-north-7d",
    "taiga reindeer 7 days": "taiga-reindeer-7d",
    "altai tavan bogd 7 days": "altai-tavan-bogd-7d",
    "western mongolia ultimate 9 days": "western-ultimates-9d",
    "vip helicopter expedition": "helicopter-expedition-1d",
    "ultimate mongolia loop 14 days (gobi + khuvsgul)": "gobi-khuvsgul-loop-14d",
    "central + gobi classic 10 days": "central-gobi-classic-10d",
    "terelj horse riding & nature 2 days": "terelj-horse-nature-2d",
    "naadam festival + terelj 3 days": "naadam-terelj-3d",
    "naadam festival + gobi 7 days": "naadam-gobi-7d",
    "naadam festival + khuvsgul 8 days": "naadam-khuvsgul-8d",
    "gobi by flight 5 days": "gobi-flight-5d",
    "khuvsgul by flight 5 days": "khuvsgul-flight-5d",
    "gobi + khuvsgul flight combo 10 days": "gobi-khuvsgul-flight-10d"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function looksLikeCatalogId(id) {
    return /^[a-z][a-z0-9]*-(?:[a-z0-9]+-)*\d+d$/.test(String(id || ""));
  }

  function resolveItinerary(dep) {
    var tourId = String(dep && dep.tour_id || "").trim();
    var name = String(dep && dep.tour_name || "").trim().toLowerCase();
    var catalogId = "";
    if (typeof tours !== "undefined" && Array.isArray(tours)) {
      if (tourId && tours.some(function (t) { return t.id === tourId; })) catalogId = tourId;
      else {
        var found = tours.find(function (t) { return String(t.name || "").toLowerCase() === name; });
        if (found) catalogId = found.id;
      }
    }
    if (!catalogId && FEATURED_ITINERARY_PAGES[tourId]) catalogId = tourId;
    if (!catalogId && looksLikeCatalogId(tourId)) catalogId = tourId;
    if (!catalogId && NAME_TO_TOUR_ID[name]) catalogId = NAME_TO_TOUR_ID[name];
    var page = FEATURED_ITINERARY_PAGES[catalogId] || "";
    var href = page || (catalogId
      ? "/tours-dates.html#tour-" + encodeURIComponent(catalogId)
      : "/tours-dates.html#calendar-list");
    return { catalogId: catalogId, page: page, href: href };
  }

  function isJoinableDeparture(dep) {
    if (!dep || !dep.departure_id) return false;
    var status = String(dep.join_status || "");
    if (/closed|cancel|expir|void/i.test(status)) return false;
    if (/full/i.test(status)) return false;
    if (!Number.isFinite(Number(dep.seats_available)) || Number(dep.seats_available) <= 0) return false;
    return /open/i.test(status);
  }

  function statusClass(status) {
    var s = String(status || "").toLowerCase();
    if (s.indexOf("full") !== -1) return "limited";
    if (s.indexOf("closed") !== -1) return "request";
    return "guaranteed";
  }

  function actionButtons(dep) {
    var viewBtn =
      '<button class="tour-btn" type="button" data-view-itinerary="' +
      escapeHtml(dep.departure_id) +
      '">View Itinerary</button>';
    var status = String(dep.join_status || "");
    if (/closed/i.test(status)) {
      return viewBtn + '<button class="tour-btn" type="button" disabled>Closed</button>';
    }
    if (/full/i.test(status) || Number(dep.seats_available) <= 0) {
      return viewBtn + '<button class="tour-btn" type="button" disabled>Fully Booked</button>';
    }
    return (
      viewBtn +
      '<button class="tour-btn primary" type="button" data-join-departure="' +
      escapeHtml(dep.departure_id) +
      '">Join This Departure</button>'
    );
  }

  function cardHtml(dep) {
    var booked = Number(dep.confirmed_pax) || 0;
    var seats = Number(dep.seats_available);
    if (!Number.isFinite(seats)) seats = 0;
    var travelerLabel = booked === 1 ? "1 traveler already joined" : booked + " travelers already joined";
    var seatLabel = seats === 1 ? "1 seat available" : seats + " seats available";
    var price = dep.price ? escapeHtml(dep.price) : "Ask for quote";
    var dateLabel = escapeHtml(dep.date_label || "");
    return (
      '<article class="tour-card join-departure-card" data-departure-id="' + escapeHtml(dep.departure_id) + '">' +
        '<div class="tour-body">' +
          '<div class="tour-top">' +
            '<div>' +
              '<span class="tour-badge">Join Now</span>' +
              '<h3 class="tour-title">' + escapeHtml(dep.tour_name || "Mongolia tour") + '</h3>' +
            "</div>" +
            '<div class="tour-duration">' + dateLabel + "</div>" +
          "</div>" +
          (dep.route ? '<p class="small-note">' + escapeHtml(dep.route) + "</p>" : "") +
          '<div class="detail-price">' + price + "</div>" +
          '<div class="small-note">' + escapeHtml(travelerLabel) + "</div>" +
          '<div class="small-note">' + escapeHtml(seatLabel) + "</div>" +
          '<div class="status-row">' +
            '<span class="status ' + statusClass(dep.join_status) + '">' + escapeHtml(dep.join_status || "Open for Join") + "</span>" +
          "</div>" +
          '<div class="tour-actions">' + actionButtons(dep) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function viewItinerary(dep) {
    var resolved = resolveItinerary(dep);
    if (resolved.catalogId && typeof window.openDetailModal === "function") {
      window.openDetailModal(resolved.catalogId);
      var modal = document.getElementById("detailModal");
      if (modal && modal.classList.contains("open")) return;
    }
    if (resolved.page) {
      window.location.href = resolved.page;
      return;
    }
    window.location.href = resolved.href;
  }

  function bindJoinButtons(grid, departures) {
    grid.querySelectorAll("[data-view-itinerary]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-view-itinerary");
        var dep = departures.find(function (item) { return item.departure_id === id; });
        if (dep) viewItinerary(dep);
      });
    });
    grid.querySelectorAll("[data-join-departure]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-join-departure");
        var dep = departures.find(function (item) { return item.departure_id === id; });
        if (!dep) return;
        if (typeof window.openJoinDeparture === "function") {
          window.openJoinDeparture(dep);
          return;
        }
        window.location.href = "/booking.html?departure=" + encodeURIComponent(dep.departure_id);
      });
    });
  }

  async function renderJoinGrid() {
    var grid = document.getElementById("joinDeparturesGrid");
    var note = document.getElementById("joinDeparturesNote");
    if (!grid) return;
    grid.innerHTML = '<p class="small-note">Loading available group departures...</p>';
    try {
      var res = await fetch(API, { headers: { Accept: "application/json" } });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "Could not load departures");
      var departures = (Array.isArray(data.departures) ? data.departures : []).filter(isJoinableDeparture);
      if (!departures.length) {
        grid.innerHTML = "";
        if (note) {
          note.textContent = "No published group departures are open to join right now. Browse tour itineraries below to view routes and request private dates.";
        }
        return;
      }
      if (note) {
        note.textContent = "These are specific group dates, not new tour pages. Pending requests hold a seat until confirmation.";
      }
      grid.innerHTML = departures.map(cardHtml).join("");
      bindJoinButtons(grid, departures);
    } catch (err) {
      grid.innerHTML = "";
      if (note) {
        note.textContent = "Group departures will appear here when a date is published and open to join. You can still browse itineraries and request private dates.";
      }
    }
  }

  async function lookupDeparture(id) {
    var res = await fetch(API + "?id=" + encodeURIComponent(id), { headers: { Accept: "application/json" } });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Departure not found");
    return data.departure;
  }

  async function submitJoinBooking(payload) {
    var res = await fetch(CREATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Could not create booking");
    return data.booking;
  }

  window.BMDepartures = {
    renderJoinGrid: renderJoinGrid,
    lookupDeparture: lookupDeparture,
    submitJoinBooking: submitJoinBooking,
    resolveItinerary: resolveItinerary,
    isJoinableDeparture: isJoinableDeparture
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderJoinGrid);
  } else {
    renderJoinGrid();
  }
})();
