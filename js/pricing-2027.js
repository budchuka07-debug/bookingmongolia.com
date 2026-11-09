/**
 * 2027 public tour rates. USD per person per day.
 * One tier only. The Gobi, Tsaatan and Altai tables already include
 * their higher daily rate, so nothing adds another $30 on top.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.BMPricing = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  var RATES = {
    standard: { 2: 260, 3: 220, 4: 190 },
    gobi: { 2: 290, 3: 250, 4: 220 },
    tsaatan: { 2: 290, 3: 250, 4: 220 },
    altai: { 2: 290, 3: 250, 4: 220 }
  };

  function tierFor(tour) {
    if (!tour || tour.priceMode === "ask") return null;
    var blob = String((tour.id || "") + " " + (tour.name || "")).toLowerCase();
    if (/altai[- ]tavan[- ]bogd|tavan bogd/.test(blob)) return "altai";
    if (/tsaatan|reindeer|taiga/.test(blob)) return "tsaatan";
    if (tour.region === "gobi" || /\bgobi\b/.test(blob)) return "gobi";
    return "standard";
  }

  function partySize(travelers) {
    var n = parseInt(String(travelers == null ? "" : travelers).replace(/[^\d]/g, ""), 10);
    if (!n || n < 1) return 0;
    if (n >= 4) return 4;
    return n;
  }

  function travelerCount(travelers, size) {
    var n = parseInt(String(travelers == null ? "" : travelers).replace(/[^\d]/g, ""), 10);
    if (size === 4) return Math.max(4, n || 4);
    return size;
  }

  function quote(tour, travelers) {
    var days = Number(tour && tour.days) || 0;
    if (!tour || tour.priceMode === "ask" || days < 1) {
      return { quote: true, reason: "ask", days: days, tier: null };
    }
    var tier = tierFor(tour);
    var size = partySize(travelers);
    if (size === 1) {
      return { quote: true, reason: "solo", tier: tier, days: days, travelers: 1, daily: null };
    }
    var daily = RATES[tier][size];
    var count = travelerCount(travelers, size);
    var perPerson = daily * days;
    return {
      quote: false,
      reason: null,
      tier: tier,
      daily: daily,
      days: days,
      travelers: count,
      perPerson: perPerson,
      total: perPerson * count
    };
  }

  function money(value) {
    return "$" + Number(value).toLocaleString("en-US");
  }

  function fromLabel(tour) {
    var priced = quote(tour, 4);
    if (priced.quote) return "Request a Quote";
    return "From " + money(priced.daily) + " / person / day";
  }

  return {
    RATES: RATES,
    tierFor: tierFor,
    quote: quote,
    money: money,
    fromLabel: fromLabel
  };
});
