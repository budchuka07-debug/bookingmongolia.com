const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
let html = fs.readFileSync(indexPath, "utf8").replace(/\r\n/g, "\n");

function replaceFirst(source, startToken, endToken, replacement) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start < 0 || end < 0) throw new Error("Missing block: " + startToken.slice(0, 60));
  return source.slice(0, start) + replacement + source.slice(end + endToken.length);
}

html = replaceFirst(
  html,
  "  <style>",
  "  </style>",
  '  <link rel="stylesheet" href="/css/site.css" />'
);

html = html.replace(
  '<script src="/js/book-dates-btn.js" defer></script>\n<script src="/js/nav-anchors.js" defer></script>',
  '<script src="/js/book-dates-btn.js" defer></script>\n<script src="/js/site-nav.js" defer></script>\n<script src="/js/nav-anchors.js" defer></script>'
);

const oldNav = `      <a href="#home" class="logo">Booking<span>Mongolia</span></a>
      <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-label="Open menu" aria-expanded="false">☰</button>

      <nav class="nav-links" id="siteNav">
        <a href="#experiences" data-i18n="nav_experiences">Experiences</a>
        <a href="visa-requirements.html">Visa Information</a>
        <a href="#destinations" data-i18n="nav_destinations">Destinations</a>
        <a href="#hotels" class="nav-hotels" data-i18n="nav_hotels">Hotels</a>
        <a href="#guides">Guides</a>
        <a href="#car-rental" data-i18n="nav_cars">Car Rental</a>
        <a href="#community">Traveler Hub</a>
        <a href="#contact" data-i18n="nav_contact">Contact</a>
        <a href="/vip-helicopter-expedition.html">Helicopter Tour</a>
        <a href="#tours" data-i18n="nav_tours">VIP Tours</a>
       <a href="nomadic-experience.html">Nomadic Experience</a>
        <a href="#guide" data-i18n="nav_guide">Travel Guide</a>
        <a href="/tours-dates.html">Tour&dates</a>
        <a href="#videos" data-i18n="nav_videos">Videos</a>
        <a href="#gallery" data-i18n="nav_gallery">Gallery</a>
        <a href="#about" data-i18n="nav_about">About</a>
        <a href="#contact" data-i18n="nav_contact">Contact</a>
      </nav>`;

const newNav = `      <a href="/index.html" class="logo">Booking<span>Mongolia</span></a>
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
      </nav>`;

if (!html.includes(oldNav)) throw new Error("Could not find homepage nav block");
html = html.replace(oldNav, newNav);

html = html.replace(
  '<a class="header-register-link" href="#service-registration">Register Service</a>',
  '<a class="header-register-link" href="/register-service.html">Register Service</a>'
);

html = html.replace(
  '  <a class="btn btn-primary" href="#tours" data-i18n="hero_btn_1">View Tours</a>\n  <a class="btn btn-outline" href="#guide" data-i18n="hero_btn_2">Travel Guide</a>',
  '  <a class="btn btn-primary" href="/tours.html" data-i18n="hero_btn_1">View Tours</a>\n  <a class="btn btn-outline" href="/travel-guide.html" data-i18n="hero_btn_2">Travel Guide</a>'
);

html = html.replace(
  '          <a class="quick-link quick-hotels" href="#hotels">Hotels &amp; Camps</a>\n          <a class="quick-link" href="#car-rental">🚙 Car Rental</a>\n          <a class="quick-link" href="#guides">🧭 Guides</a>\n          <a class="quick-link" href="#service-registration">📝 Register Service</a>\n          <a class="quick-link" href="#contact">✉️ Contact</a>',
  '          <a class="quick-link quick-hotels" href="/hotels.html">Hotels &amp; Camps</a>\n          <a class="quick-link" href="/car-rental.html">🚙 Car Rental</a>\n          <a class="quick-link" href="/guides.html">🧭 Guides</a>\n          <a class="quick-link" href="/register-service.html">📝 Register Service</a>\n          <a class="quick-link" href="/contact.html">✉️ Contact</a>'
);

html = html.replace('<a href="#contact">Contact</a>', '<a href="/contact.html">Contact</a>');

html = replaceFirst(
  html,
  "<script>\n const SUPABASE_URL",
  "</script>",
  '<script src="/js/index-app.js"></script>'
);

html = replaceFirst(
  html,
  "<script>\n    const slides = document.querySelectorAll('.hero-slide');",
  "    setLanguage('en');\n  </script>",
  '<script src="/js/site-i18n.js"></script>'
);

html = replaceFirst(
  html,
  "  <script>\n    const provinceData = {",
  "  </script>\n\n  <a class=\"book-now-float\"",
  '  <script src="/js/destinations-map.js"></script>\n\n  <a class="book-now-float"'
);

fs.writeFileSync(indexPath, html, "utf8");
console.log("Updated index.html");
