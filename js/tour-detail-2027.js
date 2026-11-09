(function () {
  var root = document.getElementById("bm-2027-offer");
  if (!root || !window.BMPricing) return;

  var tour = {
    id: root.getAttribute("data-id") || "",
    name: root.getAttribute("data-name") || "",
    region: root.getAttribute("data-region") || "",
    days: Number(root.getAttribute("data-days")) || 0,
    priceMode: root.getAttribute("data-quote") === "1" ? "ask" : ""
  };
  var dates = (root.getAttribute("data-dates") || "").split("|").filter(Boolean);
  var four = window.BMPricing.quote(tour, 4);

  function money(n) {
    return window.BMPricing.money(n);
  }

  function draw(travelers) {
    var box = root.querySelector("[data-result]");
    var sample = tour.days ? tour : Object.assign({}, tour, { days: 1 });
    if (!window.BMPricing.packageQuote) {
      box.textContent = "Request a Quote.";
      return;
    }
    var lines = ["budget", "standard", "premium"].map(function (id) {
      var offer = window.BMPricing.packageQuote(sample, travelers, id);
      if (!offer || offer.quote) return offer.packageName + ": Request a Quote";
      if (!tour.days) return offer.packageName + ": " + money(offer.daily) + " per person per day";
      return offer.packageName + ": " + money(offer.daily) + "/day = " + money(offer.perPerson) + "/person for " + offer.days + " days · " + money(offer.total) + " for " + offer.travelers + " travelers";
    });
    box.innerHTML = lines.map(function (line) { return "<span style=\"display:block;margin:0 0 6px\">" + line + "</span>"; }).join("");
  }

  var lead = four && !four.quote
    ? "From " + money(four.daily) + " per person per day, based on 4+ travelers."
    : "Request a Quote.";

  var dateHtml = dates.length
    ? "<p><strong>Published departure dates</strong></p><p>" + dates.join(" · ") + "</p>"
    : "<p>Departure dates stay on the Tours & Dates page. This page does not add dates.</p>";

  root.style.cssText = "background:#fffdf8;border:1px solid rgba(90,62,28,.16);border-radius:18px;padding:18px 18px 8px;color:#2b241c";
  root.innerHTML =
    "<h2>2027 price</h2>" +
    "<p>" + lead + "</p>" +
    dateHtml +
    "<label>Travelers <select data-party><option>2</option><option>3</option><option selected>4</option><option>5</option><option>1</option></select></label>" +
    "<p data-result></p>" +
    "<p><a style=\"display:inline-block;background:#8a5a2b;color:#fff;text-decoration:none;border-radius:999px;padding:10px 16px;margin-right:8px\" href=\"/tours-dates.html#calendar-list\">Book Now</a>" +
    "<a style=\"display:inline-block;border:1px solid #8a5a2b;color:#8a5a2b;text-decoration:none;border-radius:999px;padding:10px 16px\" href=\"https://wa.me/97690283039\" target=\"_blank\" rel=\"noopener\">WhatsApp</a></p>";

  var select = root.querySelector("[data-party]");
  select.addEventListener("change", function () { draw(select.value); });
  draw(select.value);
})();
