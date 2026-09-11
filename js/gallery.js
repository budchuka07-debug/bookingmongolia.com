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
    if (!client) {
      bindLightboxClicks(grid);
      return;
    }

    var result = await client
      .from("gallery_items")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(120);

    if (result.error) {
      console.error("loadGallery error:", result.error);
      bindLightboxClicks(grid);
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
    loadGallery();
  }

  function init() {
    bindLightboxClicks(document);
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
