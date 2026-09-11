/**
 * One-shot helper: extract shared CSS/JS from index.html and write dedicated nav pages.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const html = fs.readFileSync(indexPath, "utf8").replace(/\r\n/g, "\n");

function extractBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start < 0 || end < 0) throw new Error("Could not extract " + startToken);
  return {
    inner: source.slice(start + startToken.length, end),
    start,
    end: end + endToken.length
  };
}

function extractById(source, tag, id) {
  const openRe = new RegExp("<" + tag + "[^>]*\\sid=[\"']" + id + "[\"'][^>]*>", "i");
  const match = openRe.exec(source);
  if (!match) throw new Error("Missing #" + id);
  const start = match.index;
  const openTagEnd = source.indexOf(">", start) + 1;
  let depth = 1;
  const open = new RegExp("<" + tag + "\\b", "gi");
  const close = new RegExp("<\\/" + tag + ">", "gi");
  open.lastIndex = openTagEnd;
  close.lastIndex = openTagEnd;
  let cursor = openTagEnd;
  while (depth > 0) {
    const nextOpen = source.slice(cursor).search(new RegExp("<" + tag + "\\b", "i"));
    const nextClose = source.slice(cursor).search(new RegExp("<\\/" + tag + ">", "i"));
    if (nextClose < 0) throw new Error("Unclosed #" + id);
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      cursor += nextOpen + tag.length + 1;
    } else {
      depth -= 1;
      cursor += nextClose + tag.length + 3;
    }
  }
  return source.slice(start, cursor);
}

const styleBlock = extractBetween(html, "  <style>", "  </style>");
const chatStyle = extractBetween(html, "<style>\n.chat-container{", "\n</style>");
fs.mkdirSync(path.join(root, "css"), { recursive: true });
fs.writeFileSync(
  path.join(root, "css", "site.css"),
  styleBlock.inner.trim() + "\n\n.chat-container{" + chatStyle.inner + "\n",
  "utf8"
);

const listingsScript = extractBetween(html, "<script>\n const SUPABASE_URL", "</script>");
let appJs = " const SUPABASE_URL" + listingsScript.inner;
appJs = appJs.replace(
  "  async function loadHotels() {\n    const wrap = document.getElementById('hotel-list');",
  "  async function loadHotels() {\n    const wrap = document.getElementById('hotel-list');\n    if (!wrap) return;"
);
appJs = appJs.replace(
  "async function loadGuides() {\n\n  const { data, error } = await supabaseClient",
  "async function loadGuides() {\n  if (!document.getElementById('guide-list')) return;\n\n  const { data, error } = await supabaseClient"
);
appJs = appJs.replace(
  "async function loadCars() {\n  const { data, error } = await supabaseClient",
  "async function loadCars() {\n  const container = document.getElementById('car-list');\n  if (!container) return;\n  const { data, error } = await supabaseClient"
);
appJs = appJs.replace(
  "  const container = document.getElementById('car-list');\n  if (!container) return;\n\n  if (error) {",
  "  if (error) {"
);
appJs = appJs.replace(
  "    const shareUrl = `${window.location.origin}/#${anchorId}`;",
  "    const shareUrl = `${window.location.origin}/car-rental.html#${anchorId}`;"
);
appJs = appJs.replace(
  "    const shareUrl = `${window.location.origin}${window.location.pathname}#community-post-${postId}`;",
  "    const shareUrl = `${window.location.origin}/travel-hub.html#community-post-${postId}`;"
);
fs.writeFileSync(path.join(root, "js", "index-app.js"), appJs.trim() + "\n", "utf8");

const i18nScript = extractBetween(html, "    const slides = document.querySelectorAll('.hero-slide');", "    setLanguage('en');\n  </script>");
let i18nJs = "    const slides = document.querySelectorAll('.hero-slide');" + i18nScript.inner + "    setLanguage('en');\n";
i18nJs = i18nJs.replace(
  "    function showNextSlide() {\n      slides[currentSlide].classList.remove('active');\n      currentSlide = (currentSlide + 1) % slides.length;\n      slides[currentSlide].classList.add('active');\n    }\n\n    setInterval(showNextSlide, 4000);",
  "    function showNextSlide() {\n      if (!slides.length) return;\n      slides[currentSlide].classList.remove('active');\n      currentSlide = (currentSlide + 1) % slides.length;\n      slides[currentSlide].classList.add('active');\n    }\n\n    if (slides.length) setInterval(showNextSlide, 4000);"
);
fs.writeFileSync(path.join(root, "js", "site-i18n.js"), i18nJs.trim() + "\n", "utf8");

const destScript = extractBetween(html, "    const provinceData = {", "  </script>\n\n  <a class=\"book-now-float\"");
fs.writeFileSync(
  path.join(root, "js", "destinations-map.js"),
  "    const provinceData = {" + destScript.inner.trim() + "\n",
  "utf8"
);

const header = `  <div class="topbar">
    <div class="container">
      <div data-i18n="topbar_left">Local Mongolia Travel Expert • Private Tours • Transport Help</div>
      <div data-i18n="topbar_right">WhatsApp: +976 90283039 • English / 日本語 / 한국어</div>
    </div>
  </div>

  <header>
    <div class="container nav">
      <a href="/index.html" class="logo">Booking<span>Mongolia</span></a>
      <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-label="Open menu" aria-expanded="false">☰</button>
      <nav class="nav-links" id="siteNav">
        <a href="/experiences.html" data-i18n="nav_experiences">Experiences</a>
        <a href="/visa-requirements.html">Visa Information</a>
        <a href="/destinations.html" data-i18n="nav_destinations">Destinations</a>
        <a href="/hotels.html" class="nav-hotels" data-i18n="nav_hotels">Hotels</a>
        <a href="/guides.html">Guides</a>
        <a href="/car-rental.html" data-i18n="nav_cars">Car Rental</a>
        <a href="/travel-hub.html">Traveler Hub</a>
        <a href="/contact.html" data-i18n="nav_contact">Contact</a>
        <a href="/vip-helicopter-expedition.html">Helicopter Tour</a>
        <a href="/tours.html" data-i18n="nav_tours">VIP Tours</a>
        <a href="/nomadic-experience.html">Nomadic Experience</a>
        <a href="/travel-guide.html" data-i18n="nav_guide">Travel Guide</a>
        <a href="/tours-dates.html">Tour&amp;dates</a>
        <a href="/videos.html" data-i18n="nav_videos">Videos</a>
        <a href="/gallery.html" data-i18n="nav_gallery">Gallery</a>
        <a href="/about.html" data-i18n="nav_about">About</a>
      </nav>
      <div class="header-actions">
        <a class="header-register-link" href="/register-service.html">Register Service</a>
        <div class="lang-switch">
          <button class="active" data-lang="en">EN</button>
          <button data-lang="ja">日本語</button>
          <button data-lang="ko">한국어</button>
        </div>
      </div>
    </div>
  </header>`;

const footer = `  <footer>
    <div class="container footer-wrap">
      <div>© 2026 Booking Mongolia</div>
      <div data-i18n="footer_text">Local travel guide, private tours and Mongolia trip planning.</div>
      <div class="footer-links" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:10px;font-size:14px;">
        <a href="/about.html">About</a>
        <a href="/booking.html">Booking</a>
        <a href="/tours-dates.html">Tours &amp; Dates</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/disclaimer.html">Disclaimer</a>
        <a href="/contact.html">Contact</a>
      </div>
    </div>
  </footer>`;

const lightbox = `  <div id="image-lightbox" class="image-lightbox" onclick="closeImageLightbox()">
    <span class="image-lightbox-close">&times;</span>
    <img id="image-lightbox-img" src="" alt="Large image">
  </div>`;

function pageHead({ title, description, canonical, extraHead = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0d3b66" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <script src="/js/ga4.js"></script>
  <script src="/js/share.js"></script>
  <link rel="stylesheet" href="/css/site.css" />
  ${extraHead}
  <script src="/js/book-dates-btn.js" defer></script>
  <script src="/js/site-nav.js" defer></script>
  <script src="/js/nav-anchors.js" defer></script>
</head>`;
}

const listingScripts = `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script src="/data/accommodation-schema.js"></script>
<script src="/data/hotel-mock.js"></script>
<script src="/js/hotel-inquiry.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/index-app.js"></script>
<script src="/js/site-i18n.js"></script>`;

const simpleScripts = `
<script src="/js/site-i18n.js"></script>`;

const pages = [
  {
    file: "experiences.html",
    title: "Mongolia Experiences | Booking Mongolia",
    description: "Top Mongolia travel experiences including reindeer families, eagle hunters, Gobi desert, nomadic life, Khuvsgul Lake and Naadam.",
    canonical: "https://bookingmongolia.com/experiences.html",
    body: extractById(html, "section", "experiences"),
    scripts: simpleScripts
  },
  {
    file: "destinations.html",
    title: "Mongolia Destinations | Booking Mongolia",
    description: "Explore Mongolia by destination. Click a province to find famous places, travel tips and related tours.",
    canonical: "https://bookingmongolia.com/destinations.html",
    body: extractById(html, "section", "destinations"),
    scripts: `\n<script src="/js/destinations-map.js"></script>\n<script src="/js/site-i18n.js"></script>`
  },
  {
    file: "hotels.html",
    title: "Hotels & Camps in Mongolia | Booking Mongolia",
    description: "Browse hotels, guesthouses, hostels, tourist ger camps, resorts, lodges and nomadic family stays across Mongolia.",
    canonical: "https://bookingmongolia.com/hotels.html",
    extraHead: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />`,
    body: extractById(html, "section", "hotels"),
    scripts: listingScripts,
    extra: lightbox
  },
  {
    file: "guides.html",
    title: "Local Guides in Mongolia | Booking Mongolia",
    description: "Meet professional local guides across Mongolia for culture, adventure and private travel.",
    canonical: "https://bookingmongolia.com/guides.html",
    body: extractById(html, "section", "guides"),
    scripts: listingScripts,
    extra: lightbox
  },
  {
    file: "car-rental.html",
    title: "Car Rental in Mongolia | Booking Mongolia",
    description: "Private vehicles and experienced local drivers for travel across Mongolia.",
    canonical: "https://bookingmongolia.com/car-rental.html",
    body: extractById(html, "section", "cars"),
    scripts: listingScripts,
    extra: lightbox
  },
  {
    file: "tours.html",
    title: "Mongolia Tours | Booking Mongolia",
    description: "Featured private Mongolia tours including Gobi, Khuvsgul, Altai, Naadam, horse riding and nomadic journeys.",
    canonical: "https://bookingmongolia.com/tours.html",
    body: extractById(html, "section", "tours"),
    scripts: simpleScripts
  },
  {
    file: "travel-guide.html",
    title: "Mongolia Travel Guide | Booking Mongolia",
    description: "Practical Mongolia travel guide covering culture, food, weather, money, safety, transport and nomadic life.",
    canonical: "https://bookingmongolia.com/travel-guide.html",
    body: extractById(html, "section", "guide"),
    scripts: simpleScripts
  },
  {
    file: "videos.html",
    title: "Mongolia Travel Videos | Booking Mongolia",
    description: "Watch real Mongolia travel videos of landscapes, nomadic life and local experiences.",
    canonical: "https://bookingmongolia.com/videos.html",
    body: extractById(html, "section", "videos"),
    scripts: simpleScripts
  },
  {
    file: "gallery.html",
    title: "Mongolia Gallery | Booking Mongolia",
    description: "Travel photos from Mongolia landscapes, nomadic life and cultural experiences.",
    canonical: "https://bookingmongolia.com/gallery.html",
    body: extractById(html, "section", "gallery"),
    scripts: simpleScripts
  },
  {
    file: "contact.html",
    title: "Contact Booking Mongolia",
    description: "Contact Booking Mongolia for private tours, hotels, car rental and trip planning support.",
    canonical: "https://bookingmongolia.com/contact.html",
    body: extractById(html, "section", "contact"),
    scripts: simpleScripts
  },
  {
    file: "travel-hub.html",
    title: "Traveler Hub | Booking Mongolia",
    description: "Traveler blog and group tour sharing board for Mongolia trips.",
    canonical: "https://bookingmongolia.com/travel-hub.html",
    body: extractById(html, "section", "community"),
    scripts: listingScripts,
    extra: lightbox
  },
  {
    file: "register-service.html",
    title: "Register Your Service | Booking Mongolia",
    description: "Register a hotel, ger camp, guide or driver service for review on Booking Mongolia.",
    canonical: "https://bookingmongolia.com/register-service.html",
    body: extractById(html, "section", "service-registration") + "\n" + extractById(html, "div", "register-modal"),
    scripts: listingScripts,
    extra: lightbox
  }
];

for (const page of pages) {
  const out = `${pageHead(page)}
<body class="bm-inner-page">
${header}

${page.body}
${page.extra || ""}
${footer}
${page.scripts || ""}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, page.file), out, "utf8");
  console.log("Wrote", page.file);
}

console.log("Extracted css/site.css, js/index-app.js, js/site-i18n.js, js/destinations-map.js");
