(function () {
  var mount = document.getElementById("winter-detail");
  var id = document.body.getAttribute("data-winter-tour");
  if (!mount || !id || !window.BM_WINTER) return;
  var tour = (window.BM_WINTER.tours || []).filter(function (item) { return item.id === id; })[0];
  if (!tour) {
    mount.innerHTML = "<p>This winter tour is not published.</p>";
    return;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  var lengths = Object.keys(tour.plans || {});
  var chosen = lengths[0];

  function planHtml() {
    var lines = (tour.plans && tour.plans[chosen]) || [];
    return lines.map(function (line) { return "<li>" + esc(line) + "</li>"; }).join("");
  }

  function render() {
    var switches = lengths.map(function (key) {
      var label = key === "1" ? "1 Day" : key + " Days";
      return '<button type="button" class="winter-chip' + (key === chosen ? " is-on" : "") + '" data-len="' + esc(key) + '">' + label + "</button>";
    }).join("");
    var quote = "/tours-dates.html#winter-" + encodeURIComponent(tour.id);
    var wa = "https://wa.me/97690283039?text=" + encodeURIComponent("Quote request: " + tour.title + " (" + tour.durationLabel + "). Season November to April.");
    mount.innerHTML =
      '<section class="hero" style="background-image:linear-gradient(rgba(8,24,40,.55),rgba(8,24,40,.72)),url(\'' + esc(tour.image) + '\')">' +
        '<div class="hero-inner"><p class="eyebrow">' + esc(tour.durationLabel) + " · November – April</p>" +
        "<h1>" + esc(tour.title) + "</h1><p>" + esc(tour.summary) + "</p>" +
        '<div class="hero-actions"><a class="btn btn-primary" href="' + quote + '">Ask Quote</a>' +
        '<a class="btn btn-secondary" href="' + wa + '" target="_blank" rel="noopener">Book inquiry</a></div></div></section>' +
      '<main class="wrap"><div class="grid"><article class="card"><h2>Itinerary estimate</h2>' +
        '<p class="muted">Choose a length. These day counts are planning estimates, not a confirmed departure date.</p>' +
        '<div class="chips">' + switches + "</div><ol class=\"list\">" + planHtml() + "</ol>" +
        (tour.safety ? "<h3>Weather and safety</h3><p>" + esc(tour.safety) + "</p>" : "") +
        "</article><aside class=\"card side\"><h2>Tour facts</h2><div class=\"meta\">" +
        "<div><strong>Duration</strong>" + esc(tour.durationLabel) + "</div>" +
        "<div><strong>Destination</strong>" + esc(tour.destination) + "</div>" +
        "<div><strong>Type</strong>" + esc(tour.tourType) + "</div>" +
        "<div><strong>Difficulty</strong>" + esc(tour.difficulty || "Moderate") + "</div>" +
        "<div><strong>Group</strong>" + esc(tour.groupLabel) + "</div>" +
        "<div><strong>Season</strong>" + esc(tour.datesLabel) + "</div>" +
        "<div><strong>Price</strong>" + esc(tour.priceLabel) + "</div></div>" +
        "<h3>Highlights</h3><ul class=\"list\">" + (tour.highlights || []).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>" +
        '<a class="btn btn-primary" href="' + quote + '">Ask Quote</a>' +
        '<a class="btn btn-secondary" href="/winter-mongolia.html">All winter tours</a></aside></div></main>';
    mount.querySelectorAll("[data-len]").forEach(function (button) {
      button.onclick = function () {
        chosen = button.getAttribute("data-len");
        render();
      };
    });
  }

  render();
})();
