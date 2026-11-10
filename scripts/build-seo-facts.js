/**
 * Writes the crawlable 2027 itinerary prices from BMPricing.
 * Run: node scripts/build-seo-facts.js
 */
const fs = require("fs");
const path = require("path");
const pricing = require("../js/pricing-2027.js");

const root = path.join(__dirname, "..");
const origin = "https://bookingmongolia.com";

const pageById = {
  "gobi-classic-7d": "/tours/gobi-desert-tour.html",
  "english-immersion-7d": "/tours/english-immersion-tour.html",
  "khuvsgul-lake-5d": "/tours/khuvsgul-lake-tour.html",
  "altai-tavan-bogd-7d": "/tours/altai-tavan-bogd-tour.html",
  "central-classic-5d": "/tours/central-mongolia-tour.html",
  "taiga-reindeer-7d": "/tours/reindeer-taiga-tour.html",
  "helicopter-expedition-1d": "/vip-helicopter-expedition.html"
};

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text);
}

function catalogTours(html) {
  const start = html.indexOf("const tours = [");
  const end = html.indexOf("const regionCounters");
  const block = html.slice(start, end);
  return block.split("{id:'").slice(1).map(function (part) {
    const id = part.slice(0, part.indexOf("'"));
    const name = part.match(/name:'([^']+)'/)[1];
    const region = part.match(/region:'([^']+)'/)[1];
    const days = Number(part.match(/days:(\d+)/)[1]);
    const head = part.split("},")[0];
    return {
      id: id,
      name: name,
      region: region,
      days: days,
      priceMode: /priceMode:'ask'/.test(head) ? "ask" : ""
    };
  });
}

function tourUrl(tour) {
  const pathName = pageById[tour.id] || "/tours-dates.html#tour-" + tour.id;
  return origin + pathName;
}

function priceFacts(tour) {
  const offer = pricing.quote(tour, 4);
  if (!offer || offer.quote) {
    return {
      quote: true,
      line: "Request a Quote. This departure is not sold on the published daily rate. One traveler is always a quote."
    };
  }
  return {
    quote: false,
    offer: offer,
    line: pricing.money(offer.perPerson) + " per person for " + offer.days + " days (" + pricing.money(offer.daily) + " per person per day, group of 4 or more). One traveler is a quote."
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceMarked(html, name, inner) {
  const start = "<!-- " + name + ":start -->";
  const end = "<!-- " + name + ":end -->";
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) throw new Error("Missing marker " + name);
  return html.slice(0, from + start.length) + "\n" + inner.trim() + "\n" + html.slice(to);
}

const faq = [
  {
    q: "How is a Booking Mongolia tour price calculated?",
    a: "The itinerary total for one person is the published daily rate multiplied by the number of days on that tour."
  },
  {
    q: "What is the 2027 daily rate?",
    a: "For 4 or more travelers the standard daily rate is $190 per person. Gobi, Tsaatan reindeer and Altai Tavan Bogd tours use $220 per person per day. Groups of 3 and 2 have their own published daily rates. One traveler is a quote."
  },
  {
    q: "Where is the full itinerary price shown?",
    a: "Tour Dates shows the itinerary total for every published tour. A joined departure keeps the price printed on that departure."
  }
];

function buildLlms(tours) {
  const lines = [
    "# Booking Mongolia",
    "",
    "> Booking Mongolia is a Ulaanbaatar travel agency for private Mongolia tours. The 2027 season is open. Each itinerary total below is the published daily rate multiplied by that tour's days, for one person in a group of 4 or more. One traveler is quoted separately. Budget is 90 percent of the daily rate and Premium adds $50 per person per day. A joined departure uses the price on that departure, not this daily table.",
    "",
    "Booking Mongolia answers questions about Mongolia tours, the Gobi Desert, Khuvsgul Lake, Tsaatan reindeer herders, Altai Tavan Bogd, Naadam, and the 2027 itinerary totals.",
    "",
    "## Contact",
    "- [Contact Booking Mongolia](" + origin + "/contact.html): WhatsApp +976 90283039, email bookingmongoliatour@gmail.com, Ulaanbaatar, Mongolia.",
    "- [About](" + origin + "/about.html): English. [회사 소개](" + origin + "/about-ko.html): Korean.",
    "",
    "## Tours and 2027 itinerary totals",
    "- [Tour Dates](" + origin + "/tours-dates.html): every published tour, its days, and the itinerary total."
  ];
  tours.forEach(function (tour) {
    const facts = priceFacts(tour);
    lines.push("- [" + tour.name + "](" + tourUrl(tour) + "): " + tour.days + " days. " + facts.line);
  });
  lines.push(
    "- [Winter Mongolia](" + origin + "/winter-mongolia): winter departures are Request a Quote.",
    "",
    "## Places and guides",
    "- [Destinations](" + origin + "/destinations.html): Khuvsgul, Gobi, Arkhangai, Khentii, Bayan-Ulgii and other published province pages.",
    "- [Travel guide](" + origin + "/travel-guide.html): seasons, food, ger life, money, safety and self-drive.",
    "- [Visa information](" + origin + "/visa-requirements.html): visa notes for travelers.",
    "- [Hotels](" + origin + "/hotels.html): hotels, ger camps and family stays.",
    "",
    "## Mongolia Brand Store",
    "- [Brand Store](" + origin + "/brand-store): products made in Mongolia. A product is shown only after Booking Mongolia approves it. The page has no checkout.",
    "",
    "## Optional",
    "- [Gallery](" + origin + "/gallery.html): travel photographs.",
    "- [Videos](" + origin + "/videos.html): Mongolia travel videos."
  );
  return lines.join("\n") + "\n";
}

function buildIndexHtml(tours) {
  const items = tours.map(function (tour) {
    const facts = priceFacts(tour);
    return "<li id=\"price-" + tour.id + "\"><a href=\"" + escapeHtml(tourUrl(tour).replace(origin, "") || "/") + "\">" + escapeHtml(tour.name) + "</a>: " + escapeHtml(facts.line) + "</li>";
  }).join("\n");
  const questions = faq.map(function (item) {
    return "<h3>" + escapeHtml(item.q) + "</h3><p>" + escapeHtml(item.a) + "</p>";
  }).join("\n");
  return [
    "<div class=\"price-index\" id=\"itinerary-price-index\">",
    "<h2>2027 itinerary totals</h2>",
    "<p>Each total is the published daily rate multiplied by the days of that itinerary, for one person in a group of 4 or more.</p>",
    "<ul>",
    items,
    "</ul>",
    "<h2>Price questions</h2>",
    questions,
    "</div>"
  ].join("\n");
}

function buildItemList(tours) {
  const graph = [
    {
      "@type": "ItemList",
      "name": "2027 Mongolia tour itinerary totals",
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "numberOfItems": tours.length,
      "itemListElement": tours.map(function (tour, index) {
        const facts = priceFacts(tour);
        const trip = {
          "@type": "TouristTrip",
          "name": tour.name,
          "url": tourUrl(tour),
          "provider": { "@id": origin + "/#organization" }
        };
        if (!facts.quote) {
          trip.offers = {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": String(facts.offer.perPerson),
            "url": tourUrl(tour),
            "description": facts.line
          };
        }
        return { "@type": "ListItem", "position": index + 1, "item": trip };
      })
    },
    {
      "@type": "FAQPage",
      "mainEntity": faq.map(function (item) {
        return {
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a }
        };
      })
    }
  ];
  return "<script type=\"application/ld+json\">\n" + JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2) + "\n</script>";
}

