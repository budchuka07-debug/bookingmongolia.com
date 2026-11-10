(function (global) {
  var SUPABASE_URL = "https://ebpjetcuabubihzximbb.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_3F9zG4HoMOCgU4yHvUkiKw_h5VTeeRF";
  var CLOUDINARY_CLOUD_NAME = "dflwo8gmz";
  var CLOUDINARY_UPLOAD_PRESET = "unsigned_upload";
  var CLOUDINARY_FOLDER = "bookingmongolia/brand-store";
  var CATEGORIES = [
    { slug: "cashmere", image: "/images/hero/hero-nomadic-mongolia.webp", title: "Mongolian Cashmere", text: "Sweaters, scarves, shawls, coats and wool accessories from Mongolian makers." },
    { slug: "leather-crafts", image: "/images/experiences/exp-nomadic-life.webp", title: "Leather & Handmade Crafts", text: "Leather bags, wallets, belts and traditional handmade work." },
    { slug: "art-crafts", image: "/images/destinations/hustai.webp", title: "Mongolian Art & Crafts", text: "Paintings, felt art, traditional artwork and artisan pieces." },
    { slug: "ger-home", image: "/images/destinations/dest-khuvsgul-lake.webp", title: "Mongolian Ger & Home", text: "Ger models, home decorations and cultural pieces for a room." },
    { slug: "traditional-clothing", image: "/images/hero/hero-horse-riders.webp", title: "Traditional Mongolian Clothing", text: "Deel, traditional clothing, modern Mongolian fashion and accessories." },
    { slug: "gifts-souvenirs", image: "/images/destinations/bayanzag.webp", title: "Mongolian Gifts & Souvenirs", text: "Gifts and handmade souvenirs that can travel home." }
  ];

  function t(key) {
    return global.BMStoreI18n ? global.BMStoreI18n.t(key) : key;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch];
    });
  }

  function client() {
    if (!global.supabase || typeof global.supabase.createClient !== "function") return null;
    if (!global.BMStoreClient) global.BMStoreClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return global.BMStoreClient;
  }

  function category(slug) {
    return CATEGORIES.filter(function (item) { return item.slug === slug; })[0] || null;
  }

  function images(product) {
    var list = Array.isArray(product.image_urls) ? product.image_urls : [];
    return list.filter(function (url) { return /^https:\/\//i.test(String(url || "")); });
  }

  function money(product) {
    if (product.price_amount == null || product.price_amount === "") return t("price_unset");
    var amount = Number(product.price_amount);
    if (!Number.isFinite(amount)) return t("price_unset");
    return (product.price_currency || "USD") + " " + amount.toLocaleString("en-US");
  }

  function productLink(product) {
    return "/brand-store/product/" + encodeURIComponent(product.slug);
  }

  async function publishedProducts(slug) {
    var db = client();
    if (!db) return [];
    var query = db.from("brand_products").select("id,slug,category_slug,name,description,price_amount,price_currency,brand_name,origin,materials,sizes,colors,image_urls,stock_status,shipping_note").eq("status", "published").order("created_at", { ascending: false }).limit(24);
    if (slug) query = query.eq("category_slug", slug);
    var result = await query;
    if (result.error || !Array.isArray(result.data)) return [];
    return result.data.filter(function (row) { return row.origin === "Mongolia"; });
  }

  function card(product) {
    var cover = images(product)[0] || "";
    var photo = cover
      ? '<img src="' + esc(cover) + '" alt="' + esc(product.name) + '">'
      : '<div class="ph"></div>';
    return '<article class="store-card">' + photo +
      '<div><p class="store-origin">' + esc(t("origin")) + '</p><h3>' + esc(product.name) + '</h3>' +
      '<p>' + esc(product.description) + '</p><p class="store-price">' + esc(money(product)) + '</p>' +
      '<p class="store-brand">' + esc(product.brand_name || "") + '</p>' +
      '<a class="store-btn dark" href="' + esc(productLink(product)) + '">' + esc(t("view")) + '</a></div></article>';
  }

  function renderProducts(list, target) {
    if (!target) return;
    if (!list.length) {
      target.innerHTML = '<div class="store-empty">' + esc(t("empty_products")) + '</div>';
      return;
    }
    target.innerHTML = list.map(card).join("");
  }

  async function renderBrands() {
    var target = document.getElementById("store-brands");
    if (!target) return;
    var db = client();
    var rows = [];
    if (db) {
      var result = await db.from("brand_sellers_public").select("id,brand_name,category,product_description,production_location").limit(6);
      if (!result.error && Array.isArray(result.data)) rows = result.data;
    }
    if (!rows.length) {
      target.innerHTML = '<div class="store-empty">' + esc(t("brands_empty")) + '</div>';
      return;
    }
    target.innerHTML = rows.map(function (row) {
      var cat = category(row.category);
      return '<article class="store-brand-card"><p class="store-origin">' + esc(t("origin")) + '</p><h3>' + esc(row.brand_name) + '</h3><p>' + esc(cat ? cat.title : row.category) + '</p><p>' + esc(row.product_description) + '</p><p>' + esc(row.production_location) + '</p></article>';
    }).join("");
  }

  function choices(label, values, name) {
    var list = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!list.length) return '<p>' + esc(label) + '</p>';
    return '<p>' + esc(name) + '</p><div class="store-choice">' + list.map(function (value, index) {
      return '<button type="button" data-choice="' + esc(name) + '" aria-pressed="' + (index === 0 ? "true" : "false") + '">' + esc(value) + '</button>';
    }).join("") + '</div>';
  }

  async function fetchProduct(slug) {
    var db = client();
    if (!db || !slug) return null;
    var result = await db.from("brand_products").select("id,slug,category_slug,name,description,price_amount,price_currency,brand_name,origin,materials,sizes,colors,image_urls,stock_status,shipping_note").eq("slug", slug).eq("status", "published").maybeSingle();
    if (result.error || !result.data || result.data.origin !== "Mongolia") return null;
    return result.data;
  }

  async function renderProduct() {
    var root = document.getElementById("store-product");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    var slug = params.get("slug") || "";
    if (!slug) {
      var parts = location.pathname.split("/").filter(Boolean);
      slug = decodeURIComponent(parts[parts.length - 1] || "");
      if (slug === "product.html" || slug === "product") slug = "";
    }
    var product = await fetchProduct(slug);
    if (!product) {
      root.innerHTML = '<div class="store-empty"><h1>' + esc(t("no_product")) + '</h1><p>' + esc(t("empty_products")) + '</p><a class="store-btn dark" href="/brand-store">' + esc(t("hero_cta")) + '</a></div>';
      return;
    }
    document.title = product.name + " | Mongolia Brand Store";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", product.description.slice(0, 180));
    var gallery = images(product);
    var main = gallery[0] ? '<img id="store-main-photo" src="' + esc(gallery[0]) + '" alt="' + esc(product.name) + '">' : '<div class="ph" style="min-height:320px;border-radius:24px"></div>';
    var thumbs = gallery.map(function (url, index) {
      return '<button type="button" data-photo="' + esc(url) + '" aria-label="' + esc(product.name) + ' ' + (index + 1) + '"><img src="' + esc(url) + '" alt=""></button>';
    }).join("");
    var canSave = product.price_amount != null && product.stock_status !== "out_of_stock";
    root.innerHTML = '<div class="store-product"><div class="store-gallery">' + main + '<div class="store-thumbs">' + thumbs + '</div></div><div>' +
      '<p class="store-origin">' + esc(t("origin")) + '</p><h1>' + esc(product.name) + '</h1>' +
      '<p class="store-price">' + esc(money(product)) + '</p><p>' + esc(product.description) + '</p>' +
      choices(t("sizes_empty"), product.sizes, t("sizes")) +
      choices(t("colors_empty"), product.colors, t("colors")) +
      '<p><strong>' + esc(t("materials")) + '</strong><br>' + esc(product.materials || "—") + '</p>' +
      '<p><strong>' + esc(t("stock")) + '</strong><br>' + esc(product.stock_status || "unlisted") + '</p>' +
      '<p><strong>' + esc(t("shipping")) + '</strong><br>' + esc(product.shipping_note || t("shipping_fallback")) + '</p>' +
      '<p class="store-brand">' + esc(product.brand_name) + ' · ' + esc(product.origin || "Mongolia") + '</p>' +
      '<div class="store-actions"><button class="store-btn dark" type="button" id="store-add"' + (canSave ? "" : " disabled") + '>' + esc(t("add")) + '</button>' +
      '<a class="store-btn" href="#store-inquiry">' + esc(t("inquire")) + '</a></div>' +
      '<p class="store-note">' + esc(t("not_order")) + '</p>' +
      '<form id="store-inquiry" class="store-form" style="margin-top:18px"><label class="full">Name<input name="name" required></label><label class="full">Email<input name="email" type="email" required></label><label class="full">Message<textarea name="message" rows="4" required></textarea></label><button class="store-btn dark full" type="submit">' + esc(t("inquire")) + '</button><p id="store-inquiry-note" class="full"></p></form></div></div>';
    root.querySelectorAll("[data-photo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var photo = document.getElementById("store-main-photo");
        if (photo) photo.src = btn.getAttribute("data-photo");
      });
    });
    root.querySelectorAll("[data-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        root.querySelectorAll('[data-choice="' + btn.getAttribute("data-choice") + '"]').forEach(function (peer) {
          peer.setAttribute("aria-pressed", peer === btn ? "true" : "false");
        });
      });
    });
    var add = document.getElementById("store-add");
    if (add) add.addEventListener("click", function () { saveLocal(product); });
    var form = document.getElementById("store-inquiry");
    if (form) form.addEventListener("submit", function (event) { submitInquiry(event, product); });
  }

  function readCart() {
    try { return JSON.parse(localStorage.getItem("bm_brand_cart") || "[]"); } catch (e) { return []; }
  }

  function saveLocal(product) {
    var cart = readCart().filter(function (item) { return item.slug !== product.slug; });
    cart.push({ slug: product.slug, name: product.name, price: money(product), brand: product.brand_name });
    localStorage.setItem("bm_brand_cart", JSON.stringify(cart.slice(-12)));
    renderCart(true);
  }

  function renderCart(open) {
    var box = document.getElementById("store-cart");
    if (!box) return;
    var cart = readCart();
    if (open) box.hidden = false;
    var lines = cart.length ? cart.map(function (item) {
      return '<li>' + esc(item.name) + ' · ' + esc(item.price) + '</li>';
    }).join("") : '<li>' + esc(t("cart_empty")) + '</li>';
    box.innerHTML = '<strong>' + esc(t("cart")) + '</strong><ul>' + lines + '</ul><p>' + esc(t("not_order")) + '</p><button type="button" id="store-cart-close">Close</button>';
    var close = document.getElementById("store-cart-close");
    if (close) close.addEventListener("click", function () { box.hidden = true; });
  }

  async function submitInquiry(event, product) {
    event.preventDefault();
    var note = document.getElementById("store-inquiry-note");
    var data = new FormData(event.target);
    var db = client();
    if (!db) {
      note.textContent = t("fail");
      return;
    }
    var result = await db.from("brand_inquiries").insert({
      product_id: product.id,
      name: String(data.get("name") || "").trim().slice(0, 120),
      email: String(data.get("email") || "").trim().slice(0, 160),
      message: String(data.get("message") || "").trim().slice(0, 2000),
      status: "pending"
    });
    note.textContent = result.error ? t("fail") : t("inquiry_sent");
    if (!result.error) event.target.reset();
  }

  async function uploadImages(files) {
    var urls = [];
    for (var i = 0; i < Math.min(files.length, 6); i += 1) {
      var form = new FormData();
      form.append("file", files[i]);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("folder", CLOUDINARY_FOLDER);
      var response = await fetch("https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload", { method: "POST", body: form });
      var body = await response.json();
      if (!response.ok || !body.secure_url) throw new Error((body.error && body.error.message) || "Image upload failed");
      urls.push(body.secure_url);
    }
    return urls;
  }

  function bindSeller() {
    var form = document.getElementById("seller-form");
    if (!form) return;
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var note = document.getElementById("seller-note");
      var data = new FormData(form);
      if (!form.querySelector('[name="made_in_mongolia"]').checked) {
        note.textContent = t("confirm_origin");
        return;
      }
      note.textContent = "Saving…";
      try {
        var photos = await uploadImages(form.querySelector('[name="images"]').files || []);
        var db = client();
        if (!db) throw new Error("offline");
        var result = await db.from("brand_sellers").insert({
          brand_name: String(data.get("brand_name") || "").trim().slice(0, 140),
          contact_name: String(data.get("contact_name") || "").trim().slice(0, 140),
          email: String(data.get("email") || "").trim().slice(0, 160),
          phone: String(data.get("phone") || "").trim().slice(0, 40),
          category: String(data.get("category") || ""),
          product_description: String(data.get("product_description") || "").trim().slice(0, 4000),
          website: String(data.get("website") || "").trim().slice(0, 240),
          facebook: String(data.get("facebook") || "").trim().slice(0, 240),
          instagram: String(data.get("instagram") || "").trim().slice(0, 240),
          image_urls: photos,
          production_location: String(data.get("production_location") || "").trim().slice(0, 180),
          made_in_mongolia: true,
          status: "pending"
        });
        if (result.error) throw result.error;
        note.textContent = t("sent");
        form.reset();
      } catch (error) {
        note.textContent = t("fail");
      }
    });
  }

  async function refresh() {
    var page = document.querySelector("[data-store-page]");
    if (!page) return;
    var kind = page.getAttribute("data-store-page");
    if (kind === "home") {
      renderProducts(await publishedProducts(), document.getElementById("store-products"));
      await renderBrands();
    }
    if (kind === "category") {
      renderProducts(await publishedProducts(page.getAttribute("data-category")), document.getElementById("store-products"));
    }
    if (kind === "product") await renderProduct();
  }

  function init() {
    bindSeller();
    var cartBtn = document.getElementById("store-cart-open");
    if (cartBtn) cartBtn.addEventListener("click", function () { renderCart(true); });
    refresh();
  }

  global.BMStore = { refresh: refresh, categories: CATEGORIES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);
