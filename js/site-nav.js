/**
 * Mobile menu only. Nav items are real <a href> links — this never preventDefault.
 */
(function (global) {
  function closeNav() {
    var nav = document.getElementById("siteNav");
    var btn = document.querySelector(".menu-toggle");
    if (nav) nav.classList.remove("active");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    var nav = document.getElementById("siteNav");
    var btn = document.querySelector(".menu-toggle");
    if (!nav || !btn) return;
    var isOpen = nav.classList.toggle("active");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function markCurrentPage() {
    var nav = document.getElementById("siteNav");
    if (!nav) return;
    var here = (window.location.pathname || "").replace(/\/index\.html$/i, "/");
    nav.querySelectorAll("a[href]").forEach(function (a) {
      try {
        var url = new URL(a.getAttribute("href"), window.location.href);
        var path = url.pathname.replace(/\/index\.html$/i, "/");
        if (path === here) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } catch (e) {}
    });
  }

  function ensureBrandStoreLink() {
    var nav = document.getElementById("siteNav");
    if (!nav || nav.querySelector('a[href="/brand-store"]')) return;
    var link = document.createElement("a");
    link.href = "/brand-store";
    link.setAttribute("data-i18n", "nav_brand_store");
    link.textContent = global.BM_I18N && global.BM_I18N.t
      ? global.BM_I18N.t("nav_brand_store", "Brand Store")
      : "Brand Store";
    var gallery = nav.querySelector('a[href="/gallery.html"]');
    if (gallery && gallery.nextSibling) nav.insertBefore(link, gallery.nextSibling);
    else if (gallery) gallery.insertAdjacentElement("afterend", link);
    else nav.appendChild(link);
  }

  function init() {
    ensureBrandStoreLink();
    markCurrentPage();
    var nav = document.getElementById("siteNav");
    var btn = document.querySelector(".menu-toggle");
    if (btn && !btn.getAttribute("onclick")) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMenu();
      });
    }
    if (nav) {
      nav.addEventListener("click", function (e) {
        var a = e.target && e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        // Hiding the menu in the same click can cancel navigation on mobile.
        setTimeout(closeNav, 0);
      });
    }
    document.addEventListener("click", function (e) {
      if (!nav || !btn || !nav.classList.contains("active")) return;
      if (nav.contains(e.target) || btn.contains(e.target)) return;
      closeNav();
    });
  }

  global.toggleMenu = toggleMenu;
  global.closeSiteNav = closeNav;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
