(function () {
  var box = document.querySelector("#winter-mongolia .cards");
  if (!box) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function paint(items) {
    var featured = items.filter(function (item) {
      return item.kind === "tour" && item.featured && item.published !== false;
    }).slice(0, 3);
    if (featured.length < 3) return;
    box.innerHTML = featured.map(function (item) {
      return (
        '<a href="winter-mongolia.html#' + esc(item.id) + '" class="tour-link">' +
          '<article class="card tour-card">' +
            '<img src="' + esc(item.image) + '" alt="' + esc(item.alt || item.title) + '" loading="lazy">' +
            '<div class="card-body">' +
              '<span class="tag">' + esc(item.category || "Winter") + "</span>" +
              "<h3>" + esc(item.title) + "</h3>" +
              '<p class="muted">' + esc(item.summary) + "</p>" +
              '<div class="price">' + esc(item.priceLabel || "Request a Quote") + "</div>" +
            "</div>" +
          "</article>" +
        "</a>"
      );
    }).join("");
  }

  fetch("/api/winter-catalog", { headers: { Accept: "application/json" } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.items || !data.items.length) return;
      paint(data.items);
    })
    .catch(function () {});
})();
