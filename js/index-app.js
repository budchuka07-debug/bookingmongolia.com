const SUPABASE_URL = "https://ebpjetcuabubihzximbb.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_3F9zG4HoMOCgU4yHvUkiKw_h5VTeeRF";

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("SUPABASE OK", supabaseClient);

  const fallbackImage = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
  const fallbackCarImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
  const fallbackReviewImage = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80';
  const CLOUDINARY_CLOUD_NAME = 'dflwo8gmz';
  const CLOUDINARY_UPLOAD_PRESET = 'unsigned_upload';
  const CLOUDINARY_BASE_FOLDER = 'bookingmongolia';

  function sanitizeFileName(name) {
    return String(name || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }


  async function uploadImageToCloudinary(file, folder = 'uploads') {
    if (!file) return '';

    const targetFolder = `${CLOUDINARY_BASE_FOLDER}/${folder}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', targetFolder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result?.secure_url) {
      throw new Error(result?.error?.message || 'Cloudinary image upload failed.');
    }

    return result.secure_url;
  }

  async function uploadMultipleImages(files, folder = 'uploads') {
    const urls = [];

    for (const file of files) {
      const url = await uploadImageToCloudinary(file, folder);
      if (url) urls.push(url);
    }

    return urls;
  }


  // Travel Hub uses a separate unsigned Cloudinary upload flow.
  // Do not use public_id, overwrite, use_filename, or filename_override here,
  // because unsigned presets can reject those parameters.
  async function uploadTravelHubImage(file, folder = 'travelhub') {
    if (!file) return '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_upload');
    formData.append('folder', `${CLOUDINARY_BASE_FOLDER}/${folder}`);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result?.secure_url) {
      throw new Error(result?.error?.message || 'Travel Hub image upload failed.');
    }

    return result.secure_url;
  }

  async function uploadTravelHubImages(files, folder = 'travelhub') {
    const urls = [];

    for (const file of files) {
      const url = await uploadTravelHubImage(file, folder);
      if (url) urls.push(url);
    }

    return urls;
  }

  function normalizeGalleryUrls(value, fallback = '') {
    const fallbackList = fallback ? [fallback].filter(Boolean) : [];

    const cleanUrls = (urls = []) => {
      const seen = new Set();
      return urls
        .flatMap(item => {
          if (!item) return [];
          if (Array.isArray(item)) return item;
          if (typeof item === 'object') {
            return [item.publicUrl, item.url, item.src, item.path].filter(Boolean);
          }
          return [String(item).trim()];
        })
        .map(item => item.trim())
        .filter(Boolean)
        .filter(item => {
          const normalized = item.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
          if (!normalized || seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        });
    };

    if (Array.isArray(value)) {
      const arr = cleanUrls(value);
      return arr.length ? arr : fallbackList;
    }

    if (value && typeof value === 'object') {
      const arr = cleanUrls([value.gallery_urls, value.main_image_url, value.image_url]);
      return arr.length ? arr : fallbackList;
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) return fallbackList;

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const arr = cleanUrls(parsed);
          return arr.length ? arr : fallbackList;
        }
        if (parsed && typeof parsed === 'object') {
          const arr = cleanUrls([parsed.gallery_urls, parsed.main_image_url, parsed.image_url, parsed]);
          return arr.length ? arr : fallbackList;
        }
      } catch (e) {}

      if (raw.startsWith('{') && raw.endsWith('}')) {
        const arr = cleanUrls(raw.slice(1, -1).split(','));
        return arr.length ? arr : fallbackList;
      }

      if (raw.includes(',') || raw.includes(';') || raw.includes('\n')) {
        const arr = cleanUrls(raw.split(/[,\n;]+/));
        return arr.length ? arr : fallbackList;
      }

      return cleanUrls([raw]).length ? cleanUrls([raw]) : fallbackList;
    }

    return fallbackList;
  }

  function openImageLightbox(src) {
    const modal = document.getElementById('image-lightbox');
    const img = document.getElementById('image-lightbox-img');
    if (!modal || !img || !src) return;
    img.src = src;
    modal.classList.add('open');
  }

  function closeImageLightbox() {
    const modal = document.getElementById('image-lightbox');
    if (!modal) return;
    modal.classList.remove('open');
  }

  function changeGalleryImage(cardId, imageUrl, thumb) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const mainImage = card.querySelector('.listing-main-image');
    if (mainImage) {
      mainImage.src = imageUrl;
      mainImage.setAttribute('onclick', `openImageLightbox('${String(imageUrl).replace(/'/g, "\'")}')`);
    }
    card.querySelectorAll('.listing-thumbs img').forEach(img => img.classList.remove('active'));
    if (thumb) thumb.classList.add('active');
  }

  function renderGalleryBlock(prefix, index, urls, fallback, alt) {
    const gallery = normalizeGalleryUrls(urls, fallback);
    const safeGallery = gallery.length ? gallery : [fallback];
    const cardId = `${prefix}-gallery-${index}`;
    const mainImg = safeGallery[0] || fallback;

    return `
      <div class="listing-gallery" id="${cardId}">
        <img src="${mainImg}" alt="${alt}" class="listing-main-image" onclick="openImageLightbox('${String(mainImg).replace(/'/g, "\'")}')" onerror="this.onerror=null;this.src='${fallback}'">
        ${safeGallery.length > 1 ? `
          <div class="listing-thumbs">
            ${safeGallery.map((img, imgIndex) => `
              <img src="${img}" alt="${alt} thumbnail ${imgIndex + 1}" class="${imgIndex === 0 ? 'active' : ''}" onclick="changeGalleryImage('${cardId}', '${String(img).replace(/'/g, "\'")}', this)" onerror="this.onerror=null;this.src='${fallback}'">
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  async function uploadImageToBucket(bucketName, file, folder = 'uploads') {
    return uploadImageToCloudinary(file, folder);
  }

  function showNotice(id, message, type = 'success') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `notice ${type}`;
    el.textContent = message;
  }

  

  function switchRegisterTab(tabName = 'hotel') {
    document.querySelectorAll('.register-tab').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-register-tab') === tabName);
    });
    document.querySelectorAll('.register-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`register-panel-${tabName}`)?.classList.add('active');
  }

  function openRegisterModal(tabName = 'hotel') {
    const modal = document.getElementById('register-modal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    switchRegisterTab(tabName);
  }

  function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }


  function initRegisterModalFallback() {
    const openBtn = document.getElementById('registerServiceBtn');
    const modal = document.getElementById('register-modal');
    if (openBtn && modal) {
      openBtn.addEventListener('click', function(event){
        event.preventDefault();
        openRegisterModal('hotel');
      });
    }
    if (modal) {
      modal.addEventListener('click', function(event){
        if (event.target === modal) closeRegisterModal();
      });
    }
  }

  function stars(n) {
    const count = Number(n || 0);
    return '★'.repeat(count) + '☆'.repeat(Math.max(0, 5 - count));
  }

  let hotelMap;
  let hotelMarkersLayer;
  let approvedHotels = [];

  const HOTEL_LOCATION_COORDS = {
    ulaanbaatar: [47.9184, 106.9177],
    ub: [47.9184, 106.9177],
    terelj: [47.9974, 107.4208],
    gobi: [43.5708, 104.4250],
    dalanzadgad: [43.5708, 104.4250],
    khuvsgul: [50.4364, 100.1544],
    khatgal: [50.4476, 100.1633],
    kharkhorin: [47.1975, 102.8238],
    karakorum: [47.1975, 102.8238],
    orkhoN: [46.9050, 102.7597],
    orkhon: [46.9050, 102.7597],
    "bayan-olgii": [48.9683, 89.9625],
    olgii: [48.9683, 89.9625],
    altai: [46.3722, 96.2583],
    murun: [49.6342, 100.1625]
  };

  function getHotelCoordinates(item) {
    const lat = Number(item.latitude ?? item.lat);
    const lng = Number(item.longitude ?? item.lng);

    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat && lng) {
      return [lat, lng];
    }

    const locationKey = String(item.location || '')
      .toLowerCase()
      .trim()
      .split(',')[0]
      .trim();

    return HOTEL_LOCATION_COORDS[locationKey] || null;
  }

  function ensureHotelMap() {
    if (hotelMap || !document.getElementById('hotel-map')) return;

    hotelMap = L.map('hotel-map', { scrollWheelZoom: true }).setView([47.9184, 106.9177], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(hotelMap);
    hotelMarkersLayer = L.layerGroup().addTo(hotelMap);
  }

  function populateHotelFilters(items) {
    const cityFilter = document.getElementById('hotel-city-filter');
    const typeFilter = document.getElementById('hotel-type-filter');
    const aimagFilter = document.getElementById('hotel-aimag-filter');
    const destinationFilter = document.getElementById('hotel-destination-filter');
    if (!cityFilter || !typeFilter) return;

    const schema = window.BMAccommodation || {};
    const cities = [...new Set(items.map(item => (item.soum || item.location || '').trim()).filter(Boolean))].sort();
    const aimags = [...new Set([
      ...(schema.AIMAGS || []),
      ...items.map(item => (item.aimag || '').trim()).filter(Boolean)
    ])].sort();
    const destinations = [...new Set([
      ...(schema.DESTINATIONS || []),
      ...items.map(item => (item.destination || '').trim()).filter(Boolean)
    ])].sort();
    const types = [...new Set([
      ...(schema.PROPERTY_TYPES || []),
      ...items.map(item => (item.property_type || '').trim()).filter(Boolean)
    ])];

    const keepCity = cityFilter.value;
    const keepType = typeFilter.value;
    const keepAimag = aimagFilter?.value || '';
    const keepDest = destinationFilter?.value || '';

    cityFilter.innerHTML = '<option value="">All areas</option>' + cities.map(city => `<option value="${city}">${city}</option>`).join('');
    typeFilter.innerHTML = '<option value="">All property types</option>' + types.map(type => `<option value="${type}">${type}</option>`).join('');
    if (aimagFilter) {
      aimagFilter.innerHTML = '<option value="">All aimags</option>' + aimags.map(a => `<option value="${a}">${a}</option>`).join('');
      aimagFilter.value = keepAimag;
    }
    if (destinationFilter) {
      destinationFilter.innerHTML = '<option value="">All destinations</option>' + destinations.map(d => `<option value="${d}">${d}</option>`).join('');
      destinationFilter.value = keepDest;
    }
    cityFilter.value = keepCity;
    typeFilter.value = keepType;
  }

  function amenityPill(label, on) {
    if (on === true) return `<span class="acc-pill on">✓ ${label}</span>`;
    if (on === false) return `<span class="acc-pill off">✗ ${label}</span>`;
    return '';
  }

  function renderHotelMap(items) {
    ensureHotelMap();
    if (!hotelMarkersLayer || !hotelMap) return;

    hotelMarkersLayer.clearLayers();
    const bounds = [];

    items.forEach((item) => {
      const coords = getHotelCoordinates(item);
      if (!coords) return;

      const image = item.main_image_url || item.image_url || fallbackImage;
      const marker = L.marker(coords).addTo(hotelMarkersLayer);
      const showPrice = window.BMHotelInquiry?.isPriceConfirmed(item) && item.price;
      const stayPayload = encodeURIComponent(JSON.stringify({
        id: item.id,
        name: item.name,
        room_types: item.room_types || []
      }));
      marker.bindPopup(`
        <div class="hotel-popup">
          <img src="${image}" alt="${item.name || 'Stay'}" onerror="this.onerror=null;this.src='${fallbackImage}'">
          <strong>${item.name || 'Stay'}</strong>
          <div>${item.location || item.destination || ''}</div>
          ${showPrice ? `<div style="margin-top:4px;color:#15803d;font-weight:700;">${item.price}</div>` : ''}
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
            <a href="hotel-detail.html?id=${encodeURIComponent(item.id)}" style="color:#0d3b66;font-weight:700;">View details</a>
            <button type="button" style="border:0;background:#0d3b66;color:#fff;border-radius:999px;padding:8px 12px;font-weight:700;cursor:pointer;" onclick='openHotelPriceInquiry(JSON.parse(decodeURIComponent("${stayPayload}")))'>Ask Price & Room Information</button>
          </div>
        </div>
      `);
      bounds.push(coords);
    });

    if (bounds.length) {
      hotelMap.fitBounds(bounds, { padding: [30, 30] });
    } else {
      hotelMap.setView([46.8, 103.8], 5);
    }
  }

 function renderHotelCards(items = []) {
  const wrap = document.getElementById('hotel-list');
  const counter = document.getElementById('hotel-result-count');
  if (!wrap) return;

  if (counter) {
    counter.textContent = items.length
      ? `Showing ${items.length} accommodation${items.length > 1 ? 's' : ''}`
      : 'No matching accommodation found';
  }

  if (!items.length) {
    wrap.innerHTML = `<div class="hotel-empty-state">No matching accommodation found. Try clearing filters or browse another area.</div>`;
    renderHotelMap([]);
    return;
  }

  wrap.innerHTML = items.map((item, index) => {
    const typeTag = item.property_type || 'Property';
    const desc = item.description || 'Comfortable stay option arranged with Booking Mongolia.';
    const phoneLink = item.phone
      ? `https://wa.me/${String(item.phone).replace(/[^0-9]/g, '')}`
      : '';
    const mapsUrl = item.google_maps_url || (getHotelCoordinates(item) ? `https://www.google.com/maps?q=${getHotelCoordinates(item).join(',')}` : '');
    const rooms = (item.room_types || []).slice(0, 3).map(r => `<span class="acc-pill">${r}</span>`).join('');
    const showPrice = window.BMHotelInquiry?.isPriceConfirmed(item) && item.price;
    const stayPayload = encodeURIComponent(JSON.stringify({
      id: item.id,
      name: item.name || '',
      room_types: item.room_types || []
    }));

    return `
      <article class="hotel-booking-card">
        <div class="hotel-cover-wrap">
          ${renderGalleryBlock(
            "hotel",
            index,
            item.gallery_urls || item.main_image_url || item.image_url,
            item.main_image_url || item.image_url || fallbackImage,
            item.name || "Stay"
          )}
        </div>

        <div class="hotel-booking-body">
          <div class="hotel-booking-top">
            <div>
              <div class="hotel-title-row">
                <div class="tag">${typeTag}</div>
              </div>
              <h3 class="hotel-booking-title">${item.name || ''}</h3>
              <div class="hotel-booking-location">📍 ${item.soum || item.location || ''}${item.aimag ? ` · ${item.aimag}` : ''}</div>
              ${item.destination ? `<div class="muted" style="font-size:13px;">Destination: ${item.destination}</div>` : ''}
            </div>

            ${showPrice ? `
            <div class="hotel-booking-price">
              ${item.price}
              ${item.season ? `<small>${item.season}</small>` : ''}
            </div>` : ''}
          </div>

          <div class="acc-fact-row">
            ${amenityPill('Private bath', item.private_bathroom)}
            ${amenityPill('Shower', item.shower)}
            ${amenityPill('Wi-Fi', item.wifi)}
            ${amenityPill('Breakfast', item.breakfast)}
            ${amenityPill('Electricity', item.electricity)}
            ${amenityPill('Parking', item.parking)}
            ${item.mobile_signal ? `<span class="acc-pill">Signal: ${item.mobile_signal}</span>` : ''}
          </div>

          ${rooms ? `<div class="acc-amenity-row"><strong style="font-size:13px;color:var(--primary)">Rooms / gers:</strong> ${rooms}</div>` : ''}
          ${item.meals ? `<div class="muted" style="font-size:13px;">Meals: ${item.meals}</div>` : ''}
          ${(item.amenities || []).length ? `<div class="acc-amenity-row">${item.amenities.slice(0, 6).map(a => `<span class="acc-pill">${a}</span>`).join('')}</div>` : ''}

          <p class="hotel-booking-desc">${desc}</p>

          <div class="hotel-booking-actions acc-booking-bar">
            <button type="button" class="hotel-mini-btn primary" onclick="openHotelPriceInquiry(JSON.parse(decodeURIComponent('${stayPayload}')))">Ask Price & Room Information</button>
            <a class="hotel-mini-btn primary" href="hotel-detail.html?id=${encodeURIComponent(item.id)}">View details</a>
            ${phoneLink ? `<a class="hotel-mini-btn" href="${phoneLink}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
            ${item.phone ? `<a class="hotel-mini-btn" href="tel:${String(item.phone).replace(/\s/g, '')}">Call</a>` : ''}
            ${mapsUrl ? `<a class="hotel-mini-btn" href="${mapsUrl}" target="_blank" rel="noopener">Google Maps</a>` : ''}
            <button class="hotel-mini-btn" type="button" onclick="focusHotelOnMap(${index})">Show on map</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  renderHotelMap(items);
}

  function applyHotelFilters() {
    const searchTerm = (document.getElementById('hotel-search')?.value || '').toLowerCase().trim();
    const cityValue = document.getElementById('hotel-city-filter')?.value || '';
    const typeValue = document.getElementById('hotel-type-filter')?.value || '';
    const aimagValue = document.getElementById('hotel-aimag-filter')?.value || '';
    const destinationValue = document.getElementById('hotel-destination-filter')?.value || '';
    const priceValue = document.getElementById('hotel-price-filter')?.value || '';
    const needBath = !!document.getElementById('hotel-filter-private-bath')?.checked;
    const needWifi = !!document.getElementById('hotel-filter-wifi')?.checked;
    const needBreakfast = !!document.getElementById('hotel-filter-breakfast')?.checked;
    const needGer = !!document.getElementById('hotel-filter-ger')?.checked;

    document.querySelectorAll('.hotel-toggle').forEach((el) => {
      const input = el.querySelector('input');
      el.classList.toggle('active', !!(input && input.checked));
    });

    const filtered = approvedHotels.filter(item => {
      const haystack = [
        item.name, item.location, item.aimag, item.soum, item.destination,
        item.property_type, item.description, (item.amenities || []).join(' '),
        (item.room_types || []).join(' ')
      ].join(' ').toLowerCase();

      const matchesSearch = !searchTerm || haystack.includes(searchTerm);
      const matchesCity = !cityValue || (item.soum || item.location || '') === cityValue || String(item.location || '').includes(cityValue);
      const matchesAimag = !aimagValue || (item.aimag || '') === aimagValue;
      const matchesDestination = !destinationValue || (item.destination || '') === destinationValue || String(item.location || '').toLowerCase().includes(destinationValue.toLowerCase());

      let matchesType = !typeValue;
      if (typeValue) {
        if (typeValue === 'Tourist Ger Camp') {
          matchesType = !!item.tourist_ger_camp || /tourist\s*ger|ger\s*camp|tourist\s*camp/i.test(item.property_type || '');
        } else if (typeValue === 'Nomadic Family Stay') {
          matchesType = /nomadic|family stay|homestay/i.test(item.property_type || '');
        } else {
          matchesType = (item.property_type || '') === typeValue;
        }
      }

      let matchesPrice = true;
      if (priceValue) {
        const [minS, maxS] = priceValue.split('-');
        const min = Number(minS);
        const max = Number(maxS);
        const p = item.price_from != null ? Number(item.price_from) : (window.BMAccommodation?.priceNumber(item.price));
        matchesPrice = p != null && p >= min && p <= max;
      }

      const matchesBath = !needBath || item.private_bathroom === true;
      const matchesWifi = !needWifi || item.wifi === true;
      const matchesBreakfast = !needBreakfast || item.breakfast === true;
      const matchesGer = !needGer || item.tourist_ger_camp === true || /tourist\s*ger|ger\s*camp/i.test(item.property_type || '');

      return matchesSearch && matchesCity && matchesAimag && matchesDestination && matchesType && matchesPrice && matchesBath && matchesWifi && matchesBreakfast && matchesGer;
    });

    window.currentRenderedHotels = filtered;
    renderHotelCards(filtered);
  }

  window.requestStayBooking = function (stay) {
    if (typeof openHotelPriceInquiry === 'function') {
      openHotelPriceInquiry({
        id: stay?.id,
        name: stay?.name || 'Accommodation',
        room_types: stay?.room_types || []
      });
      return;
    }
    const name = stay?.name || 'Accommodation';
    const loc = stay?.location || '';
    const msg = `Hello Booking Mongolia, I want to request a booking for: ${name}${loc ? ' (' + loc + ')' : ''}. Please share availability and price.`;
    window.open(`https://wa.me/97690283039?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  window.focusHotelOnMap = function(index) {
    const items = window.currentRenderedHotels || [];
    const item = items[index];
    if (!item) return;
    const coords = getHotelCoordinates(item);
    if (!coords) return;
    ensureHotelMap();
    hotelMap.setView(coords, 11, { animate: true });

    hotelMarkersLayer.eachLayer(layer => {
      if (layer.getLatLng && layer.getLatLng().lat === coords[0] && layer.getLatLng().lng === coords[1]) {
        layer.openPopup();
      }
    });
  };

  async function loadHotels() {
    const wrap = document.getElementById('hotel-list');
    if (!wrap) return;
    let liveRows = [];

    try {
      const { data, error } = await supabaseClient
        .from('property_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('loadHotels supabase error:', error);
      } else {
        liveRows = Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.error('loadHotels exception:', err);
    }

    const normalize = window.BMAccommodation?.normalizeProperty;
    const normalizedLive = liveRows.map((row) => {
      const n = normalize ? normalize(row) : row;
      return Object.assign({}, n, { source: 'supabase', is_mock: false });
    });

    if (window.BM_HOTEL_MOCK && typeof window.BM_HOTEL_MOCK.mergeWithSupabase === 'function') {
      approvedHotels = window.BM_HOTEL_MOCK.mergeWithSupabase(liveRows);
    } else {
      approvedHotels = normalizedLive;
    }

    if (normalize) {
      approvedHotels = approvedHotels.map((row) => normalize(row));
    }

    if (!approvedHotels.length && wrap) {
      wrap.innerHTML = '<div class="hotel-empty-state">Accommodation listings are temporarily unavailable. Please try again shortly.</div>';
      const counter = document.getElementById('hotel-result-count');
      if (counter) counter.textContent = '';
      return;
    }

    populateHotelFilters(approvedHotels);
    applyHotelFilters();

    if (window.BMNavAnchors && window.location.hash) {
      const hash = String(window.location.hash || '');
      if (/hotels|hotel|accommodation|stays/i.test(hash)) {
        window.BMNavAnchors.scrollToHashWhenReady(hash, 8);
      }
    }
  }
async function loadGuides() {
  if (!document.getElementById('guide-list')) return;

  const { data, error } = await supabaseClient
    .from('guide_submissions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('loadGuides error:', error);
    return;
  }

  const wrap = document.getElementById('guide-list');
  if (!wrap) return;

  wrap.innerHTML = data.length
    ? data.map(item => `
      <article class="card listing-card">
        <img src="${item.profile_image_url || fallbackImage}" alt="${item.full_name || 'Guide'}" onerror="this.onerror=null;this.src='${fallbackImage}'">
        <div class="card-body">
          <span class="tag">${item.guide_type || 'Local Guide'}</span>
          <h3>${item.full_name || ''}</h3>
          <p class="muted">
            ${item.age ? item.age + ' yrs' : ''}${item.gender ? ' • ' + item.gender : ''}
          </p>

          <div class="listing-meta">
            ${item.experience_years ? `<span class="pill">${item.experience_years}</span>` : ''}
            ${item.languages ? `<span class="pill">${item.languages}</span>` : ''}
            ${item.special_regions ? `<span class="pill">${item.special_regions}</span>` : ''}
          </div>

          ${item.special_interests ? `<p class="muted"><strong>Expertise:</strong> ${item.special_interests}</p>` : ''}
          ${item.price ? `<p class="price">${item.price}</p>` : ''}
          <p class="muted">${item.bio || ''}</p>

          <div class="listing-meta">
            ${item.phone ? `<span class="pill">📞 ${item.phone}</span>` : ''}
            ${item.email ? `<span class="pill">✉️ ${item.email}</span>` : ''}
          </div>
        </div>
      </article>
    `).join('')
    : '<p class="muted">No guide profiles published yet.</p>';
}
async function loadDriverReviewStats(driverIds) {
  const stats = {};
  (driverIds || []).forEach((id) => { stats[id] = { count: 0, sum: 0, avg: null }; });
  if (!driverIds || !driverIds.length) return stats;
  try {
    const { data, error } = await supabaseClient
      .from('guest_reviews')
      .select('driver_id, rating')
      .eq('review_type', 'driver')
      .eq('status', 'approved')
      .in('driver_id', driverIds);
    if (error) {
      console.error('driver review stats error:', error);
      return stats;
    }
    (data || []).forEach((row) => {
      const id = row.driver_id;
      if (!stats[id]) stats[id] = { count: 0, sum: 0, avg: null };
      const rating = Number(row.rating);
      if (!Number.isFinite(rating)) return;
      stats[id].count += 1;
      stats[id].sum += rating;
    });
    Object.keys(stats).forEach((id) => {
      if (stats[id].count) {
        stats[id].avg = Math.round((stats[id].sum / stats[id].count) * 10) / 10;
      }
    });
  } catch (e) {
    console.error('driver review stats exception:', e);
  }
  return stats;
}

/** Build unique shareable anchor ids: #car-hiace-01, #car-starex-02, ... */
function slugifyCarPart(text) {
  return String(text || 'car')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 36) || 'car';
}

function buildUniqueCarAnchorIds(items) {
  const reserved = new Set(['cars', 'car-rental', 'car', 'drivers']);
  const used = new Set(reserved);
  const counters = {};

  return (items || []).map((item) => {
    const rawBase = item.vehicle_type || item.title || item.contact_name || 'vehicle';
    const base = slugifyCarPart(rawBase);
    counters[base] = (counters[base] || 0) + 1;
    let n = counters[base];
    let id = `car-${base}-${String(n).padStart(2, '0')}`;
    while (used.has(id) || document.getElementById(id)) {
      n += 1;
      counters[base] = n;
      id = `car-${base}-${String(n).padStart(2, '0')}`;
    }
    used.add(id);
    return id;
  });
}

async function loadCars() {
  const container = document.getElementById('car-list');
  if (!container) return;
  const { data, error } = await supabaseClient
    .from('vehicle_submissions')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.error('loadCars error:', error);
    container.innerHTML = '<p>Car listings could not be loaded.</p>';
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<p>No car listings available yet.</p>';
    return;
  }

  function isMeaningfulText(value, minLen = 3) {
    const s = String(value == null ? '' : value).trim();
    if (!s) return false;
    const lower = s.toLowerCase();
    const blocked = new Set([
      'a', 'aa', 'aaa', 'b', 'c', 'ok', 'good', 'nice', 'test', 'testing',
      'n/a', 'na', 'none', 'null', 'undefined', '-', '--', '.', '..', '...',
      'x', 'xx', 'todo', 'tbd'
    ]);
    if (blocked.has(lower)) return false;
    if (s.length < minLen && !/\d/.test(s)) return false;
    return true;
  }

  function cleanDescription(text) {
    if (!isMeaningfulText(text, 12)) return '';
    return String(text).trim().replace(/\s+/g, ' ');
  }

  function formatSeats(seats) {
    if (!isMeaningfulText(seats, 1)) return '';
    const s = String(seats).trim();
    if (/seat/i.test(s)) return s;
    return `${s} seats`;
  }

  function formatRate(rate) {
    if (!isMeaningfulText(rate, 2)) return '';
    return String(rate).trim();
  }

  function formatPhone(phone) {
    if (!isMeaningfulText(phone, 5)) return '';
    return String(phone).trim();
  }

  function carCoverUrl(item) {
    const urls = normalizeGalleryUrls(
      [item.gallery_urls, item.main_image_url, item.image_url],
      item.main_image_url || item.image_url || fallbackCarImage
    );
    return urls[0] || fallbackCarImage;
  }

  const ids = data.map((item) => item.id).filter(Boolean);
  const reviewStats = await loadDriverReviewStats(ids);
  const carAnchorIds = buildUniqueCarAnchorIds(data);
  window.currentCarAnchors = data.map((item, index) => ({
    dbId: item.id,
    anchorId: carAnchorIds[index],
    title: item.title || item.vehicle_type || 'Car rental'
  }));

  container.innerHTML = data.map((item, index) => {
    const title = isMeaningfulText(item.title, 2)
      ? String(item.title).trim()
      : (isMeaningfulText(item.vehicle_type, 2) ? String(item.vehicle_type).trim() : 'Private vehicle with driver');
    const category = isMeaningfulText(item.vehicle_type, 2)
      ? String(item.vehicle_type).trim()
      : 'Car Rental';
    const description = cleanDescription(item.description);
    const rate = formatRate(item.daily_rate);
    const seats = formatSeats(item.seats);
    const phone = formatPhone(item.phone);
    const cover = carCoverUrl(item);
    const profileUrl = `driver-detail.html?id=${encodeURIComponent(item.id)}`;
    const anchorId = carAnchorIds[index];
    // Share exact vehicle deep link on the homepage, e.g. https://bookingmongolia.com/#car-hiace-01
    const shareUrl = `${window.location.origin}/car-rental.html#${anchorId}`;
    const stats = reviewStats[item.id] || { count: 0, avg: null };
    const phoneDigits = phone ? phone.replace(/[^0-9+]/g, '') : '';
    const phoneHref = phoneDigits
      ? (phoneDigits.replace(/\D/g, '').length >= 8
          ? `https://wa.me/${phoneDigits.replace(/^\+/, '').replace(/\D/g, '')}`
          : `tel:${phoneDigits}`)
      : '';

    const facts = [
      rate ? `<span class="car-fact car-fact-price">${escapeHtml(rate)}</span>` : '',
      seats ? `<span class="car-fact">${escapeHtml(seats)}</span>` : '',
      phone
        ? (phoneHref
            ? `<a class="car-fact" href="${escapeAttr(phoneHref)}" target="_blank" rel="noopener">📞 ${escapeHtml(phone)}</a>`
            : `<span class="car-fact">📞 ${escapeHtml(phone)}</span>`)
        : ''
    ].filter(Boolean).join('');

    return `
      <article class="card car-card" id="${escapeHtml(anchorId)}" data-vehicle-id="${escapeAttr(item.id)}" data-car-anchor="${escapeAttr(anchorId)}">
        <div class="car-card-media">
          <img src="${escapeAttr(cover)}" alt="${escapeAttr(title)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCarImage}'">
        </div>
        <div class="car-card-body">
          <span class="car-card-tag">${escapeHtml(category)}</span>
          <h3 class="car-card-title">${escapeHtml(title)}</h3>
          <p class="car-card-desc${description ? '' : ' is-empty'}">${description ? escapeHtml(description) : ''}</p>
          ${facts ? `<div class="car-card-facts">${facts}</div>` : ''}
          ${stats.count ? `<div class="car-card-rating">★ ${stats.avg.toFixed(1)} · ${stats.count} review${stats.count === 1 ? '' : 's'}</div>` : ''}
          <div class="car-card-actions">
            <a class="car-btn car-btn-primary" href="${escapeAttr(profileUrl)}">View profile &amp; reviews</a>
            <button type="button" class="car-btn car-btn-secondary bm-share-btn"
              data-share-title="${escapeAttr(title)}"
              data-share-text="${escapeAttr(title + ' — Booking Mongolia car rental')}"
              data-share-url="${escapeAttr(shareUrl)}"
              aria-label="Share this vehicle">
              <span class="bm-share-icon" aria-hidden="true">↗</span> Share
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  if (window.BMShare) {
    container.querySelectorAll('.bm-share-btn').forEach((btn) => window.BMShare.bindButton(btn));
  }

  if (window.BMNavAnchors && window.location.hash) {
    window.BMNavAnchors.scrollToHashWhenReady(window.location.hash, 20);
  }
}

  function getSelectedCountry(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return { code: 'other', name: 'Other' };
    const code = select.value || 'other';
    const label = select.options[select.selectedIndex]?.text || 'Other';
    const name = label.replace(/^[^\wA-Za-zА-Яа-я]+/u, '').trim() || 'Other';
    return { code, name };
  }

  function flagUrl(code) {
    if (!code || code === 'other') return 'https://flagcdn.com/w40/un.png';
    return `https://flagcdn.com/w40/${String(code).toLowerCase()}.png`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[ch]));
  }

  function getTurnstileToken() {
    try {
      if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
        return window.turnstile.getResponse() || '';
      }
    } catch (e) {}
    return '';
  }

  function resetTurnstile() {
    try {
      if (window.turnstile && typeof window.turnstile.reset === 'function') window.turnstile.reset();
    } catch (e) {}
  }

  const COMMUNITY_USER_KEY = localStorage.getItem('bm_community_user_key') || (() => {
    const key = 'bm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem('bm_community_user_key', key);
    return key;
  })();

  const communityState = {
    likeCounts: {},
    userLiked: {},
    comments: {}
  };

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function formatShortDate(value) {
    if (!value) return '';
    try { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch (e) { return ''; }
  }

  function switchCommunityTab(tab) {
    const blogActive = tab === 'blog';
    document.getElementById('communityBlogPanel')?.classList.toggle('active', blogActive);
    document.getElementById('communitySharingPanel')?.classList.toggle('active', !blogActive);
    document.querySelectorAll('.community-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-community-tab') === tab);
    });
  }

  function isBadCommunityText(text) {
    const value = String(text || '').toLowerCase();
    const blocked = ['casino', 'porn', 'sex', 'crypto giveaway', 'viagra'];
    const links = (value.match(/https?:\/\//g) || []).length;
    return links > 1 || blocked.some(word => value.includes(word));
  }

  async function loadCommunityPosts() {
    const blogList = document.getElementById('community-blog-list');
    const sharingList = document.getElementById('community-sharing-list');
    if (!blogList && !sharingList) return;

    const { data, error } = await supabaseClient
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) {
      console.error('loadCommunityPosts error:', error);
      if (blogList) blogList.innerHTML = '<div class="community-empty">Community posts could not be loaded yet. Please check Supabase table setup.</div>';
      if (sharingList) sharingList.innerHTML = '<div class="community-empty">Sharing posts could not be loaded yet. Please check Supabase table setup.</div>';
      return;
    }

    const posts = (data || []).filter(item => item.status !== 'deleted');
    await loadCommunityEngagement(posts.map(item => item.id));

    const blogPosts = posts.filter(item => item.type === 'blog');
    const sharingPosts = posts.filter(item => item.type === 'sharing');

    if (blogList) {
      blogList.innerHTML = blogPosts.length ? blogPosts.map(renderCommunityPost).join('') : '<div class="community-empty">No traveler stories yet. Be the first to share one.</div>';
    }

    if (sharingList) {
      sharingList.innerHTML = sharingPosts.length ? sharingPosts.map(renderCommunityPost).join('') : '<div class="community-empty">No group tour sharing posts yet.</div>';
    }

    if (window.BMShare?.bindButton) {
      document.querySelectorAll('.community-share-btn').forEach((btn) => window.BMShare.bindButton(btn));
    }
    focusCommunityPostFromHash();
  }

  function focusCommunityPostFromHash() {
    const hash = String(location.hash || '');
    if (!hash.startsWith('#community-post-')) return;
    const el = document.querySelector(hash);
    if (!el) return;
    document.getElementById('community')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '2px solid #c98b2f';
      el.style.outlineOffset = '4px';
      setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2400);
    }, 250);
  }

  async function loadCommunityEngagement(postIds) {
    communityState.likeCounts = {};
    communityState.userLiked = {};
    communityState.comments = {};
    if (!postIds || !postIds.length) return;

    const { data: likes, error: likesError } = await supabaseClient
      .from('community_likes')
      .select('post_id,user_key')
      .in('post_id', postIds);

    if (!likesError && Array.isArray(likes)) {
      likes.forEach(item => {
        communityState.likeCounts[item.post_id] = (communityState.likeCounts[item.post_id] || 0) + 1;
        if (item.user_key === COMMUNITY_USER_KEY) communityState.userLiked[item.post_id] = true;
      });
    }

    const { data: comments, error: commentsError } = await supabaseClient
      .from('community_comments')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true });

    if (!commentsError && Array.isArray(comments)) {
      comments.filter(item => item.status !== 'deleted').forEach(item => {
        if (!communityState.comments[item.post_id]) communityState.comments[item.post_id] = [];
        communityState.comments[item.post_id].push(item);
      });
    }
  }

  function getCommunityImageUrls(item) {
    if (Array.isArray(item.image_urls)) return item.image_urls.filter(Boolean);
    if (typeof item.image_urls === 'string') {
      try {
        const parsed = JSON.parse(item.image_urls);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {}
      return item.image_urls.split(',').map(x => x.trim()).filter(Boolean);
    }
    if (item.image_url) return [item.image_url].filter(Boolean);
    return [];
  }

  function renderCommunityImages(item, title) {
    const urls = getCommunityImageUrls(item);
    if (!urls.length) return '';
    const cls = urls.length === 1 ? 'community-image-grid one' : 'community-image-grid';
    return `<div class="${cls}">${urls.map(url => `<img src="${escapeAttr(url)}" alt="${escapeAttr(title)}" onclick="openImageLightbox('${escapeAttr(url)}')" onerror="this.style.display='none'">`).join('')}</div>`;
  }

  function renderCommunityPost(item) {
    const typeLabel = item.type === 'sharing' ? 'Join Group Tour' : 'Traveler Blog';
    const countryCode = item.country_code || 'other';
    const title = escapeHtml(item.title || (item.type === 'sharing' ? 'Looking for travel partners' : 'Traveler story'));
    const content = escapeHtml(item.content || '');
    const destination = escapeHtml(item.destination || '');
    const country = escapeHtml(item.country || 'Traveler');
    const name = escapeHtml(item.name || 'Anonymous traveler');
    const contact = escapeHtml(item.contact || '');
    const dates = escapeHtml(item.travel_dates || '');
    const budget = escapeHtml(item.budget || '');
    const people = item.people_count ? escapeHtml(item.people_count) : '';
    const imageGallery = renderCommunityImages(item, title);
    const postId = escapeAttr(item.id);
    const likeCount = communityState.likeCounts[item.id] || 0;
    const liked = !!communityState.userLiked[item.id];
    const comments = communityState.comments[item.id] || [];

    const shareUrl = `${window.location.origin}/travel-hub.html#community-post-${postId}`;
    const shareTitle = item.title || (item.type === 'sharing' ? 'Looking for travel partners' : 'Traveler story');

    return `
      <article class="community-card" id="community-post-${postId}">
        <div class="community-card-top">
          <div class="community-user">
            <img class="community-flag" src="${flagUrl(countryCode)}" alt="${country}" onerror="this.onerror=null;this.src='https://flagcdn.com/w40/un.png'">
            <div><strong>${name}</strong><br><span class="community-small">${country} ${formatShortDate(item.created_at) ? '• ' + formatShortDate(item.created_at) : ''}</span></div>
          </div>
          <span class="community-type-pill">${typeLabel}</span>
        </div>
        ${imageGallery}
        <h3 style="margin-bottom:8px">${title}</h3>
        <p class="muted">${content}</p>
        <div class="community-meta">
          ${destination ? `<span class="pill">📍 ${destination}</span>` : ''}
          ${dates ? `<span class="pill">📅 ${dates}</span>` : ''}
          ${people ? `<span class="pill">👥 ${people} traveler(s)</span>` : ''}
          ${budget ? `<span class="pill">💵 ${budget}</span>` : ''}
        </div>
        ${contact ? `<div class="community-actions"><span class="pill">Contact: ${contact}</span></div>` : ''}

        <div class="community-engagement">
          <button type="button" class="community-like-btn ${liked ? 'active' : ''}" onclick="toggleCommunityLike('${postId}')">${liked ? '❤️ Liked' : '♡ Like'} <span>${likeCount}</span></button>
          <button type="button" class="community-comment-toggle" onclick="toggleCommunityComments('${postId}')">💬 Comments <span>${comments.length}</span></button>
          <button type="button" class="community-share-btn bm-share-btn" data-share-title="${escapeAttr(shareTitle)}" data-share-text="${escapeAttr(shareTitle)}" data-share-url="${escapeAttr(shareUrl)}" aria-label="Share this post"><span class="bm-share-icon" aria-hidden="true">↗</span> Share</button>
        </div>

        <div class="community-comments" id="comments-${postId}" style="display:none">
          <div id="comment-list-${postId}">
            ${comments.length ? comments.map(renderCommunityComment).join('') : '<div class="community-small">No comments yet. Ask a question or share useful travel advice.</div>'}
          </div>
          <div class="community-comment-form">
            <input id="comment-name-${postId}" type="text" placeholder="Name">
            <input id="comment-text-${postId}" type="text" placeholder="Write a comment...">
            <button type="button" onclick="addCommunityComment('${postId}')">Post</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCommunityComment(comment) {
    const name = escapeHtml(comment.name || 'Traveler');
    const content = escapeHtml(comment.content || '');
    const date = formatShortDate(comment.created_at);
    return `<div class="community-comment-item"><strong>${name}</strong> <span class="community-small">${date || ''}</span><br><span>${content}</span></div>`;
  }

  function toggleCommunityComments(postId) {
    const box = document.getElementById(`comments-${postId}`);
    if (!box) return;
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }

  async function toggleCommunityLike(postId) {
    const liked = !!communityState.userLiked[postId];
    if (liked) {
      const { error } = await supabaseClient
        .from('community_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_key', COMMUNITY_USER_KEY);
      if (error) { alert('Like update failed. Check community_likes RLS policy.'); return; }
    } else {
      const { error } = await supabaseClient
        .from('community_likes')
        .insert([{ post_id: postId, user_key: COMMUNITY_USER_KEY }]);
      if (error && !String(error.message || '').toLowerCase().includes('duplicate')) { alert('Like failed. Check community_likes table.'); return; }
    }
    await loadCommunityPosts();
  }

  async function addCommunityComment(postId) {
    const nameInput = document.getElementById(`comment-name-${postId}`);
    const textInput = document.getElementById(`comment-text-${postId}`);
    const name = (nameInput?.value || 'Traveler').trim() || 'Traveler';
    const content = (textInput?.value || '').trim();

    if (content.length < 3) { alert('Please write a comment.'); return; }
    if (isBadCommunityText(content)) { alert('This comment looks like spam.'); return; }

    const { error } = await supabaseClient
      .from('community_comments')
      .insert([{ post_id: postId, name, content }]);

    if (error) { alert('Comment failed. Check community_comments table and RLS policy.'); return; }
    if (textInput) textInput.value = '';
    await loadCommunityPosts();
    setTimeout(() => {
      const box = document.getElementById(`comments-${postId}`);
      if (box) box.style.display = 'block';
    }, 80);
  }

  async function insertCommunityPost(e) {
    e.preventDefault();

    const isBlog = e.target.id === 'community-blog-form';
    const noticeId = isBlog ? 'community-blog-notice' : 'community-sharing-notice';
    const countryInfo = getSelectedCountry(isBlog ? 'blog_country_code' : 'share_country_code');
    const imageInput = document.getElementById(isBlog ? 'blog_images' : 'share_images');
    const imageFiles = Array.from(imageInput?.files || []);

    const payload = isBlog ? {
      type: 'blog',
      name: document.getElementById('blog_name').value.trim(),
      country: countryInfo.name,
      country_code: countryInfo.code,
      destination: document.getElementById('blog_destination').value.trim(),
      title: document.getElementById('blog_title').value.trim(),
      content: document.getElementById('blog_content').value.trim(),
      image_urls: [],
      status: 'published'
    } : {
      type: 'sharing',
      name: document.getElementById('share_name').value.trim(),
      country: countryInfo.name,
      country_code: countryInfo.code,
      destination: document.getElementById('share_destination').value.trim(),
      title: 'Looking for travelers to join',
      content: document.getElementById('share_content').value.trim(),
      travel_dates: document.getElementById('share_dates').value.trim(),
      people_count: document.getElementById('share_people_count').value ? Number(document.getElementById('share_people_count').value) : null,
      budget: document.getElementById('share_budget').value,
      contact: document.getElementById('share_contact').value.trim(),
      image_urls: [],
      status: 'published'
    };

    if (!payload.name || !payload.country_code || !payload.content || payload.content.length < 20) {
      showNotice(noticeId, 'Please complete the form and write at least 20 characters.', 'error');
      return;
    }

    if (isBadCommunityText(payload.content)) {
      showNotice(noticeId, 'This post looks like spam. Please remove links or inappropriate words.', 'error');
      return;
    }

    if (imageFiles.length) {
      showNotice(noticeId, 'Uploading photos now...', 'success');
      try {
        payload.image_urls = await uploadTravelHubImages(imageFiles, isBlog ? 'travelhub/blog' : 'travelhub/sharing');
      } catch (uploadError) {
        console.error('Travel Hub image upload error:', uploadError);
        showNotice(noticeId, uploadError.message || 'Image upload failed. Please try smaller photos.', 'error');
        return;
      }
    }

    const { error: postError } = await supabaseClient.from('community_posts').insert([payload]);

    if (postError) {
      console.error('community insert error:', postError);
      showNotice(noticeId, postError.message || 'Post failed. Check Supabase URL, table columns, and RLS policy.', 'error');
      return;
    }

    e.target.reset();
    showNotice(noticeId, 'Published successfully. Your post is now visible on the community board.');
    loadCommunityPosts();
  }


  const pendingUploadFiles = {
    hotel: [],
    car: []
  };

  function openImagePicker(type) {
    const input = document.getElementById(`${type}_image_file`);
    if (input) input.click();
  }

  function attachIncrementalImagePicker(type) {
    const input = document.getElementById(`${type}_image_file`);
    if (!input) return;

    input.addEventListener('change', () => {
      const existing = pendingUploadFiles[type];
      const incoming = Array.from(input.files || []);
      if (!incoming.length) return;

      incoming.forEach(file => {
        const duplicate = existing.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!duplicate) existing.push(file);
      });

      input.value = '';
      renderSelectedImages(type);
    });
  }

  function removeSelectedImage(type, index) {
    pendingUploadFiles[type].splice(index, 1);
    renderSelectedImages(type);
  }

  function renderSelectedImages(type) {
    const summary = document.getElementById(`${type}-image-summary`);
    const list = document.getElementById(`${type}-image-list`);
    const files = pendingUploadFiles[type] || [];
    if (!summary || !list) return;

    if (!files.length) {
      summary.textContent = 'No images selected yet.';
      summary.className = 'multi-upload-empty';
      list.innerHTML = '';
      return;
    }

    summary.textContent = `${files.length} image${files.length > 1 ? 's' : ''} selected`;
    summary.className = 'multi-upload-empty';
    list.innerHTML = files.map((file, index) => `
      <div class="multi-upload-item">
        <span>${file.name}</span>
        <button type="button" class="multi-upload-remove" onclick="removeSelectedImage('${type}', ${index})">Remove</button>
      </div>
    `).join('');
  }

  async function insertHotelSubmission(e) {
    e.preventDefault();

    try {
      const imageFiles = pendingUploadFiles.hotel.length ? [...pendingUploadFiles.hotel] : Array.from(document.getElementById('hotel_image_file')?.files || []);

      if (!imageFiles.length) {
        showNotice('hotel-notice', 'Please choose hotel images.', 'error');
        return;
      }

      showNotice('hotel-notice', 'Uploading images...', 'success');
      const imageUrls = await uploadMultipleImages(imageFiles, 'hotels');

      const formValues = {
        name: document.getElementById('hotel_name').value.trim(),
        property_type: document.getElementById('hotel_type').value,
        aimag: document.getElementById('hotel_aimag')?.value || '',
        soum: document.getElementById('hotel_soum')?.value.trim() || '',
        destination: document.getElementById('hotel_destination')?.value.trim() || '',
        location: document.getElementById('hotel_location')?.value.trim() || '',
        price: document.getElementById('hotel_price').value.trim(),
        room_types: document.getElementById('hotel_room_types')?.value || '',
        season: document.getElementById('hotel_season')?.value.trim() || '',
        meals: document.getElementById('hotel_meals')?.value.trim() || '',
        mobile_signal: document.getElementById('hotel_mobile_signal')?.value.trim() || '',
        contact_person: document.getElementById('hotel_contact_person').value.trim(),
        email: document.getElementById('hotel_email').value.trim(),
        phone: document.getElementById('hotel_phone').value.trim(),
        google_maps_url: document.getElementById('hotel_maps_url')?.value.trim() || '',
        latitude: document.getElementById('hotel_latitude').value.trim() || null,
        longitude: document.getElementById('hotel_longitude').value.trim() || null,
        breakfast: !!document.getElementById('hotel_breakfast')?.checked,
        private_bathroom: !!document.getElementById('hotel_private_bathroom')?.checked,
        shower: !!document.getElementById('hotel_shower')?.checked,
        electricity: !!document.getElementById('hotel_electricity')?.checked,
        wifi: !!document.getElementById('hotel_wifi')?.checked,
        parking: !!document.getElementById('hotel_parking')?.checked,
        amenities: document.getElementById('hotel_amenities')?.value || '',
        description: document.getElementById('hotel_description').value.trim(),
        image_url: imageUrls[0] || '',
        main_image_url: imageUrls[0] || '',
        gallery_urls: imageUrls,
        status: 'pending'
      };

      let payload = window.BMAccommodation?.buildSubmissionPayload
        ? window.BMAccommodation.buildSubmissionPayload(formValues)
        : {
            name: formValues.name,
            property_type: formValues.property_type,
            location: formValues.location || [formValues.soum, formValues.aimag].filter(Boolean).join(', '),
            price: formValues.price,
            email: formValues.email,
            phone: formValues.phone,
            latitude: formValues.latitude,
            longitude: formValues.longitude,
            image_url: formValues.image_url,
            main_image_url: formValues.main_image_url,
            gallery_urls: formValues.gallery_urls,
            description: formValues.description,
            status: 'pending'
          };

      let { error } = await supabaseClient.from('property_submissions').insert([payload]);

      // If extended column details_json is missing, retry with base columns only
      if (error && /details_json|column|schema/i.test(String(error.message || ''))) {
        const { details_json, ...basePayload } = payload;
        payload = basePayload;
        ({ error } = await supabaseClient.from('property_submissions').insert([payload]));
      }

      if (error) {
        throw error;
      }

      document.getElementById('hotel-form').reset();
      pendingUploadFiles.hotel = [];
      renderSelectedImages('hotel');
      showNotice('hotel-notice', 'Accommodation submitted successfully. It will appear after admin approval.');
    } catch (error) {
      console.error('hotel insert error:', error);
      showNotice('hotel-notice', error.message || 'Hotel submission failed.', 'error');
    }
  }
async function insertGuideSubmission(e) {
  e.preventDefault();

  try {
    const imageFile = document.getElementById('guide_image_file')?.files?.[0];

    if (!imageFile) {
      showNotice('guide-notice', 'Please choose a guide profile photo.', 'error');
      return;
    }

    showNotice('guide-notice', 'Uploading profile photo...', 'success');
    const imageUrl = await uploadImageToBucket(null, imageFile, 'guides');

    const payload = {
      full_name: document.getElementById('guide_name').value.trim(),
      age: document.getElementById('guide_age').value ? Number(document.getElementById('guide_age').value) : null,
      gender: document.getElementById('guide_gender').value,
      phone: document.getElementById('guide_phone').value.trim(),
      email: document.getElementById('guide_email').value.trim(),
      profile_image_url: imageUrl,
      experience_years: document.getElementById('guide_experience').value.trim(),
      languages: document.getElementById('guide_languages').value.trim(),
      special_regions: document.getElementById('guide_regions').value.trim(),
      special_interests: document.getElementById('guide_specialties').value.trim(),
      guide_type: document.getElementById('guide_type').value,
      price: document.getElementById('guide_price').value.trim(),
      bio: document.getElementById('guide_bio').value.trim(),
      status: 'pending'
    };

    const { error } = await supabaseClient
      .from('guide_submissions')
      .insert([payload]);

    if (error) throw error;

    document.getElementById('guide-form').reset();
    showNotice('guide-notice', 'Guide profile submitted successfully. It will appear after admin approval.');
  } catch (error) {
    console.error('guide insert error:', error);
    showNotice('guide-notice', error.message || 'Guide submission failed.', 'error');
  }
}
  async function insertCarSubmission(e) {
    e.preventDefault();

    try {
      const imageFiles = pendingUploadFiles.car.length ? [...pendingUploadFiles.car] : Array.from(document.getElementById('car_image_file')?.files || []);

      if (!imageFiles.length) {
        showNotice('car-notice', 'Please choose car images.', 'error');
        return;
      }

      showNotice('car-notice', 'Uploading images...', 'success');
      const imageUrls = await uploadMultipleImages(imageFiles, 'cars');

      const payload = {
        title: document.getElementById('car_title').value.trim(),
        vehicle_type: document.getElementById('car_type').value,
        seats: document.getElementById('car_seats').value.trim(),
        daily_rate: document.getElementById('car_rate').value.trim(),
        contact_name: document.getElementById('car_contact_name').value.trim(),
        phone: document.getElementById('car_phone').value.trim(),
        email: document.getElementById('car_email').value.trim(),
        image_url: imageUrls[0] || '',
        main_image_url: imageUrls[0] || '',
        gallery_urls: imageUrls,
        description: document.getElementById('car_description').value.trim(),
        status: 'pending'
      };

      const { error } = await supabaseClient.from('vehicle_submissions').insert([payload]);

      if (error) {
        throw error;
      }

      document.getElementById('car-form').reset();
      pendingUploadFiles.car = [];
      renderSelectedImages('car');
      showNotice('car-notice', 'Transport service submitted successfully. It will appear after admin approval.');
    } catch (error) {
      console.error('car insert error:', error);
      showNotice('car-notice', error.message || 'Transport submission failed.', 'error');
    }
  }

document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeRegisterModal();
  });

  document.querySelectorAll('.register-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-register-tab');
      document.querySelectorAll('.register-tab').forEach(item => item.classList.remove('active'));
      switchRegisterTab(target);
    });
  });

  initRegisterModalFallback();

  attachIncrementalImagePicker('hotel');
  attachIncrementalImagePicker('car');
  document.getElementById('hotel-form')?.addEventListener('submit', insertHotelSubmission);
  document.getElementById('car-form')?.addEventListener('submit', insertCarSubmission);
  document.getElementById('guide-form')?.addEventListener('submit', insertGuideSubmission);
  document.getElementById('community-blog-form')?.addEventListener('submit', insertCommunityPost);
  document.getElementById('community-sharing-form')?.addEventListener('submit', insertCommunityPost);
  // Fill aimag options for registration form
  (function fillAimagSelect() {
    const sel = document.getElementById('hotel_aimag');
    if (!sel || !window.BMAccommodation?.AIMAGS) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Select aimag</option>' +
      window.BMAccommodation.AIMAGS.map((a) => `<option value="${a}">${a}</option>`).join('');
    sel.value = current;
  })();

  document.getElementById('hotel-search')?.addEventListener('input', applyHotelFilters);
  document.getElementById('hotel-city-filter')?.addEventListener('change', applyHotelFilters);
  document.getElementById('hotel-aimag-filter')?.addEventListener('change', applyHotelFilters);
  document.getElementById('hotel-destination-filter')?.addEventListener('change', applyHotelFilters);
  document.getElementById('hotel-price-filter')?.addEventListener('change', applyHotelFilters);
  ['hotel-filter-private-bath', 'hotel-filter-wifi', 'hotel-filter-breakfast', 'hotel-filter-ger'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', applyHotelFilters);
  });
  document.getElementById('hotel-type-filter')?.addEventListener('change', function () {
    const typeValue = this.value || '';
    document.querySelectorAll('.hotel-menu-chip').forEach((chip) => {
      const active = (chip.getAttribute('data-hotel-type') || '') === typeValue;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    applyHotelFilters();
  });
  document.querySelectorAll('.hotel-menu-chip').forEach((chip) => {
    chip.addEventListener('click', function () {
      const typeValue = this.getAttribute('data-hotel-type') || '';
      document.querySelectorAll('.hotel-menu-chip').forEach((c) => {
        const active = c === chip;
        c.classList.toggle('active', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      const typeFilter = document.getElementById('hotel-type-filter');
      if (typeFilter) {
        if (typeValue && ![...typeFilter.options].some((o) => o.value === typeValue)) {
          const opt = document.createElement('option');
          opt.value = typeValue;
          opt.textContent = typeValue;
          typeFilter.appendChild(opt);
        }
        typeFilter.value = typeValue;
      }
      const gerToggle = document.getElementById('hotel-filter-ger');
      if (gerToggle) gerToggle.checked = typeValue === 'Tourist Ger Camp';
      applyHotelFilters();
    });
  });

  loadHotels();
  loadCars();
  loadGuides();
  loadCommunityPosts();
});
