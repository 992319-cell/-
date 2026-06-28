(function () {
  var form = document.getElementById("searchForm");
  var content = document.getElementById("marketContent");
  var footer = document.getElementById("marketFooter");
  var sub = document.getElementById("recommendSub");
  var shopList = document.getElementById("shopList");
  var rendered = false;
  var swiper = null;
  var specStats = null;

  // ─── 推薦車行假資料 ───
  // 欄位：name 車行名 / city 城市 / area 區 / rating 評分 / orders 完工數
  //       heat 預約熱度 0~1 / price 對應價格 / photo 照片
  var SHOPS = [
    {
      name: "三益車業",
      city: "新北",
      area: "淡水區",
      rating: 4.9,
      orders: 320,
      heat: 0.9,
      price: 190,
      photo: "./圖片素材/shop/shop-1.jpg",
    },
    {
      name: "順發機車",
      city: "新北",
      area: "鶯歌區",
      rating: 4.8,
      orders: 240,
      heat: 0.85,
      price: 280,
      photo: "./圖片素材/shop/shop-2.jpg",
    },
    {
      name: "三益保養廠",
      city: "新北",
      area: "三重區",
      rating: 4.7,
      orders: 280,
      heat: 0.78,
      price: 210,
      photo: "./圖片素材/shop/shop-3.jpg",
    },
    {
      name: "大昌車業",
      city: "新北",
      area: "新莊區",
      rating: 4.6,
      orders: 198,
      heat: 0.72,
      price: 230,
      photo: "./圖片素材/shop/shop-6.jpg",
    },
    {
      name: "好順機車",
      city: "新北",
      area: "板橋區",
      rating: 4.5,
      orders: 165,
      heat: 0.65,
      price: 250,
      photo: "./圖片素材/shop/shop-5.jpg",
    },
  ];

  // 綜合分數：預約熱度*0.5 + 評分*0.3 + 完工數正規化*0.2
  function scoreShops(shops) {
    var maxOrders = Math.max.apply(
      null,
      shops.map(function (s) {
        return s.orders;
      }),
    );
    return shops
      .map(function (s) {
        return {
          shop: s,
          score:
            s.heat * 0.5 + (s.rating / 5) * 0.3 + (s.orders / maxOrders) * 0.2,
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (x) {
        return x.shop;
      });
  }

  function renderCards(shops) {
    var html = shops
      .map(function (s) {
        return (
          "" +
          '<div class="swiper-slide">' +
          '<article class="market-shop-card">' +
          '<div class="market-shop-card__photo" style="background-image: url(\'' +
          s.photo +
          "');\"></div>" +
          '<div class="market-shop-card__body">' +
          '<p class="market-shop-card__area">' +
          s.city +
          "　" +
          s.area +
          "</p>" +
          '<h4 class="market-shop-card__name">' +
          s.name +
          "</h4>" +
          '<div class="market-shop-card__meta">' +
          "<span>★ " +
          s.rating.toFixed(1) +
          "</span>" +
          "<span>" +
          s.orders +
          " 筆完工</span>" +
          "</div>" +
          '<div class="market-shop-card__foot">' +
          '<span class="market-shop-card__price">$' +
          s.price +
          "</span>" +
          '<a class="market-shop-card__cta" href="ticket.html?shop=' +
          encodeURIComponent(s.name) +
          '">立即預約 →</a>' +
          "</div>" +
          "</div>" +
          "</article>" +
          "</div>"
        );
      })
      .join("");
    shopList.innerHTML = html;
  }

  // 副標動態 echo：抓 select 顯示文字（option 的 textContent）
  function updateSub() {
    var modelEl = document.getElementById("model");
    var cityEl = document.getElementById("city");
    var serviceEl = document.getElementById("service");
    var model = modelEl.value
      ? modelEl.options[modelEl.selectedIndex].text
      : "YAMAHA BWS'R";
    var city = cityEl.value
      ? cityEl.options[cityEl.selectedIndex].text
      : "台北市";
    var service = serviceEl.value
      ? serviceEl.options[serviceEl.selectedIndex].text
      : "機油更換";
    sub.innerHTML =
      "<span>" +
      model +
      "</span>" +
      "<span>" +
      service +
      "</span>" +
      "<span>" +
      city +
      "</span>" +
      "<span>共 " +
      SHOPS.length +
      " 家</span>";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    content.classList.remove("is-hidden");
    footer.classList.remove("is-hidden");
    updateSub();
    if (!rendered) {
      var specResult = Spectrum.render("#spec", null, { variant: "detail" });
      specStats = specResult && specResult.stats;
      renderCards(scoreShops(SHOPS));
      swiper = new Swiper(".mk-swiper", {
        slidesPerView: 1.15,
        spaceBetween: 16,
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: {
          prevEl: ".mk-swiper-prev",
          nextEl: ".mk-swiper-next",
        },
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 16 },
        },
      });
      rendered = true;
    }
    setTimeout(function () {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  });

  // 複製到 LINE：組行情摘要 → clipboard
  var copyBtn = document.getElementById("copyToLine");
  var copyHint = document.getElementById("copyHint");
  copyBtn.addEventListener("click", function () {
    var modelEl = document.getElementById("model");
    var cityEl = document.getElementById("city");
    var serviceEl = document.getElementById("service");
    var model = modelEl.value
      ? modelEl.options[modelEl.selectedIndex].text
      : "YAMAHA BWS'R";
    var city = cityEl.value
      ? cityEl.options[cityEl.selectedIndex].text
      : "台北市";
    var service = serviceEl.value
      ? serviceEl.options[serviceEl.selectedIndex].text
      : "機油更換";

    var lines = [];
    lines.push("【明前知行　行情報告】");
    lines.push(model + "　" + service + "　" + city);
    lines.push("");
    if (specStats) {
      lines.push("中位數　$" + Math.round(specStats.median));
      lines.push(
        "合理區間　$" +
          Math.round(specStats.p25) +
          " – $" +
          Math.round(specStats.p75),
      );
      lines.push("最低 $" + specStats.min + "　最高 $" + specStats.max);
      lines.push("樣本　" + specStats.count + " 筆已完成工單");
      lines.push("");
    }
    lines.push("附 " + SHOPS.length + " 家推薦，點連結看");
    lines.push("https://mingqian.example/market");
    var text = lines.join("\n");

    function showHint(msg) {
      copyHint.textContent = msg;
      setTimeout(function () {
        copyHint.textContent = "";
      }, 2400);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showHint("已複製，貼到 LINE 即可分享");
        },
        function () {
          showHint("複製失敗，請手動選取");
        },
      );
    } else {
      // fallback
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showHint("已複製，貼到 LINE 即可分享");
      } catch (err) {
        showHint("複製失敗，請手動選取");
      }
      document.body.removeChild(ta);
    }
  });
})();
