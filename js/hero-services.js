(function () {
  var WHATSAPP = "https://wa.me/97690283039?text=";

  var services = [
    {
      id: "airport",
      price: "$40 per car",
      wa: "Airport Transfer, $40 per car",
      title: { en: "Airport Transfer", ja: "空港送迎", ko: "공항 송영" },
      body: {
        en: "Airport pickup or drop-off at any time.",
        ja: "空港への送迎はいつでも対応します。",
        ko: "공항 픽업과 드롭오프는 언제든 가능합니다."
      }
    },
    {
      id: "terelj",
      price: "$40 per car",
      wa: "Terelj Transfer, $40 per car",
      title: { en: "Terelj Transfer", ja: "テレルジ送迎", ko: "테렐지 송영" },
      body: {
        en: "Private pickup and return transfer between Ulaanbaatar and Terelj.",
        ja: "ウランバートルとテレルジの専用往復送迎です。",
        ko: "울란바토르와 테렐지 사이 전용 왕복 송영입니다."
      }
    },
    {
      id: "esim",
      price: "$15",
      wa: "eSIM Before You Land, $15, 10GB + 10,000 local calls",
      title: { en: "eSIM Before You Land", ja: "到着前のeSIM", ko: "도착 전 eSIM" },
      body: {
        en: "10GB mobile data + 10,000 local calls.",
        ja: "モバイルデータ10GB + 国内通話10,000回。",
        ko: "모바일 데이터 10GB + 국내 통화 10,000건."
      }
    }
  ];

  var buttons = {
    en: { wa: "Order on WhatsApp", contact: "Contact" },
    ja: { wa: "WhatsAppで注文", contact: "お問い合わせ" },
    ko: { wa: "WhatsApp으로 주문", contact: "문의" }
  };

  var byId = {};
  services.forEach(function (service) {
    byId[service.id] = service;
  });

  var mounts = [];
  var booted = false;

  function langCode(lang) {
    var code = lang || "en";
    if (!lang) {
      if (window.BM_I18N && typeof window.BM_I18N.getLang === "function") {
        code = window.BM_I18N.getLang() || "en";
      } else if (document.documentElement && document.documentElement.lang) {
        code = document.documentElement.lang;
      }
    }
    code = String(code).toLowerCase().slice(0, 2);
    return buttons[code] ? code : "en";
  }

  function copy(lang) {
    var code = langCode(lang);
    return {
      lang: code,
      wa: buttons[code].wa,
      contact: buttons[code].contact,
      services: services.map(function (service) {
        return {
          id: service.id,
          title: service.title[code],
          price: service.price,
          body: service.body[code],
          wa: service.wa
        };
      })
    };
  }

  function ensureCss() {
    if (document.getElementById("bm-hero-services-css")) return;
    var link = document.createElement("link");
    link.id = "bm-hero-services-css";
    link.rel = "stylesheet";
    link.href = "/css/hero-services.css?v=20261115svc";
    (document.head || document.documentElement).appendChild(link);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function paint(host, ids, variant) {
    var code = langCode();
    var labels = buttons[code];
    var chosen = [];
    ids.forEach(function (id) {
      if (byId[id]) chosen.push(byId[id]);
    });
    host.classList.add("bm-services");
    host.setAttribute("data-bm-variant", variant === "home" ? "home" : "compact");
    host.innerHTML = "";
    var row = el("div", "bm-services-row");
    row.style.setProperty("--bm-n", String(chosen.length));
    chosen.forEach(function (service) {
      var article = el("article", "bm-service");
      article.appendChild(el("h3", "", service.title[code]));
      article.appendChild(el("p", "bm-service-price", service.price));
      article.appendChild(el("p", "bm-service-text", service.body[code]));
      var wa = el("a", "bm-service-wa", labels.wa);
      wa.href = WHATSAPP + encodeURIComponent(service.wa);
      wa.target = "_blank";
      wa.rel = "noopener";
      article.appendChild(wa);
      var contact = el("a", "bm-service-contact", labels.contact);
      contact.href = "/contact";
      article.appendChild(contact);
      row.appendChild(article);
    });
    host.appendChild(row);
  }

  function render(host, ids, variant) {
    if (!host || !document.body) return host;
    ensureCss();
    var list = (ids || []).map(function (id) { return String(id).trim(); }).filter(Boolean);
    var mode = variant === "home" ? "home" : "compact";
    var known = null;
    mounts.forEach(function (mount) {
      if (mount.host === host) known = mount;
    });
    if (known) {
      known.ids = list;
      known.variant = mode;
    } else {
      mounts.push({ host: host, ids: list, variant: mode });
    }
    paint(host, list, mode);
    return host;
  }

  function refresh() {
    mounts.forEach(function (mount) {
      if (mount.host && mount.host.isConnected !== false) paint(mount.host, mount.ids, mount.variant);
    });
  }

  function bindLang() {
    var api = window.BM_I18N;
    if (!api || !Array.isArray(api.onChange) || api.onChange._bmServices) return;
    api.onChange.push(function () { refresh(); });
    api.onChange._bmServices = true;
  }

  function idsFrom(value) {
    return String(value || "").split(",").map(function (id) { return id.trim(); }).filter(Boolean);
  }

  function denied(path) {
    return /about|contact|gallery|(^|\/)guides?(\/|\.|$)|travel-guide|\/guide\/|terms|privacy|disclaimer|legal/.test(path);
  }

  function planFor(path) {
    var pathName = String(path || "/").toLowerCase();
    if (denied(pathName)) return null;
    if (pathName === "/" || /\/index\.html?$/.test(pathName)) {
      return { ids: ["airport", "terelj", "esim"], variant: "home", place: "hero" };
    }
    if (pathName.indexOf("winter-mongolia") !== -1) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero" };
    }
    if (pathName.indexOf("hotel") !== -1) {
      return { ids: ["airport", "esim"], variant: "compact", place: "band" };
    }
    if (pathName.indexOf("nomadic-experience") !== -1 || pathName.indexOf("vip-helicopter") !== -1 || pathName.indexOf("experiences") !== -1) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero-or-title" };
    }
    if (pathName.indexOf("tours-dates") !== -1 || pathName.indexOf("destinations") !== -1 || pathName.indexOf("/tours") !== -1 || /\/tours\.html?$/.test(pathName)) {
      return { ids: ["airport", "terelj", "esim"], variant: "compact", place: "hero-or-band" };
    }
    return null;
  }

  function placeInHero(hero) {
    var slot = document.createElement("div");
    var content = hero.querySelector(".hero-content");
    if (content && content.parentNode) {
      content.parentNode.insertBefore(slot, content.nextSibling);
      return slot;
    }
    var inner = hero.querySelector(".wrap, .hero-inner, .container");
    (inner || hero).appendChild(slot);
    return slot;
  }

  function placeBand(after) {
    var band = document.createElement("div");
    band.className = "bm-services-band";
    after.insertAdjacentElement("afterend", band);
    var slot = document.createElement("div");
    band.appendChild(slot);
    return slot;
  }

  function mountAuto() {
    var plan = planFor(window.location && window.location.pathname);
    if (!plan) return;
    if (plan.place === "hero") {
      var hero = document.querySelector(".hero");
      if (!hero) return;
      render(placeInHero(hero), plan.ids, plan.variant);
      return;
    }
    if (plan.place === "band") {
      var head = document.querySelector(".section-head");
      if (!head) return;
      render(placeBand(head), plan.ids, plan.variant);
      return;
    }
    if (plan.place === "hero-or-band" || plan.place === "hero-or-title") {
      var pageHero = document.querySelector(".hero");
      if (pageHero) {
        render(placeInHero(pageHero), plan.ids, plan.variant);
        return;
      }
      var anchor = document.querySelector(".section-head") || document.querySelector("h1");
      if (!anchor) return;
      render(placeBand(anchor), plan.ids, plan.variant);
    }
  }

  function mount() {
    var slots = document.querySelectorAll("[data-bm-services]");
    if (slots.length) {
      Array.prototype.forEach.call(slots, function (slot) {
        var variant = slot.getAttribute("data-bm-variant") === "home" ? "home" : "compact";
        render(slot, idsFrom(slot.getAttribute("data-bm-services")), variant);
      });
      return;
    }
    mountAuto();
  }

  function boot() {
    bindLang();
    if (booted) return;
    booted = true;
    mount();
  }

  window.BMServices = {
    services: services,
    copy: copy,
    render: render,
    refresh: refresh
  };

  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    document.addEventListener("DOMContentLoaded", bindLang);
  }
})();
