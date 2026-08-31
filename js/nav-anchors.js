/**
 * Booking Mongolia — sticky-header-aware section navigation
 * Keeps existing design; only improves hash/anchor scroll behavior.
 */
(function (global) {
  var ALIASES = {
    "car-rental": "cars",
    "car_rental": "cars",
    "transport": "cars",
    "drivers": "cars",
    "hotel": "hotels",
    "accommodation": "hotels",
    "stays": "hotels"
  };

  function headerOffset() {
    var header = document.querySelector("header");
    var topbar = document.querySelector(".topbar");
    var h = header ? header.getBoundingClientRect().height : 0;
    // topbar scrolls away with page when header is sticky; only count sticky header
    return Math.max(72, Math.round(h) + 16);
  }

  function resolveId(hash) {
    var raw = String(hash || "").replace(/^#/, "").trim();
    if (!raw) return null;
    // driver-UUID on listing page
    if (/^driver-/i.test(raw)) return raw;
    return ALIASES[raw.toLowerCase()] || raw;
  }

  function findTarget(hash) {
    var id = resolveId(hash);
    if (!id) return null;
    return document.getElementById(id);
  }

  function scrollToHash(hash, opts) {
    opts = opts || {};
    var el = findTarget(hash);
    if (!el) return false;
    var behavior = opts.behavior || "smooth";
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior });
    return true;
  }

  function scrollToHashWhenReady(hash, attempts) {
    attempts = typeof attempts === "number" ? attempts : 25;
    if (scrollToHash(hash, { behavior: attempts === 25 ? "auto" : "smooth" })) return;
    if (attempts <= 0) return;
    setTimeout(function () {
      scrollToHashWhenReady(hash, attempts - 1);
    }, 150);
  }

  function samePageHref(anchor) {
    if (!anchor || !anchor.getAttribute) return null;
    var href = anchor.getAttribute("href") || "";
    if (!href || href.charAt(0) === "?" || href.indexOf("javascript:") === 0) return null;

    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      var herePath = window.location.pathname.replace(/\/index\.html$/i, "/");
      var linkPath = url.pathname.replace(/\/index\.html$/i, "/");
      if (herePath !== linkPath) return null;
      return url.hash || null;
    } catch (e) {
      if (href.charAt(0) === "#") return href;
      return null;
    }
  }

  function onClick(e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var hash = samePageHref(a);
    if (!hash || hash === "#") return;
    var el = findTarget(hash);
    if (!el) return;
    e.preventDefault();
    if (history.pushState) {
      history.pushState(null, "", hash);
    } else {
      window.location.hash = hash;
    }
    scrollToHash(hash, { behavior: "smooth" });
    // close mobile menu if open
    var nav = document.getElementById("siteNav");
    if (nav && nav.classList.contains("open")) {
      nav.classList.remove("open");
      var toggle = document.querySelector(".menu-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  }

  function init() {
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", function () {
      scrollToHashWhenReady(window.location.hash, 10);
    });
    if (window.location.hash) {
      // Wait a tick for layout / sticky header
      setTimeout(function () {
        scrollToHashWhenReady(window.location.hash, 30);
      }, 50);
    }
  }

  global.BMNavAnchors = {
    scrollToHash: scrollToHash,
    scrollToHashWhenReady: scrollToHashWhenReady,
    resolveId: resolveId,
    headerOffset: headerOffset
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
