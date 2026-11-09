/**
 * Booking Mongolia gallery: load published photos from Supabase
 * and accept new photo + caption submissions from the public form.
 */
(function (global) {
  var SUPABASE_URL = "https://ebpjetcuabubihzximbb.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_3F9zG4HoMOCgU4yHvUkiKw_h5VTeeRF";
  var CLOUDINARY_CLOUD_NAME = "dflwo8gmz";
  var CLOUDINARY_UPLOAD_PRESET = "unsigned_upload";
  var CLOUDINARY_FOLDER = "bookingmongolia/gallery";

  function getClient() {
    if (!global.supabase || typeof global.supabase.createClient !== "function") return null;
    if (!global.BMGalleryClient) {
      global.BMGalleryClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return global.BMGalleryClient;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function isBadText(text) {
    var value = String(text || "").toLowerCase();
    var blocked = ["casino", "porn", "sex", "crypto giveaway", "viagra"];
    var links = (value.match(/https?:\/\//g) || []).length;
    return links > 1 || blocked.some(function (word) { return value.indexOf(word) !== -1; });
  }

  function showNotice(message, type) {
    var el = document.getElementById("gallery-notice");
    if (!el) return;
    el.className = "notice " + (type || "success");
    el.textContent = message;
  }

  function urlsFromItem(item) {
    var urls = [];
    if (Array.isArray(item.image_urls)) urls = item.image_urls.slice();
    else if (typeof item.image_urls === "string" && item.image_urls.trim()) {
      try {
        var parsed = JSON.parse(item.image_urls);
        if (Array.isArray(parsed)) urls = parsed;
      } catch (e) {
        urls = item.image_urls.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      }
    }
    if (item.image_url) urls.unshift(item.image_url);
    var seen = {};
    return urls.filter(function (url) {
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }

  function openLightbox(src) {
    if (!src) return;
    if (typeof global.openImageLightbox === "function" && document.getElementById("image-lightbox")) {
      global.openImageLightbox(src);
      return;
    }
    var modal = document.getElementById("image-lightbox");
    var img = document.getElementById("image-lightbox-img");
    if (!modal || !img) return;
    img.src = src;
    modal.classList.add("open");
  }

  function closeLightbox() {
    if (typeof global.closeImageLightbox === "function") {
      global.closeImageLightbox();
      return;
    }
    var modal = document.getElementById("image-lightbox");
    if (modal) modal.classList.remove("open");
  }

  function bindLightboxClicks(root) {
    (root || document).querySelectorAll("#gallery-grid img, #gallery .gallery-grid img").forEach(function (img) {
      if (img.dataset.galleryBound) return;
      img.dataset.galleryBound = "1";
      img.style.cursor = "pointer";
      img.addEventListener("click", function () {
        openLightbox(img.currentSrc || img.src);
      });
    });
  }

  function renderCard(item) {
    var urls = urlsFromItem(item);
    var cover = urls[0];
    if (!cover) return "";
    var title = item.title || item.caption || "";
    var text = item.description || (item.caption && item.caption !== title ? item.caption : "");
    var who = item.photographer_name || "";
    return (
      '<figure class="gallery-card">' +
        '<img src="' + escapeAttr(cover) + '" alt="' + escapeAttr(title || "Mongolia gallery photo") + '">' +
        (title || text || who
          ? '<figcaption>' +
              (title ? "<strong>" + escapeHtml(title) + "</strong>" : "") +
              (text ? "<p>" + escapeHtml(text) + "</p>" : "") +
              (who ? '<span class="who">' + escapeHtml(who) + "</span>" : "") +
            "</figcaption>"
          : "") +
      "</figure>"
    );
  }

  async function loadGallery() {
    var grid = document.getElementById("gallery-grid");
    if (!grid) return;
    var client = getClient();
    bindLightboxClicks(grid);
    startFilm();
    if (!client) return;

    var result = await client
      .from("gallery_items")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(120);

    if (result.error) {
      console.error("loadGallery error:", result.error);
      bindLightboxClicks(grid);
      startFilm();
      return;
    }

    var html = (result.data || []).map(renderCard).filter(Boolean).join("");
    grid.querySelectorAll("[data-gallery-live]").forEach(function (el) { el.remove(); });
    var marker = grid.querySelector("[data-gallery-live-start]");
    if (!marker) {
      marker = document.createElement("span");
      marker.setAttribute("data-gallery-live-start", "1");
      marker.hidden = true;
      grid.insertBefore(marker, grid.firstChild);
    }
    if (html) {
      marker.insertAdjacentHTML("afterend", html.replace(/<figure /g, '<figure data-gallery-live="1" '));
    }
    bindLightboxClicks(grid);
    startFilm();
  }

  var filmFrame = 0;

  function photoList(grid) {
    var seen = {};
    var list = [];
    grid.querySelectorAll("img").forEach(function (img) {
      var src = img.getAttribute("src");
      if (!src || seen[src]) return;
      seen[src] = true;
      var alt = img.getAttribute("alt") || "";
      if (/^Mongolia gallery \d+$/.test(alt)) alt = "";
      list.push({ src: src, alt: alt });
    });
    return list;
  }

  function framePhotos(grid) {
    var i = 0;
    Array.from(grid.querySelectorAll(":scope > img")).forEach(function (img) {
      var frame = document.createElement("div");
      frame.className = "gallery-frame";
      img.parentNode.insertBefore(frame, img);
      frame.appendChild(img);
      img.style.animationDelay = (-(i % 9) * 0.8) + "s";
      i += 1;
    });
    grid.querySelectorAll(".gallery-card img").forEach(function (img) {
      if (!img.style.animationDelay) img.style.animationDelay = (-(i % 9) * 0.8) + "s";
      i += 1;
    });
  }

  function startFilm() {
    var grid = document.getElementById("gallery-grid");
    if (!grid) return;
    framePhotos(grid);
    var photos = photoList(grid);
    if (!photos.length) return;

    var host = document.getElementById("gallery-film");
    if (!host) {
      host = document.createElement("div");
      host.id = "gallery-film";
      host.className = "gallery-film";
      grid.parentNode.insertBefore(host, grid);
    }
    var key = photos.map(function (photo) { return photo.src; }).join("|");
    if (host.dataset.key === key) return;
    host.dataset.key = key;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stage = document.createElement("div");
    stage.className = "gallery-stage";
    var caption = document.createElement("p");
    caption.className = "gallery-caption";
    photos.forEach(function (photo, index) {
      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt || "Mongolia";
      img.setAttribute("data-slide", String(index));
      if (index === 0) img.className = "is-on";
      img.addEventListener("click", function () { openLightbox(photo.src); });
      stage.appendChild(img);
    });
    caption.textContent = photos[0].alt || "Mongolia";
    stage.appendChild(caption);

    var wrap = document.createElement("div");
    wrap.className = "gallery-strip-wrap";
    var strip = document.createElement("div");
    strip.className = "gallery-strip";
    photos.concat(photos).forEach(function (photo, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumb";
      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = index < photos.length ? (photo.alt || "Mongolia") : "";
      button.appendChild(img);
      if (photo.alt) {
        var label = document.createElement("span");
        label.textContent = photo.alt;
        button.appendChild(label);
      }
      button.addEventListener("click", function () { openLightbox(photo.src); });
      strip.appendChild(button);
    });
    wrap.appendChild(strip);
    host.replaceChildren(stage, wrap);

    if (filmFrame) cancelAnimationFrame(filmFrame);
    filmFrame = 0;
    if (reduce || photos.length < 2) return;

    var x = 0;
    var elapsed = 0;
    var index = 0;
    var last = performance.now();
    var tick = function (now) {
      var dt = Math.min(32, now - last);
      last = now;
      elapsed += dt;
      var half = strip.scrollWidth / 2;
      if (half > 0) {
        x -= dt * 0.09;
        if (-x >= half) x += half;
        strip.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      }
      var slides = stage.querySelectorAll("[data-slide]");
      var on = stage.querySelector(".is-on");
      if (on) {
        var wave = (Math.sin(now / 1400) + 1) / 2;
        on.style.transform = "scale(" + (1.12 + wave * 0.1).toFixed(3) + ") translate3d(" + ((wave - 0.5) * 8).toFixed(2) + "%," + ((0.5 - wave) * 4).toFixed(2) + "%,0)";
      }
      strip.querySelectorAll("img").forEach(function (img, item) {
        var wave = (Math.sin(now / 1400 + item * 0.55) + 1) / 2;
        img.style.transform = "scale(" + (1.12 + wave * 0.08).toFixed(3) + ") translate3d(" + ((wave - 0.5) * 6).toFixed(2) + "%," + ((0.5 - wave) * 3).toFixed(2) + "%,0)";
      });
      if (elapsed >= 2600) {
        elapsed = 0;
        index = (index + 1) % photos.length;
        slides.forEach(function (img, item) {
          img.classList.toggle("is-on", item === index);
          if (item !== index) img.style.transform = "";
        });
        caption.textContent = photos[index].alt || "Mongolia";
      }
      filmFrame = requestAnimationFrame(tick);
    };
    filmFrame = requestAnimationFrame(tick);
  }

  async function uploadImages(files) {
    var urls = [];
    for (var i = 0; i < files.length; i += 1) {
      var formData = new FormData();
      formData.append("file", files[i]);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", CLOUDINARY_FOLDER);
      var response = await fetch("https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload", {
        method: "POST",
        body: formData
      });
      var result = await response.json();
      if (!response.ok || !result || !result.secure_url) {
        throw new Error((result && result.error && result.error.message) || "Image upload failed.");
      }
      urls.push(result.secure_url);
    }
    return urls;
  }

  async function submitGallery(e) {
    e.preventDefault();
    var client = getClient();
    if (!client) {
      showNotice("Gallery is not connected yet. Please try again shortly.", "error");
      return;
    }

    var name = (document.getElementById("gallery_name") || {}).value || "";
    var title = (document.getElementById("gallery_title") || {}).value || "";
    var description = (document.getElementById("gallery_description") || {}).value || "";
    var input = document.getElementById("gallery_images");
    var files = Array.from((input && input.files) || []);

    name = String(name).trim().slice(0, 80);
    title = String(title).trim().slice(0, 120);
    description = String(description).trim().slice(0, 600);

    if (!title || title.length < 3) {
      showNotice("Please add a short caption for the photo.", "error");
      return;
    }
    if (!files.length) {
      showNotice("Please choose at least one photo.", "error");
      return;
    }
    if (files.length > 8) {
      showNotice("Please upload up to 8 photos at a time.", "error");
      return;
    }
    if (isBadText(title + " " + description)) {
      showNotice("Please remove links or inappropriate words from the caption.", "error");
      return;
    }

    showNotice("Uploading photos now...", "success");
    var urls;
    try {
      urls = await uploadImages(files);
    } catch (uploadError) {
      console.error("gallery upload error:", uploadError);
      showNotice((uploadError && uploadError.message) || "Image upload failed. Try a smaller photo.", "error");
      return;
    }

    var payload = {
      title: title,
      caption: title,
      description: description,
      photographer_name: name,
      image_url: urls[0],
      image_urls: urls,
      status: "published"
    };

    var inserted = await client.from("gallery_items").insert([payload]);
    if (inserted.error) {
      console.error("gallery insert error:", inserted.error);
      showNotice(inserted.error.message || "Could not save to Gallery. Check the Supabase gallery_items table.", "error");
      return;
    }

    e.target.reset();
    showNotice("Photo added to the Gallery.", "success");
    setUploadOpen(false);
    loadGallery();
  }

  function setUploadOpen(open) {
    var panel = document.getElementById("gallery-upload-panel");
    var toggle = document.getElementById("gallery-upload-toggle");
    if (!panel || !toggle) return;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.classList.toggle("is-open", !!open);
    if (open) {
      var first = panel.querySelector("#gallery_images, #gallery_title, input, textarea");
      if (first && typeof first.focus === "function") {
        setTimeout(function () { first.focus(); }, 50);
      }
    }
  }

  function initUploadToggle() {
    var toggle = document.getElementById("gallery-upload-toggle");
    var cancel = document.getElementById("gallery-upload-cancel");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        setUploadOpen(!open);
      });
    }
    if (cancel) {
      cancel.addEventListener("click", function () {
        setUploadOpen(false);
      });
    }
    if (location.hash === "#add-photo") {
      setUploadOpen(true);
      var anchor = document.getElementById("add-photo");
      if (anchor && anchor.scrollIntoView) {
        setTimeout(function () { anchor.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
      }
    }
  }

  function init() {
    bindLightboxClicks(document);
    initUploadToggle();
    var form = document.getElementById("gallery-form");
    if (form) form.addEventListener("submit", submitGallery);
    var lightbox = document.getElementById("image-lightbox");
    if (lightbox && !lightbox.dataset.galleryBound) {
      lightbox.dataset.galleryBound = "1";
      lightbox.addEventListener("click", closeLightbox);
      var closeBtn = lightbox.querySelector(".image-lightbox-close");
      if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    }
    loadGallery();
  }

  global.BMGallery = {
    loadGallery: loadGallery,
    openLightbox: openLightbox
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
