(function () {
  var root = document.getElementById("winter-root");
  if (!root || !window.BM_WINTER) return;

  var FILTERS = ["All Winter Tours", "Festivals", "Adventure", "Cultural Experiences", "Day Tours", "Multi-day Tours"];
  var SECTIONS = [
    ["reindeer", "Tsaatan and Reindeer Expeditions"],
    ["festivals", "Winter Festivals and Events"],
    ["outdoor", "Dog Sledding and Outdoor Adventures"],
    ["gobi", "Gobi Winter Experiences"],
    ["culture", "Cultural and Nomadic Experiences"],
    ["city", "Winter City Tours"]
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function inquiry(title) {
    return "https://wa.me/97690283039?text=" + encodeURIComponent("Winter Mongolia inquiry: " + title + ". Season November to April.");
  }

  function datesHref(id) {
    return "/tours-dates.html#winter-" + id;
  }

  function card(tour) {
    var highlights = (tour.highlights || []).slice(0, 4).map(function (item) {
      return "<li>" + esc(item) + "</li>";
    }).join("");
    return (
      '<article class="winter-card" id="' + esc(tour.id) + '">' +
        '<img src="' + esc(tour.image) + '" alt="' + esc(tour.alt || tour.title) + '" loading="lazy" width="640" height="400">' +
        '<div class="winter-card-body">' +
          '<p class="winter-kicker">' + esc((tour.filters && tour.filters[0]) || tour.tourType) + "</p>" +
          "<h3>" + esc(tour.title) + "</h3>" +
          '<p class="winter-meta">' + esc(tour.destination) + "</p>" +
          '<p class="winter-duration">' + esc(tour.durationLabel) + "</p>" +
          "<p>" + esc(tour.summary) + "</p>" +
          "<ul>" + highlights + "</ul>" +
          '<p class="winter-meta">' + esc(tour.groupLabel) + " · " + esc(tour.datesLabel) + "</p>" +
          '<p class="winter-price">' + esc(tour.priceLabel) + "</p>" +
          '<div class="winter-actions">' +
            '<a class="winter-btn" href="' + esc(tour.page) + '">View Details</a>' +
            '<a class="winter-btn winter-btn-solid" href="' + datesHref(tour.id) + '">Ask Quote</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function eventCard(item, tours) {
    var related = null;
    tours.forEach(function (tour) {
      if (tour.id === item.relatedTourId) related = tour;
    });
    var href = related ? related.page : "/winter-mongolia.html#winter-calendar";
    return (
      '<article class="winter-card">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.alt || item.title) + '" loading="lazy" width="640" height="400">' +
        '<div class="winter-card-body">' +
          '<p class="winter-kicker">' + esc(item.availability === "seasonal" ? "Seasonal" : "On request") + "</p>" +
          "<h3>" + esc(item.title) + "</h3>" +
          "<p class=\"winter-meta\">" + esc(item.destination) + "</p>" +
          "<p class=\"winter-duration\">" + esc(item.startDate) + " – " + esc(item.endDate) + "</p>" +
          "<p>" + esc(item.summary) + "</p>" +
          '<div class="winter-actions">' +
            '<a class="winter-btn" href="' + esc(href) + '">View tour</a>' +
            '<a class="winter-btn winter-btn-solid" href="' + inquiry(item.title) + '" target="_blank" rel="noopener">Booking inquiry</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function merge(seed, remote) {
    if (!remote || !remote.length) return seed.slice();
    var byId = {};
    seed.forEach(function (item) { byId[item.id] = Object.assign({}, item); });
    remote.forEach(function (item) {
      if (!item || !item.id) return;
      byId[item.id] = Object.assign({}, byId[item.id] || {}, item);
    });
    return Object.keys(byId).map(function (id) { return byId[id]; }).filter(function (item) {
      return item.published !== false && item.published !== "false";
    });
  }

  var active = "All Winter Tours";

  function draw(data) {
    var tours = (data.tours || []).filter(function (item) { return item.published !== false; });
    var events = (data.events || []).filter(function (item) { return item.published !== false; });
    var chips = document.getElementById("winter-cats");
    var featured = document.getElementById("winter-featured");
    var filterGrid = document.getElementById("winter-filter-grid");

    chips.innerHTML = FILTERS.map(function (name) {
      return '<button type="button" class="winter-chip' + (name === active ? " is-on" : "") + '" data-cat="' + esc(name) + '">' + esc(name) + "</button>";
    }).join("");

    var featuredTours = tours.filter(function (tour) { return tour.featured; }).slice(0, 3);
    featured.innerHTML = featuredTours.map(card).join("");

    var filtering = active !== "All Winter Tours";
    filterGrid.hidden = !filtering;
    filterGrid.innerHTML = filtering
      ? tours.filter(function (tour) { return (tour.filters || []).indexOf(active) !== -1; }).map(card).join("")
      : "";

    SECTIONS.forEach(function (pair) {
      var section = document.querySelector('[data-section="' + pair[0] + '"]');
      if (!section) return;
      section.hidden = filtering;
      var grid = section.querySelector("[data-grid]");
      grid.innerHTML = tours.filter(function (tour) { return tour.section === pair[0]; }).map(card).join("");
    });

    var calendar = document.getElementById("winter-calendar");
    if (calendar) calendar.hidden = filtering;
    document.getElementById("winter-event-grid").innerHTML = events.map(function (item) {
      return eventCard(item, tours);
    }).join("");

    chips.querySelectorAll(".winter-chip").forEach(function (button) {
      button.onclick = function () {
        active = button.getAttribute("data-cat");
        draw(data);
        chips.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
    });
  }

  var seed = { tours: window.BM_WINTER.tours || [], events: window.BM_WINTER.events || [] };
  draw(seed);

  fetch("/api/winter-catalog", { headers: { Accept: "application/json" } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (payload) {
      if (!payload || !payload.items) return;
      draw({
        tours: merge(seed.tours, payload.items.filter(function (item) { return item.kind !== "event"; })),
        events: merge(seed.events, payload.items.filter(function (item) { return item.kind === "event"; }))
      });
    })
    .catch(function () {});
})();