function sentenceFor(tour) {
  if (tour.priceMode === "ask") return "2027 price: Request a Quote.";
  if (!Number(tour.days)) return "This page does not fix one itinerary length. Tour Dates shows the itinerary total for each published tour.";
  return "2027 standard rate for 4 or more travelers: " + priceFacts(tour).line;
}

function patchTourPages() {
  const files = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") return;
        walk(full);
      } else if (entry.name.endsWith(".html")) files.push(full);
    });
  }
  walk(root);
  files.forEach(function (file) {
    let html = fs.readFileSync(file, "utf8");
    if (!html.includes('id="bm-2027-offer"')) return;
    const match = html.match(/<div id="bm-2027-offer"([^>]*)>([\s\S]*?)<\/div>/);
    if (!match) return;
    const attrs = match[1];
    const tour = {
      id: (attrs.match(/data-id="([^"]*)"/) || [])[1] || "",
      name: (attrs.match(/data-name="([^"]*)"/) || [])[1] || "",
      region: (attrs.match(/data-region="([^"]*)"/) || [])[1] || "",
      days: Number((attrs.match(/data-days="([^"]*)"/) || [])[1] || 0),
      priceMode: /data-quote="1"/.test(attrs) ? "ask" : ""
    };
    const facts = priceFacts(tour);
    const paragraph = "<p data-seo-price>" + escapeHtml(sentenceFor(tour)) + "</p>";
    html = html.replace(match[0], "<div id=\"bm-2027-offer\"" + attrs + ">" + paragraph + "</div>");
    html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, function (whole, json) {
      let data;
      try { data = JSON.parse(json); } catch (error) { return whole; }
      const graph = data["@graph"] || [];
      const trip = graph.find(function (node) { return node["@type"] === "TouristTrip"; });
      if (!trip) return whole;
      if (facts.quote) delete trip.offers;
      else {
        trip.offers = {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": String(facts.offer.perPerson),
          "url": trip.url,
          "description": "2027 standard rate for 4 or more travelers: " + facts.line
        };
      }
      return "<script type=\"application/ld+json\">\n" + JSON.stringify(data, null, 2) + "\n</script>";
    });
    fs.writeFileSync(file, html);
  });
}

function build() {
  const toursPage = read("tours-dates.html");
  const tours = catalogTours(toursPage);
  if (tours.length < 20) throw new Error("Tour catalog parse failed: " + tours.length);
  write("llms.txt", buildLlms(tours));
  let next = replaceMarked(toursPage, "seo-itinerary-index", buildIndexHtml(tours));
  next = replaceMarked(next, "seo-itemlist", buildItemList(tours));
  write("tours-dates.html", next);
  patchTourPages();
  return tours;
}

if (require.main === module) {
  const tours = build();
  console.log("seo facts for " + tours.length + " tours");
}

module.exports = { build, catalogTours, priceFacts, faq };
