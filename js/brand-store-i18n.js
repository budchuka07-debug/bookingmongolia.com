(function (global) {
  var STRINGS = {
    en: {
      kicker: "Mongolia Brand Store",
      hero_title: "Discover Authentic Mongolia",
      hero_sub: "Shop Mongolian Cashmere, Traditional Crafts, Art and Heritage Products.",
      hero_cta: "Explore the Collection",
      seller_cta: "Become a Seller",
      cats_title: "The collection",
      products_title: "Featured Mongolian products",
      products_lead: "Only products approved by Booking Mongolia appear here. Nothing on this page is for sale until a Mongolian maker is approved.",
      empty_products: "No published products yet. Mongolian makers can apply, and approved work will be listed with its real price.",
      preview_title: "How a product card will look",
      preview_text: "Layout preview. This is not a product, not a brand, and not for sale.",
      made_title: "Made in Mongolia",
      made_text: "The store is for work made in Mongolia by Mongolian artisans, artists, designers and manufacturers. Buying from them keeps cashmere, leather, felt, painting and ger-making skills at home.",
      brands_title: "Mongolian brands",
      brands_empty: "Approved makers will be named here. No brand is shown before it is approved.",
      travel_title: "Visited Mongolia? Take the Experience Home.",
      travel_text: "Travelers who booked a journey with Booking Mongolia can come back to this store for a piece of what they saw. The shop is a separate part of Booking Mongolia, beside the tours.",
      view: "View Product",
      origin: "Mongolia",
      price_unset: "Price not set",
      currency_note: "Prices stay in the maker’s currency. Conversion is not turned on.",
      cart: "Saved on this device",
      cart_empty: "Nothing is saved. Checkout is not open, and this list is not an order.",
      add: "Add to Cart",
      inquire: "Inquiry / Contact Seller",
      not_order: "Saved on this device only. Checkout is not open, so this is not an order.",
      no_product: "No published product is at this address.",
      materials: "Materials",
      shipping: "Shipping",
      shipping_fallback: "Shipping is confirmed with the maker before any payment.",
      stock: "Stock",
      sizes: "Sizes",
      colors: "Colors",
      sizes_empty: "The maker has not listed sizes.",
      colors_empty: "The maker has not listed colors.",
      send: "Send application",
      sent: "Your application is saved as Pending. It is not public until Booking Mongolia approves it.",
      fail: "The application was not saved. The Brand Store tables still need to be created in Supabase, so nothing was published.",
      inquiry_sent: "Your inquiry is saved as Pending. It was not sent to a seller automatically.",
      confirm_origin: "I confirm these products are made in Mongolia."
    },
    mn: {
      kicker: "Mongolia Brand Store",
      hero_title: "Жинхэнэ Монголыг нээ",
      hero_sub: "Монгол ноолуур, уламжлалт гар урлал, урлаг, өвийн бүтээгдэхүүн.",
      hero_cta: "Цуглуулгыг үзэх",
      seller_cta: "Худалдаачин болох",
      cats_title: "Цуглуулга",
      products_title: "Онцлох Монгол бүтээгдэхүүн",
      products_lead: "Энд зөвхөн баталгаажсан бүтээгдэхүүн гарна. Батлагдахаас өмнө юу ч зарагдсан гэж харагдахгүй.",
      empty_products: "Нийтлэгдсэн бүтээгдэхүүн одоогоор алга.",
      preview_title: "Карт хожим ингэж харагдана",
      preview_text: "Энэ бол загварын зураг. Бүтээгдэхүүн биш, брэнд биш, худалдаа биш.",
      made_title: "Монголд үйлдвэрлэсэн",
      made_text: "Энэ дэлгүүр Монголд, Монгол урчууд, зураачид, дизайнер, үйлдвэрлэгчдийн хийсэн зүйлд зориулагдсан.",
      brands_title: "Монгол брэндүүд",
      brands_empty: "Баталгаажсан үйлдвэрлэгч энд нэрээрээ гарна.",
      travel_title: "Монголд ирсэн үү? Тэр аяллаа авч харь.",
      travel_text: "Booking Mongolia-р аялсан зочид эндээс харсан зүйлийнхээ нэг хэсгийг авч болно. Дэлгүүр нь аяллаас тусдаа хэсэг.",
      view: "Бүтээгдэхүүн үзэх",
      origin: "Монгол",
      price_unset: "Үнэ оруулаагүй",
      currency_note: "Үнэ үйлдвэрлэгчийн валютаараа үлдэнэ. Хөрвүүлэлт хаагдсан.",
      cart: "Энэ төхөөрөмж дээр хадгалсан",
      cart_empty: "Хадгалсан зүйл алга. Төлбөр нээгдээгүй тул энэ жагсаалт захиалга биш.",
      add: "Сагсанд хийх",
      inquire: "Асуух / худалдаачинтай холбогдох",
      not_order: "Зөвхөн энэ төхөөрөмж дээр хадгалагдана. Төлбөр нээгээгүй тул захиалга биш.",
      no_product: "Энэ хаяг дээр нийтлэгдсэн бүтээгдэхүүн алга.",
      materials: "Материал",
      shipping: "Хүргэлт",
      shipping_fallback: "Хүргэлтийг төлбөрөөс өмнө үйлдвэрлэгчтэй нь баталгаажуулна.",
      stock: "Нөөц",
      sizes: "Хэмжээ",
      colors: "Өнгө",
      sizes_empty: "Хэмжээ оруулаагүй.",
      colors_empty: "Өнгө оруулаагүй.",
      send: "Өргөдөл илгээх",
      sent: "Өргөдөл Pending төлөвөөр хадгалагдлаа. Батлахаас өмнө нийтэд гарахгүй.",
      fail: "Өргөдөл хадгалагдаагүй. Supabase дээрх хүснэгтийг үүсгээгүй байж болно.",
      inquiry_sent: "Асуулт Pending төлөвөөр хадгалагдлаа. Худалдаачин руу автоматаар очоогүй.",
      confirm_origin: "Эдгээр бүтээгдэхүүн Монголд хийгдсэнийг баталж байна."
    },
    ko: {
      kicker: "Mongolia Brand Store",
      hero_title: "진짜 몽골을 만나다",
      hero_sub: "몽골 캐시미어, 전통 공예, 예술과 문화 상품.",
      hero_cta: "컬렉션 보기",
      seller_cta: "판매자 신청",
      cats_title: "컬렉션",
      products_title: "추천 몽골 제품",
      products_lead: "승인된 제품만 표시됩니다. 승인 전에는 판매 상품으로 보이지 않습니다.",
      empty_products: "게시된 제품이 아직 없습니다.",
      preview_title: "제품 카드의 자리",
      preview_text: "레이아웃 미리보기입니다. 상품도, 브랜드도, 판매도 아닙니다.",
      made_title: "몽골에서 만들다",
      made_text: "이 상점은 몽골의 장인, 예술가, 디자이너, 제조사가 몽골에서 만든 것만 다룹니다.",
      brands_title: "몽골 브랜드",
      brands_empty: "승인된 제작자만 여기에 표시됩니다.",
      travel_title: "몽골을 다녀오셨나요? 그 경험을 집으로.",
      travel_text: "Booking Mongolia 여행과는 별도인 상점입니다.",
      view: "제품 보기",
      origin: "몽골",
      price_unset: "가격 미정",
      currency_note: "가격은 제작자가 정한 통화 그대로입니다. 환전은 꺼져 있습니다.",
      cart: "이 기기에 저장됨",
      cart_empty: "저장된 항목이 없습니다. 결제가 열리지 않았으므로 주문이 아닙니다.",
      add: "장바구니에 담기",
      inquire: "문의 / 판매자에게 연락",
      not_order: "이 기기에만 저장됩니다. 결제가 없으므로 주문이 아닙니다.",
      no_product: "이 주소에 게시된 제품이 없습니다.",
      materials: "소재",
      shipping: "배송",
      shipping_fallback: "배송은 결제 전에 제작자와 확인합니다.",
      stock: "재고",
      sizes: "사이즈",
      colors: "색상",
      sizes_empty: "사이즈가 등록되지 않았습니다.",
      colors_empty: "색상이 등록되지 않았습니다.",
      send: "신청 보내기",
      sent: "신청이 Pending 상태로 저장되었습니다. 승인 전에는 공개되지 않습니다.",
      fail: "신청이 저장되지 않았습니다. Supabase 테이블이 아직 없을 수 있습니다.",
      inquiry_sent: "문의가 Pending 상태로 저장되었습니다.",
      confirm_origin: "이 제품이 몽골에서 만들어졌음을 확인합니다."
    },
    ja: {
      kicker: "Mongolia Brand Store",
      hero_title: "本物のモンゴルに出会う",
      hero_sub: "モンゴルのカシミヤ、伝統工芸、アート、文化の品。",
      hero_cta: "コレクションを見る",
      seller_cta: "出品を申請する",
      cats_title: "コレクション",
      products_title: "注目のモンゴル製品",
      products_lead: "承認された製品だけを表示します。承認前の品は販売中として出しません。",
      empty_products: "公開された製品はまだありません。",
      preview_title: "製品カードの見本",
      preview_text: "レイアウトの見本です。商品でもブランドでも販売でもありません。",
      made_title: "モンゴル製",
      made_text: "この店は、モンゴルの職人、芸術家、デザイナー、製造者がモンゴルで作ったものだけを扱います。",
      brands_title: "モンゴルのブランド",
      brands_empty: "承認された作り手だけがここに名前を出します。",
      travel_title: "モンゴルを旅したあとに、その体験を持ち帰る。",
      travel_text: "店はツアーとは別の Booking Mongolia の部門です。",
      view: "製品を見る",
      origin: "モンゴル",
      price_unset: "価格未設定",
      currency_note: "価格は作り手の通貨のままです。換算は行いません。",
      cart: "この端末に保存",
      cart_empty: "保存した品はありません。決済は開いていないので、これは注文ではありません。",
      add: "カートに入れる",
      inquire: "問い合わせ / 作り手へ連絡",
      not_order: "この端末だけに保存されます。決済はないので注文ではありません。",
      no_product: "このアドレスに公開された製品はありません。",
      materials: "素材",
      shipping: "配送",
      shipping_fallback: "配送は支払いの前に作り手と確認します。",
      stock: "在庫",
      sizes: "サイズ",
      colors: "色",
      sizes_empty: "サイズはまだありません。",
      colors_empty: "色はまだありません。",
      send: "申請を送る",
      sent: "申請は Pending で保存されました。承認されるまで公開されません。",
      fail: "申請は保存されませんでした。Supabase の表がまだない可能性があります。",
      inquiry_sent: "問い合わせは Pending で保存されました。",
      confirm_origin: "これらの製品がモンゴル製であることを確認します。"
    }
  };

  var lang = "en";
  try {
    lang = localStorage.getItem("bm_store_lang") || "en";
  } catch (e) {}
  if (!STRINGS[lang]) lang = "en";

  function t(key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  }

  function apply() {
    document.documentElement.lang = lang === "mn" ? "mn" : lang;
    document.querySelectorAll("[data-store-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-store-i18n");
      if (STRINGS.en[key]) el.textContent = t(key);
    });
    document.querySelectorAll("[data-store-lang]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-store-lang") === lang);
    });
  }

  function setLang(next) {
    if (!STRINGS[next]) return;
    lang = next;
    try { localStorage.setItem("bm_store_lang", lang); } catch (e) {}
    apply();
    if (global.BMStore && typeof global.BMStore.refresh === "function") global.BMStore.refresh();
  }

  global.BMStoreI18n = { t: t, setLang: setLang, apply: apply };
  document.querySelectorAll("[data-store-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.getAttribute("data-store-lang")); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
})(typeof window !== "undefined" ? window : globalThis);
