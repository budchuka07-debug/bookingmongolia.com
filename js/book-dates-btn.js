/**
 * Booking Mongolia — global "Check Dates & Book" button
 * Mobile-friendly: compact left pill; chat stays on the right.
 */
(function () {
  var path = (window.location.pathname || "").toLowerCase();
  if (path.indexOf("tours-dates") !== -1) return;
  if (path.indexOf("admin") !== -1) return;

  var SELECTOR =
    '#bm-book-dates-btn,a.floating[href*="tours-dates"],a.floating-book-btn[href*="tours-dates"]';

  function ensureStyles() {
    if (document.getElementById("bm-book-dates-styles")) return;
    var style = document.createElement("style");
    style.id = "bm-book-dates-styles";
    style.textContent = [
      SELECTOR + "{",
      "position:fixed!important;",
      "left:18px!important;",
      "right:auto!important;",
      "bottom:18px!important;",
      "z-index:9997!important;",
      "display:inline-flex!important;",
      "align-items:center;",
      "justify-content:center;",
      "gap:8px;",
      "width:auto!important;",
      "max-width:calc(100vw - 100px);",
      "background:linear-gradient(135deg,#c98b2f,#e0a63f)!important;",
      "color:#fff!important;",
      "padding:13px 18px!important;",
      "border-radius:999px!important;",
      "font-weight:800!important;",
      "font-size:15px!important;",
      "line-height:1.2!important;",
      "text-decoration:none!important;",
      "box-shadow:0 10px 24px rgba(13,59,102,.22)!important;",
      "border:0!important;",
      "-webkit-tap-highlight-color:transparent;",
      "touch-action:manipulation;",
      "}",
      SELECTOR + ":active{transform:scale(.98)}",
      "body.bm-has-book-btn{padding-bottom:88px}",

      "@media (max-width:720px){",
      SELECTOR + "{",
      "left:12px!important;",
      "right:auto!important;",
      "bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;",
      "max-width:min(200px,calc(100vw - 92px))!important;",
      "min-height:48px;",
      "padding:12px 15px!important;",
      "font-size:13.5px!important;",
      "white-space:nowrap;",
      "overflow:hidden;",
      "text-overflow:ellipsis;",
      "}",
      "body.bm-has-book-btn{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}",
      ".chat-container{",
      "right:12px!important;",
      "bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      ".chat-main-btn{width:54px!important;height:54px!important;font-size:22px!important}",
      "body.bm-has-book-btn .book-now-float{display:none!important}",
      ".back-home-btn{",
      "left:auto!important;",
      "right:12px!important;",
      "bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

  function applyMobileLabel(el) {
    if (!el) return;
    var mobile = window.matchMedia && window.matchMedia("(max-width:720px)").matches;
    if (mobile) {
      if (el.getAttribute("data-bm-shortened") === "1") return;
      var text = (el.textContent || "").replace(/\s+/g, " ").trim();
      el.setAttribute("data-bm-full-label", text || "Check Dates & Book");
      el.setAttribute("data-bm-shortened", "1");
      el.textContent = "Dates & Book";
    } else if (el.getAttribute("data-bm-full-label")) {
      el.textContent = el.getAttribute("data-bm-full-label");
      el.removeAttribute("data-bm-shortened");
    }
  }

  function upgradeExisting() {
    var nodes = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < nodes.length; i++) applyMobileLabel(nodes[i]);
    if (nodes.length) document.body.classList.add("bm-has-book-btn");
    return nodes.length > 0;
  }

  function mount() {
    ensureStyles();
    if (upgradeExisting()) return;

    var a = document.createElement("a");
    a.id = "bm-book-dates-btn";
    a.href = "/tours-dates.html";
    a.setAttribute("aria-label", "Check tour dates and book");
    a.textContent = "Check Dates & Book";
    document.body.appendChild(a);
    document.body.classList.add("bm-has-book-btn");
    applyMobileLabel(a);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  if (window.matchMedia) {
    var mq = window.matchMedia("(max-width:720px)");
    var onChange = function () {
      document.querySelectorAll(SELECTOR).forEach(applyMobileLabel);
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
