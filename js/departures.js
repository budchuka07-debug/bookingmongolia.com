/**
 * Public joinable departures for /tours-dates and /booking.html.
 * Reads only public fields from /api/departures.
 */
(function () {
  var API = "/api/departures";
  var CREATE_API = "/api/create-booking";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function statusClass(status) {
    var s = String(status || "").toLowerCase();
    if (s.indexOf("full") !== -1) return "limited";
    if (s.indexOf("closed") !== -1) return "request";
    return "guaranteed";
  }

  function actionButton(dep) {
    var status = String(dep.join_status || "");
    if (/closed/i.test(status)) {
      return '<button class="tour-btn" type="button" disabled>Closed</button>';
    }
    if (/full/i.test(status) || Number(dep.seats_available) <= 0) {
      return '<button class="tour-btn" type="button" disabled>Fully Booked</button>';
    }
    return (
      '<button class="tour-btn primary" type="button" data-join-departure="' +
      escapeHtml(dep.departure_id) +
      '">Join This Departure</button>'
    );
  }

  function cardHtml(dep) {
    var booked = Number(dep.confirmed_pax) || 0;
    var seats = Number(dep.seats_available);
    if (!Number.isFinite(seats)) seats = 0;
    var travelerLabel = booked === 1 ? "1 traveler already booked" : booked + " travelers already booked";
    var seatLabel = seats === 1 ? "1 seat available" : seats + " seats available";
    var price = dep.price ? escapeHtml(dep.price) : "Ask for quote";
    return (
      '<article class="tour-card join-departure-card" data-departure-id="' + escapeHtml(dep.departure_id) + '">' +
        '<div class="tour-body">' +
          '<div class="tour-top">' +
            '<div>' +
              '<span class="tour-badge">Join a group</span>' +
              '<h3 class="tour-title">' + escapeHtml(dep.tour_name || "Mongolia tour") + '</h3>' +
            "</div>" +
            '<div class="tour-duration">' + escapeHtml(dep.date_label || "") + "</div>" +
          "</div>" +
          (dep.route ? '<p class="small-note">' + escapeHtml(dep.route) + "</p>" : "") +
          '<div class="detail-price">' + price + "</div>" +
          '<div class="small-note">' + escapeHtml(travelerLabel) + "</div>" +
          '<div class="small-note">' + escapeHtml(seatLabel) + "</div>" +
          '<div class="status-row">' +
            '<span class="status ' + statusClass(dep.join_status) + '">' + escapeHtml(dep.join_status || "Open for Join") + "</span>" +
          "</div>" +
          '<div class="tour-actions">' + actionButton(dep) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function bindJoinButtons(grid, departures) {
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
    grid.innerHTML = '<p class="small-note">Loading available departures...</p>';
    try {
      var res = await fetch(API, { headers: { Accept: "application/json" } });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "Could not load departures");
      var departures = Array.isArray(data.departures) ? data.departures : [];
      if (!departures.length) {
        grid.innerHTML = "";
        if (note) {
          note.textContent = "No published joinable departures yet. The tour catalog below is still available to request dates.";
        }
        return;
      }
      if (note) {
        note.textContent = "These dates are open to join. Pending requests hold a seat for a limited time until confirmation.";
      }
      grid.innerHTML = departures.map(cardHtml).join("");
      bindJoinButtons(grid, departures);
    } catch (err) {
      grid.innerHTML = "";
      if (note) {
        note.textContent = "Joinable departures will appear here after the tour sheet is connected. You can still request dates from the catalog below.";
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
    submitJoinBooking: submitJoinBooking
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderJoinGrid);
  } else {
    renderJoinGrid();
  }
})();
