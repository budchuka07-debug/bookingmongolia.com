(function () {
  var root = document.getElementById("winter-root");
  if (!root || !window.BM_WINTER) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function statusLabel(value) {
    var map = {
      on_request: "On request",
      seasonal: "Seasonal",
      upcoming: "Upcoming",
      sold_out: "Sold out",
      completed: "Completed",
      dates_on_request: "Dates on request"
    };
    return map[value] || "On request";
  }

  function inquiry(title) {
    var text = encodeURIComponent("Winter Mongolia inquiry: " + title);
    return "https://wa.me/97690283039?text=" + text;
  }

  function merge(seed, remote) {
    if (!remote || !remote.length) return seed.filter(function (item) { return item.published !== false; });
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

  function card(tour) {
    var highlights = (tour.highlights || []).map(function (item) {
      return "<li>" + esc(item) + "</li>";
    }).join("");
    return (
      '<article class="winter-card" id="' + esc(tour.id) + '">' +
        '<img src="' + esc(tour.image) + '" alt="' + esc(tour.alt || tour.title) + '" loading="lazy" width="640" height="400">' +
        '<div class="winter-card-body">' +
          '<p class="winter-kicker">' + esc(tour.category) + " · " + esc(statusLabel(tour.availability)) + "</p>" +
          "<h3>" + esc(tour.title) + "</h3>" +
          "<p class=\"winter-meta\">" + esc(tour.destination) + " · " + esc(tour.duration) + "</p>" +
          "<p>" + esc(tour.summary) + "</p>" +
          "<ul>" + highlights + "</ul>" +
          '<p class="winter-meta">' + esc(tour.groupLabel || "Private or group") + " · " + esc(tour.startDate ? (tour.startDate + (tour.endDate ? " – " + tour.endDate : "")) : (tour.datesLabel || "November – April")) + "</p>" +
          '<p class="winter-price">' + esc(tour.priceLabel || "Request a Quote") + "</p>" +
          '<div class="winter-actions">' +
            '<a class="winter-btn" href="#' + esc(tour.id) + '">View Details</a>' +
            '<a class="winter-btn winter-btn-solid" href="' + inquiry(tour.title) + '" target="_blank" rel="noopener">Send Inquiry</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function eventCard(item) {
    var when = item.startDate ? esc(item.startDate) + (item.endDate ? " – " + esc(item.endDate) : "") : "November – April";
    return (
      '<article class="winter-card" id="' + esc(item.id) + '">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.alt || item.title) + '" loading="lazy" width="640" height="400">' +
        '<div class="winter-card-body">' +
          '<p class="winter-kicker">' + esc(item.category) + " · " + esc(statusLabel(item.availability)) + "</p>" +
          "<h3>" + esc(item.title) + "</h3>" +
          "<p class=\"winter-meta\">" + esc(item.location || item.destination) + "</p>" +
          "<p class=\"winter-meta\">" + when + "</p>" +
          "<p>" + esc(item.summary) + "</p>" +
          '<div class="winter-actions">' +
            '<a class="winter-btn winter-btn-solid" href="' + inquiry(item.title) + '" target="_blank" rel="noopener">Booking inquiry</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function draw(data) {
    var tours = data.tours || [];
    var events = data.events || [];
    var categories = [];
    tours.forEach(function (tour) {
      if (categories.indexOf(tour.category) === -1) categories.push(tour.category);
    });
    var active = "All";
    var catHtml = ['<button type="button" class="winter-chip is-on" data-cat="All">All</button>']
      .concat(categories.map(function (cat) {
        return '<button type="button" class="winter-chip" data-cat="' + esc(cat) + '">' + esc(cat) + "</button>";
      })).join("");

    function paint() {
      var list = tours.filter(function (tour) { return active === "All" || tour.category === active; });
      document.getElementById("winter-cats").innerHTML = catHtml;
      document.getElementById("winter-tour-grid").innerHTML = list.map(card).join("");
      document.querySelectorAll(".winter-chip").forEach(function (button) {
        button.classList.toggle("is-on", button.getAttribute("data-cat") === active);
        button.onclick = function () {
          active = button.getAttribute("data-cat");
          paint();
        };
      });
    }

    document.getElementById("winter-event-grid").innerHTML = events.map(eventCard).join("") ||
      "<p>No confirmed winter events are published yet.</p>";
    paint();
  }

  var seed = {
    tours: (window.BM_WINTER.tours || []).filter(function (item) { return item.published !== false; }),
    events: (window.BM_WINTER.events || []).filter(function (item) { return item.published !== false; })
  };
  draw(seed);

  fetch("/api/winter-catalog", { headers: { Accept: "application/json" } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.items) return;
      var tours = merge(window.BM_WINTER.tours, data.items.filter(function (item) { return item.kind === "tour"; }));
      var events = merge(window.BM_WINTER.events, data.items.filter(function (item) { return item.kind === "event"; }));
      draw({ tours: tours, events: events });
    })
    .catch(function () {});
})();
