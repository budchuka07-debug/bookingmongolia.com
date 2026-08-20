/**
 * BookingMongolia — shared Web Share helper
 * Used by traveler blog cards and travel guide article pages.
 * Does not modify car/driver listing behavior.
 */
(function (root) {
  var TOAST_ID = "bm-share-toast";

  function ensureStyles() {
    if (document.getElementById("bm-share-styles")) return;
    var style = document.createElement("style");
    style.id = "bm-share-styles";
    style.textContent = [
      ".bm-share-btn,.community-share-btn{border:1px solid #dbe3ef;background:#fff;color:var(--primary,#0d3b66);border-radius:999px;padding:9px 13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:14px;line-height:1.2;min-height:40px;-webkit-tap-highlight-color:transparent}",
      ".bm-share-btn:hover,.community-share-btn:hover{background:#f8fafc}",
      ".bm-share-btn:active,.community-share-btn:active{transform:scale(.98)}",
      ".bm-share-btn.is-copied,.community-share-btn.is-copied{background:#ecfdf5;border-color:#86efac;color:#166534}",
      ".bm-share-btn-sm{padding:7px 10px;font-size:13px;min-height:36px}",
      ".bm-share-icon{font-size:15px;line-height:1}",
      ".bm-share-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#0d3b66;color:#fff;padding:12px 16px;border-radius:999px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 10px 24px rgba(0,0,0,.18);opacity:0;pointer-events:none;transition:opacity .2s ease}",
      ".bm-share-toast.show{opacity:1}",
      ".bm-share-fallback{position:fixed;inset:0;background:rgba(8,20,33,.45);z-index:10000;display:none;align-items:flex-end;justify-content:center;padding:16px}",
      ".bm-share-fallback.open{display:flex}",
      ".bm-share-sheet{width:100%;max-width:420px;background:#fff;border-radius:18px 18px 14px 14px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.2)}",
      ".bm-share-sheet h4{margin:0 0 8px;font-size:16px;color:#0d3b66}",
      ".bm-share-sheet p{margin:0 0 12px;font-size:13px;color:#6b7280;word-break:break-all}",
      ".bm-share-sheet-actions{display:flex;gap:8px;flex-wrap:wrap}",
      ".bm-share-sheet-actions button{flex:1;min-width:120px;border:0;border-radius:999px;padding:12px 14px;font-weight:800;cursor:pointer}",
      ".bm-share-copy{background:#0d3b66;color:#fff}",
      ".bm-share-close{background:#eef2f7;color:#0d3b66}",
      "@media (min-width:720px){.bm-share-fallback{align-items:center}.bm-share-sheet{border-radius:18px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function showToast(message) {
    ensureStyles();
    var el = document.getElementById(TOAST_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = TOAST_ID;
      el.className = "bm-share-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  function absoluteUrl(url) {
    try { return new URL(url, window.location.href).href; }
    catch (e) { return url || window.location.href; }
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  function closeFallback() {
    var box = document.getElementById("bm-share-fallback");
    if (box) box.classList.remove("open");
  }

  function openFallback(title, url) {
    ensureStyles();
    var box = document.getElementById("bm-share-fallback");
    if (!box) {
      box = document.createElement("div");
      box.id = "bm-share-fallback";
      box.className = "bm-share-fallback";
      box.innerHTML =
        '<div class="bm-share-sheet" role="dialog" aria-modal="true" aria-label="Share">' +
          "<h4>Share this page</h4>" +
          '<p id="bm-share-fallback-url"></p>' +
          '<div class="bm-share-sheet-actions">' +
            '<button type="button" class="bm-share-copy" id="bm-share-copy-btn">Copy link</button>' +
            '<button type="button" class="bm-share-close" id="bm-share-close-btn">Close</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(box);
      box.addEventListener("click", function (e) {
        if (e.target === box) closeFallback();
      });
      document.getElementById("bm-share-close-btn").addEventListener("click", closeFallback);
      document.getElementById("bm-share-copy-btn").addEventListener("click", async function () {
        var link = document.getElementById("bm-share-fallback-url").textContent;
        var ok = await copyText(link);
        showToast(ok ? "Link copied" : "Could not copy link");
        if (ok) closeFallback();
      });
    }
    document.getElementById("bm-share-fallback-url").textContent = url;
    box.querySelector("h4").textContent = title ? ("Share: " + title) : "Share this page";
    box.classList.add("open");
  }

  async function share(opts) {
    ensureStyles();
    var title = (opts && opts.title) || document.title || "Booking Mongolia";
    var text = (opts && opts.text) || title;
    var url = absoluteUrl((opts && opts.url) || window.location.href);
    var btn = opts && opts.button;

    if (navigator.share) {
      try {
        await navigator.share({ title: title, text: text, url: url });
        return { ok: true, method: "native" };
      } catch (err) {
        if (err && err.name === "AbortError") return { ok: false, method: "native", aborted: true };
        // fall through to copy fallback
      }
    }

    try {
      var ok = await copyText(url);
      if (ok) {
        if (btn) {
          btn.classList.add("is-copied");
          var prev = btn.getAttribute("data-label") || btn.innerHTML;
          if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", prev);
          btn.innerHTML = '<span class="bm-share-icon">✓</span> Copied';
          setTimeout(function () {
            btn.classList.remove("is-copied");
            btn.innerHTML = btn.getAttribute("data-label") || "Share";
          }, 1800);
        }
        showToast("Link copied");
        return { ok: true, method: "copy" };
      }
    } catch (e) {}

    openFallback(title, url);
    return { ok: false, method: "fallback" };
  }

  function bindButton(btn) {
    if (!btn || btn.__bmShareBound) return;
    btn.__bmShareBound = true;
    ensureStyles();
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      share({
        title: btn.getAttribute("data-share-title") || document.title,
        text: btn.getAttribute("data-share-text") || btn.getAttribute("data-share-title") || document.title,
        url: btn.getAttribute("data-share-url") || window.location.href,
        button: btn
      });
    });
  }

  function mountArticleShare(options) {
    ensureStyles();
    options = options || {};
    if (document.querySelector("[data-bm-article-share]")) return;

    var title = options.title || document.title || "Booking Mongolia";
    var url = absoluteUrl(options.url || window.location.href);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bm-share-btn";
    btn.setAttribute("data-bm-article-share", "1");
    btn.setAttribute("data-share-title", title);
    btn.setAttribute("data-share-text", title);
    btn.setAttribute("data-share-url", url);
    btn.innerHTML = '<span class="bm-share-icon" aria-hidden="true">↗</span> Share';

    var host =
      document.querySelector(options.hostSelector || "") ||
      document.querySelector(".hero .cta-row") ||
      document.querySelector(".hero-content") ||
      document.querySelector(".hero") ||
      document.querySelector("h1")?.parentElement ||
      document.querySelector("main") ||
      document.body;

    if (host.classList && host.classList.contains("cta-row")) {
      host.appendChild(btn);
    } else if (host.querySelector && host.querySelector("h1")) {
      var wrap = document.createElement("div");
      wrap.className = "bm-share-row";
      wrap.style.cssText = "display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:14px 0 0";
      wrap.appendChild(btn);
      var h1 = host.querySelector("h1");
      if (h1 && h1.nextSibling) host.insertBefore(wrap, h1.nextSibling);
      else host.appendChild(wrap);
    } else {
      host.appendChild(btn);
    }
    bindButton(btn);
  }

  function autoBind() {
    document.querySelectorAll("[data-share-url],.bm-share-btn,.community-share-btn").forEach(bindButton);
  }

  root.BMShare = {
    share: share,
    bindButton: bindButton,
    mountArticleShare: mountArticleShare,
    showToast: showToast,
    copyText: copyText
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      ensureStyles();
      autoBind();
      if (document.body && document.body.hasAttribute("data-bm-auto-share")) {
        mountArticleShare();
      }
    });
  } else {
    ensureStyles();
    autoBind();
  }
})(typeof window !== "undefined" ? window : this);
