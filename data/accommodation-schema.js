/**
 * Booking Mongolia — accommodation directory schema helpers
 * Normalizes Supabase rows + seed rows into one editable shape.
 * Extra fields survive in DB via details_json column OR [[BM_META]]...[[/BM_META]] in description.
 */
(function (root) {
  var PROPERTY_TYPES = [
    "Hotel",
    "Guesthouse",
    "Hostel",
    "Tourist Ger Camp",
    "Ger Camp",
    "Resort",
    "Lodge",
    "Apartment",
    "Homestay",
    "Nomadic Family Stay"
  ];

  var AIMAGS = [
    "Ulaanbaatar",
    "Arkhangai",
    "Bayan-Ulgii",
    "Bayankhongor",
    "Bulgan",
    "Darkhan-Uul",
    "Dornod",
    "Dornogovi",
    "Dundgovi",
    "Govi-Altai",
    "Govisumber",
    "Khentii",
    "Khovd",
    "Khuvsgul",
    "Orkhon",
    "Selenge",
    "Sukhbaatar",
    "Tuv",
    "Umnugovi",
    "Uvs",
    "Uvurkhangai",
    "Zavkhan"
  ];

  var DESTINATIONS = [
    "Ulaanbaatar",
    "Terelj",
    "Khustain / Hustai",
    "Kharkhorum / Orkhon",
    "Gobi Desert",
    "Khuvsgul Lake",
    "Altai / Bayan-Ulgii",
    "Central Mongolia",
    "Northern Mongolia",
    "Western Mongolia",
    "Eastern Mongolia"
  ];

  function truthy(v) {
    if (v === true || v === 1 || v === "1" || v === "true" || v === "yes" || v === "Yes") return true;
    if (v === false || v === 0 || v === "0" || v === "false" || v === "no" || v === "No") return false;
    return null;
  }

  function parseMaybeJson(value) {
    if (value == null || value === "") return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try { return JSON.parse(value); } catch (e) { return null; }
  }

  function extractMetaFromDescription(description) {
    var text = String(description || "");
    var match = text.match(/\[\[BM_META\]\]([\s\S]*?)\[\[\/BM_META\]\]/);
    if (!match) return { cleanDescription: text.trim(), meta: {} };
    var meta = parseMaybeJson(match[1].trim()) || {};
    var clean = text.replace(match[0], "").trim();
    return { cleanDescription: clean, meta: meta };
  }

  function encodeMetaIntoDescription(description, meta) {
    var clean = String(description || "").replace(/\[\[BM_META\]\][\s\S]*?\[\[\/BM_META\]\]/g, "").trim();
    var payload = JSON.stringify(meta || {});
    return clean + "\n\n[[BM_META]]" + payload + "[[/BM_META]]";
  }

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      var parsed = parseMaybeJson(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      return value.split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return [];
  }

  function priceNumber(value) {
    if (typeof value === "number" && !isNaN(value)) return value;
    var m = String(value || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : null;
  }

  /** Agency display margin on starting/from prices (partner base × this). */
  var PRICE_MARGIN = 1.2;

  function applyMarginToPriceLabel(label, margin, markedPrice) {
    var s = String(label || "").trim();
    if (markedPrice == null) return s;
    if (!s) return "From $" + markedPrice + " / night";
    if (/\$\s*\d/.test(s)) {
      return s.replace(/\$\s*\d+(?:\.\d+)?/, function () { return "$" + markedPrice; });
    }
    if (/\d/.test(s)) {
      return s.replace(/\d+(?:\.\d+)?/, String(markedPrice));
    }
    return "From $" + markedPrice + " / night";
  }

  function normalizeProperty(raw) {
    raw = raw || {};
    var fromDesc = extractMetaFromDescription(raw.description);
    var details = parseMaybeJson(raw.details_json) || parseMaybeJson(raw.details) || parseMaybeJson(raw.amenities_json) || {};
    var meta = Object.assign({}, fromDesc.meta, details);

    var amenities = asArray(raw.amenities || meta.amenities);
    var roomTypes = asArray(raw.room_types || meta.room_types);
    var reviews = asArray(raw.reviews || meta.reviews);

    var privateBath = truthy(raw.private_bathroom != null ? raw.private_bathroom : meta.private_bathroom);
    var wifi = truthy(raw.wifi != null ? raw.wifi : meta.wifi);
    var breakfast = truthy(raw.breakfast != null ? raw.breakfast : meta.breakfast);
    var shower = truthy(raw.shower != null ? raw.shower : meta.shower);
    var electricity = truthy(raw.electricity != null ? raw.electricity : meta.electricity);
    var parking = truthy(raw.parking != null ? raw.parking : meta.parking);

    var aimag = raw.aimag || meta.aimag || "";
    var soum = raw.soum || meta.soum || "";
    var destination = raw.destination || meta.destination || "";
    var location = raw.location || [soum, aimag].filter(Boolean).join(", ") || destination || "";

    var lat = raw.latitude != null ? raw.latitude : (meta.latitude != null ? meta.latitude : raw.lat);
    var lng = raw.longitude != null ? raw.longitude : (meta.longitude != null ? meta.longitude : raw.lng);

    var mapsUrl = raw.google_maps_url || meta.google_maps_url || "";
    if (!mapsUrl && lat != null && lng != null && lat !== "" && lng !== "") {
      mapsUrl = "https://www.google.com/maps?q=" + encodeURIComponent(lat + "," + lng);
    }

    var propertyType = raw.property_type || meta.property_type || "Hotel";
    // Treat legacy "Ger Camp" / "Tourist Camp" as tourist ger camp for filters
    var isTouristGer =
      /tourist\s*ger|ger\s*camp|tourist\s*camp/i.test(propertyType) ||
      truthy(raw.tourist_ger_camp != null ? raw.tourist_ger_camp : meta.tourist_ger_camp) === true;

    var rawPriceLabel = raw.price || meta.price || "";
    // Idempotent: loadHotels may normalize twice
    var alreadyMarked = raw._price_margin_applied === true;
    var basePrice = alreadyMarked
      ? priceNumber(raw.price_base != null ? raw.price_base : meta.price_base)
      : priceNumber(
          raw.price_from != null
            ? raw.price_from
            : (meta.price_from != null ? meta.price_from : rawPriceLabel)
        );
    var displayPrice = alreadyMarked && raw.price_from != null
      ? priceNumber(raw.price_from)
      : (basePrice != null ? Math.round(basePrice * PRICE_MARGIN) : null);
    var priceLabel = alreadyMarked && rawPriceLabel
      ? rawPriceLabel
      : applyMarginToPriceLabel(rawPriceLabel, PRICE_MARGIN, displayPrice);

    var gallery = asArray(raw.gallery_urls || meta.gallery_urls);
    var mainImg = raw.main_image_url || raw.image_url || "";
    if (mainImg && gallery.indexOf(mainImg) === -1) gallery = [mainImg].concat(gallery);

    return {
      id: raw.id,
      name: raw.name || "Accommodation",
      property_type: propertyType,
      aimag: aimag,
      soum: soum,
      destination: destination || location,
      location: location,
      latitude: lat,
      longitude: lng,
      google_maps_url: mapsUrl,
      price: priceLabel,
      price_from: displayPrice,
      price_base: alreadyMarked && raw.price_base != null ? priceNumber(raw.price_base) : basePrice,
      _price_margin_applied: true,
      description: fromDesc.cleanDescription || raw.description || "",
      room_types: roomTypes,
      breakfast: breakfast,
      meals: raw.meals || meta.meals || "",
      private_bathroom: privateBath,
      shower: shower,
      electricity: electricity,
      wifi: wifi,
      mobile_signal: raw.mobile_signal || meta.mobile_signal || "",
      parking: parking,
      amenities: amenities,
      season: raw.season || meta.season || "",
      phone: raw.phone || meta.phone || "",
      email: raw.email || meta.email || "",
      contact_person: raw.contact_person || meta.contact_person || "",
      main_image_url: mainImg,
      image_url: raw.image_url || raw.main_image_url || "",
      gallery_urls: gallery,
      reviews: reviews,
      tourist_ger_camp: isTouristGer,
      status: raw.status || "approved",
      source: raw.source || "supabase",
      is_mock: !!raw.is_mock || raw.source === "mock",
      data_badge: raw.data_badge || (raw.is_mock || raw.source === "mock" ? "Sample listing" : "Verified"),
      _raw: raw
    };
  }

  function buildSubmissionPayload(formValues) {
    var meta = {
      aimag: formValues.aimag || "",
      soum: formValues.soum || "",
      destination: formValues.destination || "",
      room_types: asArray(formValues.room_types),
      breakfast: !!formValues.breakfast,
      meals: formValues.meals || "",
      private_bathroom: !!formValues.private_bathroom,
      shower: !!formValues.shower,
      electricity: !!formValues.electricity,
      wifi: !!formValues.wifi,
      mobile_signal: formValues.mobile_signal || "",
      parking: !!formValues.parking,
      amenities: asArray(formValues.amenities),
      season: formValues.season || "",
      google_maps_url: formValues.google_maps_url || "",
      price_from: priceNumber(formValues.price),
      tourist_ger_camp: /ger|tourist/i.test(formValues.property_type || ""),
      contact_person: formValues.contact_person || ""
    };

    var location = [formValues.soum, formValues.aimag].filter(Boolean).join(", ") ||
      formValues.destination ||
      formValues.location ||
      "";

    return {
      name: formValues.name,
      property_type: formValues.property_type,
      location: location,
      price: formValues.price || "",
      email: formValues.email || "",
      phone: formValues.phone || "",
      latitude: formValues.latitude || null,
      longitude: formValues.longitude || null,
      image_url: formValues.image_url || "",
      main_image_url: formValues.main_image_url || formValues.image_url || "",
      gallery_urls: formValues.gallery_urls || [],
      description: encodeMetaIntoDescription(formValues.description || "", meta),
      details_json: JSON.stringify(meta),
      status: formValues.status || "pending"
    };
  }

  root.BMAccommodation = {
    PROPERTY_TYPES: PROPERTY_TYPES,
    AIMAGS: AIMAGS,
    DESTINATIONS: DESTINATIONS,
    PRICE_MARGIN: PRICE_MARGIN,
    normalizeProperty: normalizeProperty,
    buildSubmissionPayload: buildSubmissionPayload,
    encodeMetaIntoDescription: encodeMetaIntoDescription,
    extractMetaFromDescription: extractMetaFromDescription,
    priceNumber: priceNumber,
    asArray: asArray
  };
})(typeof window !== "undefined" ? window : this);
