/* ============================================================
   光譜儀元件 spectrum.js
   依賴：spectrum.css
   用法：
     Spectrum.render('#target', data, { variant: 'shock' });
     Spectrum.render('#target', data, { variant: 'detail', yourPrice: 240 });
     // 不傳 data 時用內建假資料
     Spectrum.render('#target', null, { variant: 'shock' });
   ============================================================ */

(function (window) {
  'use strict';

  /* ─── 內建假資料：50 筆機油更換工單，價格分布 80–480、中位 ~190 ─── */
  var FAKE_DATA = [
    { price:  80, shop: '永康保養', area: '台南' },
    { price: 480, shop: '順發信義', area: '台北' },
    { price: 140, shop: '光陽中山', area: '桃園' },
    { price: 215, shop: '光陽機車行', area: '桃園' },
    { price: 125, shop: '山葉中山', area: '高雄' },
    { price: 165, shop: '好修中山', area: '嘉義' },
    { price: 205, shop: '順發中山', area: '桃園' },
    { price: 165, shop: '順發莊敬', area: '新北' },
    { price: 405, shop: '光陽永和', area: '台南' },
    { price: 195, shop: '山葉中山', area: '台南' },
    { price: 185, shop: '順發三和', area: '桃園' },
    { price: 200, shop: '三陽東區', area: '台南' },
    { price: 115, shop: '山葉西區', area: '台南' },
    { price: 225, shop: '光陽永康', area: '台北' },
    { price: 290, shop: '三重保養廠', area: '台北' },
    { price: 210, shop: '順發大安', area: '台北' },
    { price: 120, shop: '順發中山', area: '台北' },
    { price: 125, shop: '三重保養廠', area: '高雄' },
    { price: 280, shop: '光陽永和', area: '嘉義' },
    { price: 150, shop: '三陽精品', area: '嘉義' },
    { price: 170, shop: '永康保養', area: '新竹' },
    { price: 180, shop: '好修文心', area: '高雄' },
    { price: 220, shop: '山葉西區', area: '新北' },
    { price: 210, shop: '光陽板橋', area: '嘉義' },
    { price: 200, shop: '光陽北屯', area: '台北' },
    { price: 165, shop: '三陽精品', area: '新竹' },
    { price: 170, shop: '三陽板橋', area: '台南' },
    { price: 140, shop: '光陽中山', area: '新北' },
    { price: 290, shop: '三陽公益', area: '台北' },
    { price: 165, shop: '光陽北屯', area: '新北' },
    { price: 200, shop: '光陽中山', area: '高雄' },
    { price: 165, shop: '三陽中和', area: '高雄' },
    { price: 205, shop: '好修敦化', area: '台南' },
    { price: 185, shop: '順發三和', area: '台中' },
    { price: 190, shop: '三重保養廠', area: '台中' },
    { price: 170, shop: '山葉永康', area: '新竹' },
    { price: 435, shop: '山葉中山', area: '新竹' },
    { price: 200, shop: '光陽民權', area: '台南' },
    { price: 190, shop: '山葉公益', area: '台南' },
    { price: 185, shop: '山葉西區', area: '新竹' },
    { price: 170, shop: '光陽北屯', area: '台北' },
    { price: 335, shop: '三陽東區', area: '台北' },
    { price: 125, shop: '三陽精品', area: '台南' },
    { price: 195, shop: '山葉信義', area: '台南' },
    { price: 190, shop: '三陽公益', area: '新北' },
    { price: 130, shop: '順發左營', area: '台中' },
    { price: 190, shop: '光陽板橋', area: '新竹' },
    { price: 290, shop: '順發三和', area: '新北' },
    { price: 150, shop: '永康保養', area: '新竹' },
    { price: 145, shop: '三陽東區', area: '新竹' },
    { price: 150, shop: '永康保養', area: '台北' },
    { price: 255, shop: '三陽苓雅', area: '台北' },
    { price: 200, shop: '光陽信義', area: '新竹' },
    { price: 215, shop: '光陽民權', area: '桃園' },
    { price: 310, shop: '光陽中山', area: '台中' },
    { price: 190, shop: '三陽板橋', area: '高雄' },
    { price: 155, shop: '好修敦化', area: '桃園' },
    { price: 170, shop: '山葉公益', area: '台南' },
    { price: 185, shop: '順發莊敬', area: '台中' },
    { price: 180, shop: '三陽精品', area: '新竹' },
    { price: 185, shop: '三陽板橋', area: '嘉義' },
    { price: 175, shop: '順發左營', area: '台北' },
    { price: 170, shop: '光陽板橋', area: '嘉義' },
    { price: 265, shop: '三陽中和', area: '桃園' },
    { price: 165, shop: '順發三和', area: '台南' },
    { price: 155, shop: '三陽中和', area: '台南' },
    { price: 175, shop: '三陽公益', area: '新北' },
    { price: 400, shop: '山葉博愛', area: '嘉義' },
    { price: 245, shop: '好修敦化', area: '台中' },
    { price: 215, shop: '山葉博愛', area: '台北' },
    { price: 220, shop: '光陽府中', area: '嘉義' },
    { price: 155, shop: '山葉信義', area: '新竹' },
    { price: 165, shop: '順發三和', area: '高雄' },
    { price: 215, shop: '順發中山', area: '台中' },
    { price: 140, shop: '三陽中和', area: '新竹' },
    { price: 175, shop: '山葉公益', area: '新北' },
    { price: 235, shop: '好修敦南', area: '新北' },
    { price: 150, shop: '永康保養', area: '新北' },
    { price: 190, shop: '光陽民權', area: '桃園' },
    { price: 185, shop: '光陽永康', area: '新北' },
    { price: 165, shop: '山葉博愛', area: '新北' },
    { price: 230, shop: '山葉博愛', area: '新北' },
    { price: 180, shop: '光陽永和', area: '新竹' },
    { price: 340, shop: '三陽精品', area: '台中' },
    { price: 175, shop: '三陽信義', area: '台南' },
    { price: 155, shop: '山葉永康', area: '新北' },
    { price: 155, shop: '光陽機車行', area: '新北' },
    { price: 370, shop: '山葉信義', area: '嘉義' },
    { price: 170, shop: '三陽公益', area: '台中' },
    { price: 440, shop: '光陽機車行', area: '嘉義' },
    { price: 300, shop: '光陽信義', area: '嘉義' },
    { price: 165, shop: '三陽東區', area: '台南' },
    { price: 160, shop: '三陽板橋', area: '桃園' },
    { price: 150, shop: '光陽永康', area: '台南' },
    { price: 180, shop: '順發三和', area: '桃園' },
    { price: 170, shop: '光陽永康', area: '桃園' },
    { price: 230, shop: '好修敦化', area: '台南' },
    { price: 160, shop: '山葉公益', area: '台北' },
    { price: 135, shop: '順發左營', area: '新北' },
    { price: 200, shop: '好修文心', area: '嘉義' }
  ];

  /* ─── 統計工具 ─── */
  function percentile(sortedAsc, p) {
    var idx = (p / 100) * (sortedAsc.length - 1);
    var lo = Math.floor(idx);
    var hi = Math.ceil(idx);
    if (lo === hi) return sortedAsc[lo];
    return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
  }

  function computeStats(data) {
    var sorted = data.slice().sort(function (a, b) { return a.price - b.price; });
    var prices = sorted.map(function (d) { return d.price; });
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      p10: percentile(prices, 10),
      p25: percentile(prices, 25),
      median: percentile(prices, 50),
      p75: percentile(prices, 75),
      p90: percentile(prices, 90),
      count: data.length,
      minRec: sorted[0],
      maxRec: sorted[sorted.length - 1],
      data: data
    };
  }

  function classifyPrice(price, stats) {
    // 五段分級對齊百分位：極低 <p10 / 偏低 p10–p25 / 合理 p25–p75 / 偏高 p75–p90 / 極高 >p90
    // 「合理」與綠 pill (IQR) 完全對齊
    if (price < stats.p10) return '極低';
    if (price < stats.p25) return '偏低';
    if (price <= stats.p75) return '合理';
    if (price <= stats.p90) return '偏高';
    return '極高';
  }

  /* ─── HTML 組裝 ─── */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildShopLabel(rec) {
    // 店名格式：「店名　地點」全形空格
    return escapeHtml(rec.shop) + '\u3000' + escapeHtml(rec.area);
  }

  function buildDots(stats, opts) {
    var range = stats.max - stats.min || 1;
    return stats.data.map(function (d, i) {
      var x = ((d.price - stats.min) / range) * 100;
      // beeswarm：用 hash-like jitter 避免重疊感
      var y = 20 + ((i * 41 + d.price * 3) % 60);
      var label = '$' + d.price + ' · ' + escapeHtml(d.shop);
      return '<span class="spec-dot" style="left:' + x.toFixed(2) + '%;top:' + y + '%;--i:' + i + '"' +
             ' data-label="' + label + '"></span>';
    }).join('');
  }

  function buildHTML(stats, opts) {
    var range = stats.max - stats.min || 1;
    function pos(v) { return ((v - stats.min) / range) * 100; }

    var iqrLeft = pos(stats.p25);
    var iqrRight = 100 - pos(stats.p75);
    var medPos = pos(stats.median);

    var youHTML = '';
    if (opts.yourPrice !== null && opts.yourPrice !== undefined) {
      var youPos = pos(opts.yourPrice);
      var youTag = classifyPrice(opts.yourPrice, stats);
      youHTML =
        '<div class="spec-you" style="left:' + youPos.toFixed(2) + '%">' +
          '<span class="spec-you-flag">' +
            '<span class="spec-you-num" data-anim-to="' + opts.yourPrice + '" data-anim-prefix="$">$' + opts.yourPrice + '</span>' +
            '<span class="spec-you-tag">' + youTag + ' · 你</span>' +
          '</span>' +
        '</div>';
    }

    var youSummary = '';
    if (opts.yourPrice !== null && opts.yourPrice !== undefined) {
      var tag = classifyPrice(opts.yourPrice, stats);
      youSummary =
        '<span class="spec-sum-sep">●</span>' +
        '<span class="spec-sum-item">' +
          '<span class="spec-sum-lbl">你的價格</span>' +
          '<span class="spec-sum-val spec-sum-val--warn">' +
            '<span data-anim-to="' + opts.yourPrice + '" data-anim-prefix="$">$' + opts.yourPrice + '</span>' +
            ' ' + tag +
          '</span>' +
        '</span>';
    }

    var p10pos = pos(stats.p10);
    var p25pos = iqrLeft;
    var p75pos = 100 - iqrRight;
    var p90pos = pos(stats.p90);
    // 每個 label 對齊到該區段的中點
    var z1 = (0 + p10pos) / 2;
    var z2 = (p10pos + p25pos) / 2;
    var z3 = (p25pos + p75pos) / 2;
    var z4 = (p75pos + p90pos) / 2;
    var z5 = (p90pos + 100) / 2;

    return (
      '<div class="spec spec--' + opts.variant + '">' +
        '<div class="spec-wrap">' +
          '<div class="spec-swarm">' + buildDots(stats, opts) + '</div>' +
          '<div class="spec-track">' +
            '<div class="spec-iqr" style="left:' + iqrLeft.toFixed(2) + '%;right:' + iqrRight.toFixed(2) + '%"></div>' +
            '<div class="spec-median" style="left:' + medPos.toFixed(2) + '%"></div>' +
            youHTML +
          '</div>' +
        '</div>' +
        '<div class="spec-anchors">' +
          '<div class="spec-anchor">' +
            '<span class="spec-cap">最低</span>' +
            '<span class="spec-val">$' + stats.min + '</span>' +
            '<span class="spec-shop">' + buildShopLabel(stats.minRec) + '</span>' +
          '</div>' +
          '<div class="spec-anchor spec-anchor--end">' +
            '<span class="spec-cap">最高</span>' +
            '<span class="spec-val">$' + stats.max + '</span>' +
            '<span class="spec-shop">' + buildShopLabel(stats.maxRec) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="spec-zones">' +
          '<span style="left:' + z1.toFixed(2) + '%">極低</span>' +
          '<span style="left:' + z2.toFixed(2) + '%">偏低</span>' +
          '<span class="ok" style="left:' + z3.toFixed(2) + '%">合理</span>' +
          '<span style="left:' + z4.toFixed(2) + '%">偏高</span>' +
          '<span style="left:' + z5.toFixed(2) + '%">極高</span>' +
        '</div>' +
        '<div class="spec-summary">' +
          '<span class="spec-sum-item">' +
            '<span class="spec-sum-lbl">中位數</span>' +
            '<span class="spec-sum-val" data-anim-to="' + Math.round(stats.median) + '" data-anim-prefix="$">$' + Math.round(stats.median) + '</span>' +
          '</span>' +
          '<span class="spec-sum-sep">　</span>' +
          '<span class="spec-sum-item">' +
            '<span class="spec-sum-lbl">合理區間</span>' +
            '<span class="spec-sum-val spec-sum-val--green">$' + Math.round(stats.p25) + ' – $' + Math.round(stats.p75) + '</span>' +
          '</span>' +
          youSummary +
        '</div>' +
        '<div class="spec-foot">' +
          '<span class="spec-foot-l">樣本　<strong>' + stats.count.toLocaleString() + '</strong>　筆已完成工單</span>' +
          '<span class="spec-foot-r">採中位數　避免極端值影響</span>' +
        '</div>' +
      '</div>'
    );
  }

  /* ─── 動畫：IntersectionObserver + 數字跳動 ─── */
  function animateNumber(el, target, prefix) {
    var dur = 1200;
    var start = performance.now();
    var pfx = prefix || '';
    function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var ease = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * ease);
      el.textContent = pfx + val;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function trigger(specEl) {
    specEl.classList.add('is-ready');
    var nums = specEl.querySelectorAll('[data-anim-to]');
    Array.prototype.forEach.call(nums, function (n) {
      var target = parseFloat(n.getAttribute('data-anim-to'));
      var prefix = n.getAttribute('data-anim-prefix') || '';
      animateNumber(n, target, prefix);
    });
  }

  function observe(specEl) {
    if (!('IntersectionObserver' in window)) {
      trigger(specEl);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          trigger(specEl);
          io.unobserve(specEl);
        }
      });
    }, { threshold: 0.25 });
    io.observe(specEl);
  }

  /* ─── 公開 API ─── */
  function render(selectorOrEl, data, options) {
    var container = typeof selectorOrEl === 'string'
      ? document.querySelector(selectorOrEl)
      : selectorOrEl;
    if (!container) return null;

    var opts = {
      variant: 'shock',
      yourPrice: null,
      animate: true
    };
    if (options) {
      for (var k in options) {
        if (Object.prototype.hasOwnProperty.call(options, k)) {
          opts[k] = options[k];
        }
      }
    }

    var useData = (data && data.length) ? data : FAKE_DATA;
    var stats = computeStats(useData);

    container.innerHTML = buildHTML(stats, opts);
    var specEl = container.querySelector('.spec');

    // 觸控裝置 tooltip：點擊切換 .is-active，外部點擊關閉
    bindTouchTooltip(specEl);

    if (opts.animate) {
      observe(specEl);
    } else {
      trigger(specEl);
    }

    return { stats: stats, el: specEl };
  }

  function bindTouchTooltip(specEl) {
    specEl.addEventListener('click', function (e) {
      var dot = e.target.closest && e.target.closest('.spec-dot');
      var dots = specEl.querySelectorAll('.spec-dot.is-active');
      Array.prototype.forEach.call(dots, function (d) {
        if (d !== dot) d.classList.remove('is-active');
      });
      if (dot) {
        dot.classList.toggle('is-active');
        e.stopPropagation();
      }
    });
    // 點 spec 以外的地方關掉所有 active
    document.addEventListener('click', function (e) {
      if (!specEl.contains(e.target)) {
        var dots = specEl.querySelectorAll('.spec-dot.is-active');
        Array.prototype.forEach.call(dots, function (d) {
          d.classList.remove('is-active');
        });
      }
    });
  }

  window.Spectrum = {
    render: render,
    fakeData: FAKE_DATA,
    computeStats: computeStats,
    classifyPrice: classifyPrice
  };

})(window);
