/**
 * BookingMongolia GA4 — Measurement ID G-SWZZY2HBZB
 * Load early in <head> on every page: <script src="/js/ga4.js"></script>
 */
(function () {
  var MEASUREMENT_ID = "G-SWZZY2HBZB";
  if (window.__bmGa4Loaded) return;
  window.__bmGa4Loaded = true;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);
})();
