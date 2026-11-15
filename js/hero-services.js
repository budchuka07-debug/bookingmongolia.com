/**
 * Booking Mongolia arrival services.
 * One catalog for Airport Transfer, Terelj Transfer, and eSIM.
 * Pages opt in by path, or with <div data-bm-services="airport,esim"></div>.
 */
(function () {
  var PHONE = "97690283039";

  var COPY = {
    en: {
      wa: "Order on WhatsApp",
      contact: "Contact",
      airportTitle: "Airport Transfer",
      airportBody: "Airport pickup or drop-off at any time.",
      tereljTitle: "Terelj Transfer",
      tereljBody: "Private pickup and return transfer between Ulaanbaatar and Terelj.",
      esimTitle: "eSIM Before You Land",
      esimBody: "10GB mobile data + 10,000 local calls."
    },
    ja: {
      wa: "WhatsAppで注文",
      contact: "お問い合わせ",
      airportTitle: "空港送迎",
      airportBody: "空港への送迎はいつでも対応します。",
      tereljTitle: "テレルジ送迎",
      tereljBody: "ウランバートルとテレルジの専用往復送迎です。",
      esimTitle: "到着前のeSIM",
      esimBody: "モバイルデータ10GB + 国内通話10,000回。"
    },
    ko: {
      wa: "WhatsApp으로 주문",
      contact: "문의",
      airportTitle: "공항 송영",
      airportBody: "공항 픽업과 드롭오프는 언제든 가능합니다.",
      tereljTitle: "테렐지 송영",
      tereljBody: "울란바토르와 테렐지 사이 전용 왕복 송영입니다.",
      esimTitle: "도착 전 eSIM",
      esimBody: "모바일 데이터 10GB + 국내 통화 10,000건."
    }
  };

  var SERVICES = {
    airport: {
      id: "airport",
      price: "$40 per car",
      titleKey: "airportTitle",
      bodyKey: "airportBody",
      message: "Airport Transfer, $40 per car"
    },
    terelj: {
      id: "terelj",
      price: "$40 per car",
      titleKey: "tereljTitle",
      bodyKey: "tereljBody",
      message: "Terelj Transfer, $40 per car"
    },
    esim: {
      id: "esim",
      price: "$15",
      titleKey: "esimTitle",
      bodyKey: "esimBody",
      message: "eSIM Before You Land, $15, 10GB + 10,000 local calls"
    }
  };

  function lang() {
    var current = window.BM_I18N && window.BM_I18N.getLang && window.BM_I18N.getLang();
    return COPY[current] ? current : "en";
  }

  function waLink(message) {
    return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message);
  }

  function ensureStyles() {
    if (document.getElementById("bm-hero-services-css")) return;
    var link = document.createElement("link");
    link.id = "bm-hero-services-css";
    link.rel = "stylesheet";
    link.href = "/css/hero-services.css?v=20261115svc";
    document.head.appendChild(link);
  }

  function render(ids, variant) {
    var pack = COPY[lang()];
    var root = document.createElement("div");
    root.className = "bm-services" + (variant === "compact" ? " is-compact" : "");
    root.setAttribute("data-bm-services-rendered", ids.join(","));
    var row = document.createElement("div");
    row.className = "bm-services-row";
    row.style.setProperty("--bm-n", String(ids.length));
    ids.forEach(function (id) {
      var service = SERVICES[id];
      if (!service) return;
      var card = document.createElement("article");
      card.className = "bm-service";
      var title = document.createElement("h3");
      title.textContent = pack[service.titleKey];
      var price = document.createElement("p");
      price.className = "bm-service-price";
      price.textContent = service.price;
      var body = document.createElement("p");
      body.className = "bm-service-text";
      body.textContent = pack[service.bodyKey];
      var actions = document.createElement("div");
      actions.className = "bm-service-actions";
      var wa = document.createElement("a");
      wa.className = "bm-service-wa";
      wa.href = waLink(service.message);
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.textContent = pack.wa;
      var contact = document.createElement("a");
      contact.className = "bm-service-contact";
      contact.href = "/contact";
      contact.textContent = pack.contact;
      actions.appendChild(wa);
      actions.appendChild(contact);
      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(body);
      card.appendChild(actions);
      row.appendChild(card);
    });
    root.appendChild(row);
    return root;
  }

  function paint(host, ids, variant, band) {
    if (!host || host.querySelector(".bm-services")) return;
    var node = render(ids, variant);
    if (band) {
      var wrap = document.createElement("div");
      wrap.className = "bm-services-band";
      wrap.appendChild(node);
      node = wrap;
    }
    host.appendChild(node);
  }

  function mountInHero(ids, variant) {
    var hero = document.querySelector(".hero");
    if (!hero || hero.querySelector(".bm-services")) return false;
    var content = hero.querySelector(".hero-content");
    var node = render(ids, variant);
    if (content && content.parentElement) {
      content.parentElement.insertBefore(node, content.nextSibling);
      return true;
    }
    var inner = hero.querySelector(".hero-inner, .container, .wrap");
    if (inner) inner.appendChild(node);
    else hero.appendChild(node);
    return true;
  }

  function mountAfterTitle(ids, variant) {
    var head = document.querySelector(".section-head, h1");
    if (!head) return false;
    var host = head.classList && head.classList.contains("section-head") ? head : head.parentElement;
    if (!host || host.querySelector(".bm-services")) return false;
    paint(host, ids, variant, true);
    return true;
  }

  function preset() {
    var path = (window.location.pathname || "/").toLowerCase();
    if (path === "/" || /\/index\.html$/.test(path)) {
      return { ids: ["airport", "terelj", "esim"], variant: "home", place: "hero" };
    }
    if (path.indexOf("winter-mongolia") !== -1) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero" };
    }
    if (path.indexOf("hotel") !== -1) {
      return { ids: ["airport", "esim"], variant: "compact", place: "title" };
    }
    if (
      path.indexOf("/destinations") !== -1 ||
      path.indexOf("destinations.html") !== -1 ||
      path.indexOf("/tours") !== -1 ||
      path.indexOf("tours.html") !== -1 ||
      path.indexOf("tours-dates") !== -1
    ) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero-or-title" };
    }
    if (
      path.indexOf("experiences") !== -1 ||
      path.indexOf("nomadic-experience") !== -1 ||
      path.indexOf("vip-helicopter") !== -1
    ) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero-or-title" };
    }
    return null;
  }

  function mountAuto() {
    var slots = document.querySelectorAll("[data-bm-services]");
    if (slots.length) {
      slots.forEach(function (slot) {
        if (slot.querySelector(".bm-services")) return;
        var ids = (slot.getAttribute("data-bm-services") || "")
          .split(",")
          .map(function (part) { return part.trim(); })
          .filter(function (id) { return SERVICES[id]; });
        if (!ids.length) return;
        var variant = slot.getAttribute("data-bm-variant") || "compact";
        slot.appendChild(render(ids, variant));
      });
      return;
    }
    var spec = preset();
    if (!spec) return;
    if (spec.place === "hero") {
      mountInHero(spec.ids, spec.variant);
      return;
    }
    if (spec.place === "title") {
      mountAfterTitle(spec.ids, spec.variant);
      return;
    }
    if (!mountInHero(spec.ids, spec.variant)) mountAfterTitle(spec.ids, spec.variant);
  }

  function refresh() {
    document.querySelectorAll(".bm-services").forEach(function (node) {
      var ids = (node.getAttribute("data-bm-services-rendered") || "").split(",").filter(Boolean);
      var variant = node.classList.contains("is-compact") ? "compact" : "home";
      var next = render(ids, variant);
      node.replaceWith(next);
    });
  }

  window.BMServices = {
    services: SERVICES,
    copy: COPY,
    render: render,
    refresh: refresh
  };

  function start() {
    ensureStyles();
    mountAuto();
    if (window.BM_I18N && Array.isArray(window.BM_I18N.onChange)) {
      window.BM_I18N.onChange.push(refresh);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
