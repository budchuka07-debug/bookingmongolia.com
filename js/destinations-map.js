    const provinceData = {khuvsgul: {
        title: "Khuvsgul",
        text: "The Blue Pearl of Mongolia, famous for Khuvsgul Lake, taiga forests and reindeer culture.",
        bestFor: "Lake, taiga, reindeer",
        fromUB: "Flight or long-distance bus",
        season: "June – September",
        type: "Nature, culture, adventure",
        page: "destinations/khuvsgul.html",
        tour: "tours/reindeer-taiga-tour.html",
        attractions: ["Khuvsgul Lake", "Taiga & Reindeer Area", "Khatgal", "Darkhad Valley"]
      },
      bayanulgii: {
        title: "Bayan-Ulgii",
        text: "Western Mongolia’s mountain province with glaciers, eagle hunter culture and high-altitude trekking routes.",
        bestFor: "Mountains, trekking, culture",
        fromUB: "Domestic flight recommended",
        season: "June – September",
        type: "Adventure, culture, trekking",
        page: "destinations/bayan-ulgii.html",
        tour: "tours/altai-tavan-bogd-tour.html",
        attractions: ["Altai Tavan Bogd", "Potanin Glacier", "Eagle Hunter Villages", "Tolbo Lake"]
      },
      umnugovi: {
        title: "Umnugovi",
        text: "Home of the Gobi Desert, giant dunes, canyons and dramatic southern Mongolia landscapes.",
        bestFor: "Desert, dunes, fossils",
        fromUB: "Flight, bus or 4×4 tour",
        season: "May – October",
        type: "Desert adventure",
        page: "destinations/umnugovi.html",
        tour: "tours/gobi-desert-tour.html",
        attractions: ["Khermen Tsav", "Khongor Sand Dunes", "Yol Valley", "Flaming Cliffs"]
      },
      arkhangai: {
        title: "Arkhangai",
        text: "A beautiful central region of volcanoes, lakes, hot springs and classic Mongolia road-trip scenery.",
        bestFor: "Nature, hot springs, central route",
        fromUB: "Bus or private vehicle",
        season: "June – September",
        type: "Scenic and cultural travel",
        page: "destinations/arkhangai.html",
        tour: "tours/central-mongolia-tour.html",
        attractions: ["Khorgo Volcano", "Taikhar Rock", "Tsenkher Hot Spring", "Terkhiin Tsagaan Lake"]
      },
      tuv: {
        title: "Tuv",
        text: "Easy access from Ulaanbaatar with wildlife, national parks and short scenic trips.",
        bestFor: "Short trips, family travel",
        fromUB: "Bus, car or day tour",
        season: "Year-round",
        type: "Short trips and day tours",
        page: "destinations/tuv.html",
        tour: "tours/terelj-hustai-tour.html",
        attractions: ["Khustain Nuruu", "Terelj National Park", "Turtle Rock", "Chinggis Khan Statue"]
      },
      khentii: {
        title: "Khentii",
        text: "Historic homeland landscapes, open steppe and cultural routes linked to Chinggis Khan history.",
        bestFor: "History, culture, steppe",
        fromUB: "Road trip or private vehicle",
        season: "June – September",
        type: "History and nature",
        page: "destinations/khentii.html",
        tour: "destinations/khentii.html",
        attractions: ["Baldan Bereeven Monastery", "Binder Steppe", "Deluun Boldog Area", "Sacred Mountain Routes"]
      },
      selenge: {
        title: "Selenge",
        text: "Northern Mongolia landscapes and one of the country’s most important monastery complexes.",
        bestFor: "Culture, monastery, history",
        fromUB: "Road trip (5–6 hours)",
        season: "May – October",
        type: "Cultural travel",
        page: "destinations/selenge.html",
        tour: "destinations/selenge.html",
        attractions: ["Amarbayasgalant Monastery", "Selenge Valley", "Forest-Steppe Landscapes", "Northern Heritage Routes"]
      }
    };

    function renderProvinceContent(key){
      const d = provinceData[key];
      document.getElementById('provinceContent').innerHTML = `
        <div class="destination-info-top">
          <h3>${d.title}</h3>
          <span class="destination-badge">Province Overview</span>
        </div>
        <p>${d.text}</p>
        <div class="destination-meta">
          <div><strong>Best For</strong><br>${d.bestFor}</div>
          <div><strong>From UB</strong><br>${d.fromUB}</div>
          <div><strong>Best Season</strong><br>${d.season}</div>
          <div><strong>Tour Type</strong><br>${d.type}</div>
        </div>
        <div class="destination-mini-links">
          <a class="destination-mini-link" href="${d.page}">Province Guide</a>
          <a class="destination-mini-link" href="${d.tour}">${String(d.tour).includes('destinations/') ? 'Related Guide' : 'Related Tour'}</a>
        </div>
        <div class="destination-attractions">
          <h4>Top Places to Visit</h4>
          <ul class="destination-attractions-list">
            ${d.attractions.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div class="destination-map-cta">
          <a class="btn btn-primary" href="${d.page}">Open Province Page</a>
          <a class="btn btn-secondary" href="${d.tour}">${String(d.tour).includes('destinations/') ? 'Open Related Guide' : 'View Related Tour'}</a>
        </div>
      `;
    }

    function highlightProvince(key){
      document.querySelectorAll('.destination-point').forEach(p => {
        p.classList.toggle('active', p.dataset.provinceBtn === key);
        p.classList.toggle('dimmed', p.dataset.provinceBtn !== key);
      });
      document.querySelectorAll('.destination-place-label').forEach(label => {
        const match = label.dataset.province === key;
        label.classList.toggle('active', match);
        label.classList.toggle('muted', !match);
      });
    }

    function showProvince(key, e){
      renderProvinceContent(key);
      highlightProvince(key);
    }

    document.addEventListener('DOMContentLoaded', function(){
      renderProvinceContent('khuvsgul');
      highlightProvince('khuvsgul');
    });
 function openBooking(tourName = ''){
  document.getElementById('bookingPopup').style.display = 'block';

  const tourSelect = document.getElementById('tourSelect');
  if(tourSelect && tourName){
    tourSelect.value = tourName;
  }
}

function closeBooking(){
  var popup = document.getElementById('bookingPopup');
  if (popup) popup.style.display = 'none';
}

window.addEventListener('click', function(e){
  const popup = document.getElementById('bookingPopup');
  if(e.target === popup){
    closeBooking();
  }
});

function closeBooking(){
  var popup = document.getElementById('bookingPopup');
  if (popup) popup.style.display = 'none';
}

window.addEventListener('click', function(e){
  const popup = document.getElementById('bookingPopup');
  if(e.target === popup){
    closeBooking();
  }
});
