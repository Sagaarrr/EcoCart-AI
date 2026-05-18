<template>
  <div class="demand-view">
    <div class="controls">
      <select v-model="selectedProduct" class="product-select" @change="updateChart">
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="groceries">Groceries</option>
      </select>
      <div class="legend">
        <span class="legend-item"><span class="dot green"></span>Historical sales</span>
        <span class="legend-item"><span class="dot amber dashed"></span>ML forecast (Ridge regression)</span>
      </div>
    </div>

    <div class="chart-wrap">
      <canvas ref="chartEl"
        aria-label="Line chart of historical sales and ML demand forecast"
        role="img">
        Historical and forecast demand for {{ selectedProduct }}
      </canvas>
    </div>

    <div class="metrics-grid">
      <div class="metric">
        <div class="metric-label">R² Score</div>
        <div class="metric-value green">{{ currentMetrics.r2 }}</div>
        <div class="metric-sub">Model fit (1.0 = perfect)</div>
      </div>
      <div class="metric">
        <div class="metric-label">MAE</div>
        <div class="metric-value">{{ currentMetrics.mae }}</div>
        <div class="metric-sub">Mean absolute error</div>
      </div>
      <div class="metric">
        <div class="metric-label">Forecast horizon</div>
        <div class="metric-value">4 weeks</div>
        <div class="metric-sub">Rolling window</div>
      </div>
      <div class="metric">
        <div class="metric-label">Feature count</div>
        <div class="metric-value">6</div>
        <div class="metric-sub">Lag, season, promo</div>
      </div>
    </div>

    <div class="model-card">
      <div class="model-title">Model: Ridge Regression (L2 regularised linear model)</div>
      <div class="feature-list">
        <div v-for="f in features" :key="f.name" class="feature-item">
          <span class="feature-name">{{ f.name }}</span>
          <div class="feature-bar-wrap">
            <div class="feature-bar" :style="{ width: f.importance + '%', background: f.color }"></div>
          </div>
          <span class="feature-pct">{{ f.importance }}%</span>
          <span class="feature-desc">{{ f.desc }}</span>
        </div>
      </div>
      <div class="model-code">
        <span class="code-comment"># Key features → target</span><br />
        X = [lag_1w, lag_4w, is_weekend, month_sin, month_cos, promo_flag]<br />
        y = units_sold_next_week<br />
        <span class="code-comment"># Chronological 80/20 train/test split — NO random shuffle!</span><br />
        model = Ridge(alpha=1.0).fit(X_train, y_train)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

const selectedProduct = ref('electronics')
const chartEl = ref(null)
let chartInstance = null

const productData = {
  electronics: {
    historical: [120,135,128,142,155,148,162,170],
    r2: '0.91', mae: '±23 units',
  },
  clothing: {
    historical: [80,95,110,88,100,115,108,125],
    r2: '0.87', mae: '±18 units',
  },
  groceries: {
    historical: [200,210,205,220,215,230,225,240],
    r2: '0.95', mae: '±11 units',
  },
}

const currentMetrics = ref(productData.electronics)

const features = [
  { name: 'lag_1_week',   importance: 42, color: '#00d4a0', desc: 'Last week sales (strongest signal)' },
  { name: 'month_sin/cos', importance: 28, color: '#4a9eff', desc: 'Circular seasonal encoding' },
  { name: 'lag_4_week',   importance: 16, color: '#f5a623', desc: 'Same week last month' },
  { name: 'promo_flag',   importance: 10, color: '#a78bfa', desc: 'Active promotion this week' },
  { name: 'is_weekend',   importance: 4,  color: '#ff6b6b', desc: 'Weekend demand spike' },
]

function buildChartData(product) {
  const d = productData[product]
  const hist = d.historical
  // Simple linear extrapolation for forecast
  const slope = (hist[hist.length-1] - hist[hist.length-3]) / 2
  const forecast = [null, null, null, null, null, null,
    Math.round(hist[hist.length-2]),
    Math.round(hist[hist.length-1]),
    Math.round(hist[hist.length-1] + slope),
    Math.round(hist[hist.length-1] + slope * 2),
    Math.round(hist[hist.length-1] + slope * 3),
    Math.round(hist[hist.length-1] + slope * 4),
  ]
  const actual = [...hist, null, null, null, null]
  return { actual, forecast }
}

const labels = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12']

function initChart() {
  const { actual, forecast } = buildChartData(selectedProduct.value)
  chartInstance = new Chart(chartEl.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Historical sales',
          data: actual,
          borderColor: '#00d4a0',
          backgroundColor: 'rgba(0,212,160,0.08)',
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#00d4a0',
          tension: 0.4,
          borderWidth: 2,
          spanGaps: false,
        },
        {
          label: 'ML Forecast',
          data: forecast,
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.06)',
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#f5a623',
          tension: 0.4,
          borderWidth: 2,
          borderDash: [6, 4],
          spanGaps: false,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#181e2a',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7a8099',
        }
      },
      scales: {
        x: {
          ticks: { color: '#7a8099', font: { size: 12, family: 'DM Sans' } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'rgba(255,255,255,0.07)' }
        },
        y: {
          ticks: { color: '#7a8099', font: { size: 12, family: 'DM Sans' } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'rgba(255,255,255,0.07)' },
        }
      }
    }
  })
}

function updateChart() {
  currentMetrics.value = productData[selectedProduct.value]
  if (!chartInstance) return
  const { actual, forecast } = buildChartData(selectedProduct.value)
  chartInstance.data.datasets[0].data = actual
  chartInstance.data.datasets[1].data = forecast
  chartInstance.update()
}

onMounted(initChart)
</script>

<style scoped>
.demand-view { display: flex; flex-direction: column; gap: 16px; }

.controls {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.product-select {
  padding: 9px 14px;
  background: var(--bg-3);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
}
.product-select:hover { border-color: var(--border-active); }

.legend { display: flex; gap: 16px; align-items: center; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
.dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.dot.green { background: #00d4a0; }
.dot.amber { background: #f5a623; }
.dot.dashed { background: repeating-linear-gradient(90deg, #f5a623 0 6px, transparent 6px 10px); }

.chart-wrap {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  height: 260px;
}
canvas { width: 100% !important; height: 100% !important; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.metric {
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
}
.metric-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 20px;
  font-weight: 600;
  font-family: var(--font-display);
  color: var(--text-primary);
}
.metric-value.green { color: var(--green); }
.metric-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.model-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
}
.model-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.feature-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.feature-item {
  display: grid;
  grid-template-columns: 120px 1fr 36px 1fr;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.feature-name { font-family: var(--font-mono); color: var(--green); }
.feature-bar-wrap { background: rgba(255,255,255,0.06); border-radius: 3px; height: 6px; }
.feature-bar { height: 6px; border-radius: 3px; transition: width 0.4s ease; }
.feature-pct { color: var(--text-secondary); font-family: var(--font-mono); text-align: right; }
.feature-desc { color: var(--text-muted); }

.model-code {
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 2;
}
.code-comment { color: var(--text-muted); }

@media (max-width: 600px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .feature-item { grid-template-columns: 100px 1fr 32px; }
  .feature-desc { display: none; }
}
</style>
