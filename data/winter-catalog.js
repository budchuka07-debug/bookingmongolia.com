/**
 * Winter Mongolia tour products.
 * Durations are planning estimates, not confirmed departure dates.
 * The season window is November to April. Exact festival days are not published here.
 */
(function (root) {
  function daysLabel(min, max) {
    if (min === max) return min === 1 ? "1 Day" : min + " Days";
    return min + "–" + max + " Days";
  }

  function tour(item) {
    item.kind = "tour";
    item.durationMin = item.durationMin;
    item.durationMax = item.durationMax || item.durationMin;
    item.durationLabel = daysLabel(item.durationMin, item.durationMax);
    item.datesLabel = "November – April";
    item.priceLabel = item.priceLabel || "Request a Quote";
    item.published = item.published !== false;
    item.page = "/tours/" + item.id + ".html";
    return item;
  }

  var tours = [
    tour({
      id: "tsaatan-winter-expedition",
      title: "Tsaatan Reindeer Expedition",
      destination: "Khuvsgul, northern Mongolia, Tsaatan community",
      image: "images/experiences/exp-reindeer.jpg",
      alt: "Tsaatan herder with reindeer in the snow of northern Mongolia",
      durationMin: 7,
      durationMax: 9,
      filters: ["Adventure", "Multi-day Tours"],
      section: "reindeer",
      tourType: "Multi-day expedition",
      difficulty: "Adventure / remote travel",
      groupLabel: "Private or small group",
      availability: "seasonal",
      featured: true,
      summary: "A winter expedition to a Tsaatan reindeer-herding community in the northern taiga. The length is planned as 7, 8, or 9 days. A teepee stay and reindeer riding depend on the host family and the herd.",
      highlights: ["Reindeer herding", "Tsaatan culture", "Teepee stay when a family can host", "Winter wilderness photography"],
      plans: {
        "7": [
          "Day 1: Ulaanbaatar briefing and overnight.",
          "Day 2: Fly north and drive toward the taiga road.",
          "Day 3: Reach the host community.",
          "Day 4: Reindeer herding and camp life.",
          "Day 5: Photography, and a ride only if the herd allows it.",
          "Day 6: Leave the taiga.",
          "Day 7: Return to Ulaanbaatar."
        ],
        "8": [
          "Days 1–3: Same approach as the 7-day plan.",
          "Days 4–6: Two full days with the herd, plus a slower photography day.",
          "Days 7–8: Return north road and flight to Ulaanbaatar."
        ],
        "9": [
          "Days 1–3: Same approach as the 7-day plan.",
          "Days 4–7: Extra taiga day held for weather, a second camp, or a rest day.",
          "Days 8–9: Return to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "gobi-camel-festival",
      title: "Gobi Camel Festival Tour",
      destination: "Umnugovi Province, Gobi Desert",
      image: "images/experiences/exp-gobi-desert.jpg",
      alt: "Bactrian camels in the Gobi Desert",
      durationMin: 4,
      durationMax: 5,
      filters: ["Festivals", "Multi-day Tours"],
      section: "festivals",
      tourType: "Seasonal festival tour",
      difficulty: "Moderate",
      groupLabel: "Private or small group",
      availability: "seasonal",
      featured: true,
      summary: "A 4- or 5-day Gobi trip built around the camel festival: Bactrian camels, races, riding, herder families, and desert light. The exact festival days are confirmed when you book. They are not printed as a fixed calendar date.",
      highlights: ["Camel festival", "Camel races", "Camel riding", "Gobi landscapes and local performances"],
      plans: {
        "4": [
          "Day 1: Fly or drive to Dalanzadgad and continue to the camel area.",
          "Day 2: Camel herder family, riding, and the festival grounds when the event is on.",
          "Day 3: Races, performances, or a herder day if the public program is another week.",
          "Day 4: Desert scenery and return to Ulaanbaatar."
        ],
        "5": [
          "Days 1–3: Same as the 4-day plan.",
          "Day 4: Extra Gobi landscape day.",
          "Day 5: Return to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "terelj-dog-sledding",
      title: "Terelj Dog Sledding Adventure",
      destination: "Gorkhi-Terelj National Park",
      image: "images/destinations/dest-terelj-national-park.jpg",
      alt: "Dog sled team in the snow near Terelj",
      durationMin: 1,
      durationMax: 1,
      filters: ["Adventure", "Day Tours"],
      section: "outdoor",
      tourType: "Day trip from Ulaanbaatar",
      difficulty: "Easy to moderate",
      groupLabel: "Private from Ulaanbaatar",
      availability: "seasonal",
      featured: true,
      summary: "A one-day winter outing from Ulaanbaatar. Dog sledding in Gorkhi-Terelj when the snow and the kennel allow it, with photo stops and an optional ger lunch.",
      highlights: ["Dog sledding", "Snowy Terelj", "Photography", "Optional ger lunch"],
      plans: {
        "1": [
          "Morning: Hotel pickup in Ulaanbaatar and drive to Gorkhi-Terelj.",
          "Midday: Dog sledding and photo stops in the snowy valley.",
          "Afternoon: Optional ger lunch, then return to the city."
        ]
      }
    }),
    tour({
      id: "khuvsgul-ice-festival",
      title: "Khuvsgul Ice Festival Tour",
      destination: "Khuvsgul Lake",
      image: "images/experiences/exp-khuvsgul-lake.jpg",
      alt: "Khuvsgul Lake in the winter season",
      durationMin: 5,
      durationMax: 7,
      filters: ["Festivals", "Multi-day Tours"],
      section: "festivals",
      tourType: "Seasonal festival tour",
      difficulty: "Moderate",
      groupLabel: "Private or small group",
      availability: "seasonal",
      featured: false,
      summary: "Five to seven days at Khuvsgul for the ice festival, the frozen lake, winter photography, and local culture. Horse sledding is included only where it is actually operating. The exact festival days are confirmed before the trip is booked.",
      highlights: ["Ice festival", "Frozen Khuvsgul", "Horse sled where available", "Winter photography"],
      plans: {
        "5": [
          "Day 1: Fly to Murun and drive to the lake.",
          "Day 2: Frozen shore and festival grounds when the event is on.",
          "Day 3: Ice activities that are open that week, and photography.",
          "Day 4: Local culture and a second lake day.",
          "Day 5: Return to Ulaanbaatar."
        ],
        "6": [
          "Days 1–4: Same as the 5-day plan, with a slower lake day.",
          "Day 5: Spare day for weather.",
          "Day 6: Return to Ulaanbaatar."
        ],
        "7": [
          "Days 1–5: Lake, festival, and one extra northern community or rest day.",
          "Days 6–7: Return via Murun to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "eagle-hunter-winter",
      title: "Western Mongolia Eagle Hunter Experience",
      destination: "Bayan-Ulgii, Western Mongolia",
      image: "images/experiences/exp-eagle-hunter.jpg",
      alt: "Kazakh eagle hunter in western Mongolia",
      durationMin: 8,
      durationMax: 10,
      filters: ["Cultural Experiences", "Adventure", "Multi-day Tours"],
      section: "culture",
      tourType: "Multi-day cultural expedition",
      difficulty: "Adventure",
      groupLabel: "Private or small group",
      availability: "seasonal",
      featured: false,
      summary: "Eight to ten days in Bayan-Ulgii with Kazakh eagle-hunter families. The visit covers winter landscapes, photography, and home hospitality. A hunt itself is never guaranteed.",
      highlights: ["Kazakh eagle hunters", "Winter Altai landscapes", "Family visits", "Photography"],
      plans: {
        "8": [
          "Day 1: Fly west from Ulaanbaatar.",
          "Day 2: Drive to the host valley.",
          "Days 3–6: Family stay, eagles, and winter landscape days.",
          "Days 7–8: Return flight to Ulaanbaatar."
        ],
        "9": [
          "Days 1–6: Same as the 8-day plan.",
          "Day 7: Extra valley or a second family.",
          "Days 8–9: Return to Ulaanbaatar."
        ],
        "10": [
          "Days 1–7: Same as the 9-day plan, with one weather day held in reserve.",
          "Days 8–10: Return west road and flight."
        ]
      }
    }),
    tour({
      id: "winter-horse-riding",
      title: "Winter Horse Riding Experience",
      destination: "Terelj or another suitable countryside valley",
      image: "images/tour/horse-tour-hero.jpg",
      alt: "Horses ready for a winter ride in the Mongolian countryside",
      durationMin: 2,
      durationMax: 3,
      filters: ["Adventure", "Multi-day Tours"],
      section: "culture",
      tourType: "Short adventure",
      difficulty: "Moderate, weather dependent",
      groupLabel: "Private",
      availability: "seasonal",
      featured: false,
      summary: "Two or three days of winter horse riding where the ground and the horses are fit for it. Nights are in a ger. The ride is shortened or cancelled if the track is icy.",
      highlights: ["Winter horse riding", "Ger stay", "Snowy countryside", "Nomadic hosts"],
      plans: {
        "2": [
          "Day 1: Leave Ulaanbaatar, ride, and overnight in a ger.",
          "Day 2: Morning ride and return to the city."
        ],
        "3": [
          "Day 1: Leave the city and settle at the ger.",
          "Day 2: Full riding day.",
          "Day 3: Short ride and return to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "winter-nomadic-family",
      title: "Winter Nomadic Family Experience",
      destination: "Terelj or countryside near Ulaanbaatar",
      image: "images/tour/marshrut/BM-terelj-1.jpg",
      alt: "A ger in the winter countryside near Terelj",
      durationMin: 2,
      durationMax: 3,
      filters: ["Cultural Experiences", "Multi-day Tours"],
      section: "culture",
      tourType: "Cultural experience",
      difficulty: "Easy",
      groupLabel: "Private or small group",
      availability: "on_request",
      featured: false,
      summary: "Two or three nights with a herder family near Ulaanbaatar. See winter livestock work, eat a home meal, and sleep in the ger. This is a household, not a show.",
      highlights: ["Nomadic family", "Traditional food", "Livestock in winter", "Ger accommodation"],
      plans: {
        "2": [
          "Day 1: Drive out, meet the family, and stay the night.",
          "Day 2: Morning with the animals and return to Ulaanbaatar."
        ],
        "3": [
          "Day 1: Arrive at the family ger.",
          "Day 2: Full day of winter work, food, and countryside.",
          "Day 3: Return to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "winter-snow-trekking",
      title: "Winter Snow Trekking and Hiking",
      destination: "Terelj and nearby valleys that are safe in winter",
      image: "images/tour/mongolia-horse-trekking.jpg",
      alt: "Open winter valley used for a short guided hike",
      durationMin: 1,
      durationMax: 2,
      filters: ["Adventure", "Day Tours", "Multi-day Tours"],
      section: "outdoor",
      tourType: "Outdoor adventure",
      difficulty: "Moderate",
      groupLabel: "Private",
      availability: "seasonal",
      featured: false,
      summary: "A guided snow walk of one or two days in Terelj or a nearby valley. The route stays on paths the guide accepts that day. Wind, ice, and poor visibility stop the hike.",
      highlights: ["Guided snow trek", "Mountain scenery", "Photography", "Weather checked first"],
      safety: "Wear boots with grip, warm layers, and sunglasses. The guide turns back if the path is icy, the wind rises, or daylight is too short. This is not a glacier or high-alpine climb.",
      plans: {
        "1": [
          "Morning: Pickup and a short drive to the trailhead.",
          "Midday: Guided walk with photo stops.",
          "Afternoon: Return to Ulaanbaatar before dark."
        ],
        "2": [
          "Day 1: Walk and overnight in a heated ger near the valley.",
          "Day 2: Second short route and return to the city."
        ]
      }
    }),
    tour({
      id: "winter-ger-stay",
      title: "Mongolian Winter Camping and Ger Stay",
      destination: "Selected countryside camps that stay open in winter",
      image: "images/tour/nomads-in-semi-desert.jpg",
      alt: "A countryside camp used for a winter ger stay",
      durationMin: 2,
      durationMax: 3,
      filters: ["Cultural Experiences", "Multi-day Tours"],
      section: "culture",
      tourType: "Nature and cultural experience",
      difficulty: "Easy",
      groupLabel: "Private",
      availability: "seasonal",
      featured: false,
      summary: "Two or three days in a heated ger at a camp that is actually open. Evenings can include a fire where the camp allows it, plus stargazing and winter landscape photography.",
      highlights: ["Heated ger", "Winter landscape", "Traditional food", "Stargazing when the sky is clear"],
      plans: {
        "2": [
          "Day 1: Drive to the camp and settle in the ger.",
          "Day 2: Morning outside and return to Ulaanbaatar."
        ],
        "3": [
          "Day 1: Arrive at the winter camp.",
          "Day 2: Slow outdoor day and a camp evening.",
          "Day 3: Return to Ulaanbaatar."
        ]
      }
    }),
    tour({
      id: "ulaanbaatar-winter-city",
      title: "Ulaanbaatar Winter City Tour",
      destination: "Ulaanbaatar",
      image: "images/guide/ulaanbaatar-gandan.jpg",
      alt: "Gandan Monastery in Ulaanbaatar",
      durationMin: 1,
      durationMax: 1,
      filters: ["Day Tours", "Cultural Experiences"],
      section: "city",
      tourType: "City day tour",
      difficulty: "Easy",
      groupLabel: "Private",
      availability: "on_request",
      featured: false,
      summary: "One winter day in the city: Gandan Monastery, the National Museum, the Chinggis Khaan Museum, Sukhbaatar Square, and a Mongolian meal. Time is left for cold and traffic.",
      highlights: ["Gandan Monastery", "National Museum", "Chinggis Khaan Museum", "Sukhbaatar Square"],
      plans: {
        "1": [
          "Morning: Sukhbaatar Square and Gandan Monastery.",
          "Midday: National Museum or the Chinggis Khaan Museum, then lunch.",
          "Afternoon: The second museum and drop-off at your hotel."
        ]
      }
    }),
    tour({
      id: "gobi-winter-expedition",
      title: "Gobi Winter Expedition",
      destination: "Umnugovi and selected Gobi sites",
      image: "images/destinations/khongor-dunes.jpg",
      alt: "Khongoryn Els dunes in the Gobi",
      durationMin: 5,
      durationMax: 7,
      filters: ["Adventure", "Multi-day Tours"],
      section: "gobi",
      tourType: "Private or small-group expedition",
      difficulty: "Moderate, road and weather dependent",
      groupLabel: "Private or small group",
      availability: "on_request",
      featured: false,
      summary: "Five to seven days in the South Gobi in winter: Flaming Cliffs, Khongoryn Els, Yolyn Am, and camel herder families where camps are open. The road order changes with weather.",
      highlights: ["Flaming Cliffs", "Khongoryn Els", "Yolyn Am", "Camel herder families"],
      plans: {
        "5": [
          "Day 1: Fly or drive to Dalanzadgad and Yolyn Am.",
          "Day 2: Bayanzag, the Flaming Cliffs.",
          "Day 3: Khongoryn Els.",
          "Day 4: Camel family or a dune morning.",
          "Day 5: Return to Ulaanbaatar."
        ],
        "6": [
          "Days 1–4: Same Gobi sites at a slower pace.",
          "Day 5: Spare driving day.",
          "Day 6: Return."
        ],
        "7": [
          "Days 1–5: The 5-day route plus one camp day held for wind or a closed track.",
          "Days 6–7: Return to Ulaanbaatar."
        ]
      }
    })
  ];

  var events = [
    {
      id: "event-camel",
      kind: "event",
      title: "Camel Festival",
      destination: "Umnugovi, Gobi",
      location: "Umnugovi, Gobi",
      image: "images/experiences/exp-gobi-desert.jpg",
      alt: "Camels in the Gobi during the winter season",
      summary: "Season window November to April. The exact festival days are confirmed when you book.",
      startDate: "November",
      endDate: "April",
      availability: "seasonal",
      relatedTourId: "gobi-camel-festival",
      published: true,
      category: "Festivals"
    },
    {
      id: "event-khuvsgul-ice",
      kind: "event",
      title: "Khuvsgul Ice Festival",
      destination: "Khuvsgul Lake",
      location: "Khuvsgul Lake",
      image: "images/experiences/exp-khuvsgul-lake.jpg",
      alt: "Frozen shore of Khuvsgul Lake",
      summary: "Season window November to April. The exact ice-festival days are confirmed before publication of a departure.",
      startDate: "November",
      endDate: "April",
      availability: "seasonal",
      relatedTourId: "khuvsgul-ice-festival",
      published: true,
      category: "Festivals"
    },
    {
      id: "event-tsaatan",
      kind: "event",
      title: "Tsaatan winter expedition",
      destination: "Khuvsgul taiga",
      location: "Northern taiga",
      image: "images/experiences/exp-reindeer.jpg",
      alt: "Reindeer herd in winter",
      summary: "Departure window November to April. Each group’s travel days are set when the family can host.",
      startDate: "November",
      endDate: "April",
      availability: "seasonal",
      relatedTourId: "tsaatan-winter-expedition",
      published: true,
      category: "Adventure"
    },
    {
      id: "event-dogsled",
      kind: "event",
      title: "Terelj dog sledding",
      destination: "Gorkhi-Terelj National Park",
      location: "Gorkhi-Terelj",
      image: "images/destinations/dest-terelj-national-park.jpg",
      alt: "Terelj in snow",
      summary: "Available November to April on days when snow cover and the kennel allow a sled run.",
      startDate: "November",
      endDate: "April",
      availability: "seasonal",
      relatedTourId: "terelj-dog-sledding",
      published: true,
      category: "Adventure"
    }
  ];

  root.BM_WINTER = { tours: tours, events: events };
})(typeof window !== "undefined" ? window : globalThis);
