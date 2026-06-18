// ─── trend-chart.js ──────────────────────────────
// 車行後台「近 30 天營收趨勢」折線圖
// 依賴 Chart.js 4.x
// ─────────────────────────────────────────────────

(function () {
  const canvas = document.getElementById("trend-chart");
  if (!canvas || typeof Chart === "undefined") return;

  // ─── 生成 30 天日期 label（從 30 天前到今天）──
  const labels = [];
  const today = new Date(2025, 5, 11); // 鎖 6/11 demo 用
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }

  // ─── 三組假資料──
  const data = {
    revenue: [
      1200,
      1450,
      980,
      1320,
      1680,
      2100,
      1850, // week 1
      1420,
      1580,
      1720,
      1340,
      1900,
      2280,
      2050, // week 2
      1680,
      1820,
      1950,
      1740,
      2150,
      2480,
      2320, // week 3
      1890,
      2080,
      2240,
      1980,
      2380,
      2680,
      2480,
      2620,
      2820, // week 4+
    ],
    orders: [
      3, 4, 2, 3, 5, 6, 5, 4, 4, 5, 3, 5, 7, 6, 5, 5, 6, 5, 6, 8, 7, 6, 6, 7, 6,
      7, 9, 8, 8, 9,
    ],
    ratings: [
      4.8, 4.9, 4.7, 4.8, 4.9, 5.0, 4.9, 4.8, 4.9, 4.9, 4.7, 4.9, 5.0, 4.9, 4.9,
      4.9, 5.0, 4.9, 4.9, 5.0, 5.0, 4.9, 5.0, 5.0, 4.9, 5.0, 5.0, 5.0, 4.9, 5.0,
    ],
  };

  const metricMeta = {
    revenue: { label: "營收", prefix: "$", suffix: "", yMin: 0, yMax: undefined },
    orders: { label: "工單數", prefix: "", suffix: " 張", yMin: 0, yMax: undefined },
    ratings: { label: "評分", prefix: "", suffix: " ★", yMin: 4, yMax: 5 },
  };

  // ─── 雜誌感配色 ──
  const accentDeep = "#0F2D6E";
  const accent = "#5275c6";
  const muted = "#777";
  const lineColor = "#e6e6e6";

  // ─── 漸層 fill（淡藍 → 透明）──
  const ctx = canvas.getContext("2d");
  function makeGradient() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 240);
    g.addColorStop(0, "rgba(82, 117, 198, 0.25)");
    g.addColorStop(1, "rgba(82, 117, 198, 0)");
    return g;
  }

  let chart;

  function buildChart(metric) {
    const meta = metricMeta[metric];
    const values = data[metric];

    const config = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: meta.label,
            data: values,
            borderColor: accentDeep,
            borderWidth: 2,
            backgroundColor: makeGradient(),
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#fac23f",
            pointHoverBorderColor: accentDeep,
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0F2D6E",
            titleColor: "#fff",
            bodyColor: "#fff",
            titleFont: {
              family: "'Noto Sans TC', sans-serif",
              size: 12,
              weight: "500",
            },
            bodyFont: {
              family: "'Noto Sans TC', sans-serif",
              size: 13,
              weight: "500",
            },
            padding: 10,
            cornerRadius: 3,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y;
                const formatted = metric === "revenue" ? v.toLocaleString() : v;
                return `${meta.label}：${meta.prefix}${formatted}${meta.suffix}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: muted,
              font: { family: "'Noto Sans TC', sans-serif", size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
            },
          },
          y: {
            min: meta.yMin,
            max: meta.yMax,
            grid: { color: lineColor, drawTicks: false },
            border: { display: false },
            ticks: {
              color: muted,
              font: { family: "'Noto Sans TC', sans-serif", size: 11 },
              padding: 8,
              callback: (v) => {
                if (metric === "revenue") return "$" + v.toLocaleString();
                return v;
              },
            },
          },
        },
        animation: { duration: 600, easing: "easeOutCubic" },
      },
    };

    if (chart) chart.destroy();
    chart = new Chart(ctx, config);

    // 同步標題
    const titleEl = document.getElementById("trend-title");
    if (titleEl) titleEl.textContent = `近 30 天${meta.label}趨勢`;
  }

  // 初始畫營收
  buildChart("revenue");

  // ─── tab 切換 ──
  document.querySelectorAll(".trend-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".trend-tabs button")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const metric = btn.dataset.metric || "revenue";
      buildChart(metric);
    });
  });
})();
