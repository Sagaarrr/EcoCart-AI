<template>
  <div class="seg-view">
    <div class="top-row">
      <div class="bias-alert">
        <div class="bias-title">⚠ Bias detected — Urban/Rural imbalance</div>
        <div class="bias-body">Raw K-Means clusters rural customers as "Dormant" due to lower purchase frequency (a delivery availability confound, not actual intent). Mitigation: SMOTE oversampling + stratified clustering.</div>
      </div>
      <div class="toggle-wrap">
        <span class="toggle-label">Show bias mitigation</span>
        <label class="toggle">
          <input type="checkbox" v-model="showMitigation" @change="updateChart" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <div class="chart-wrap">
      <canvas ref="chartEl"
        role="img"
        aria-label="Scatter plot of customer segments by purchase frequency and average order value">
        Customer segments scatter plot
      </canvas>
    </div>

    <div class="segments-grid">
      <div v-for="seg in segments" :key="seg.name" class="seg-card">
        <div class="seg-header">
          <span class="seg-dot" :style="{ background: seg.color }"></span>
          <span class="seg-name">{{ seg.name }}</span>
          <span class="seg-pct">{{ seg.pct }}</span>
        </div>
        <div class="seg-desc">{{ seg.desc }}</div>
        <div class="seg-action">→ {{ seg.action }}</div>
      </div>
    </div>

    <div class="bias-table-wrap">
      <div class="bias-table-title">Bias Mitigation Results</div>
      <table>
        <thead>
          <tr>
            <th>Segment</th>
            <th>Rural % (before)</th>
            <th>Rural % (after SMOTE)</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in biasRows" :key="r.seg">
            <td>{{ r.seg }}</td>
            <td class="before">{{ r.before }}</td>
            <td class="after">{{ r.after }}</td>
            <td :class="r.positive ? 'pos' : 'neg'">{{ r.delta }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Chart, ScatterController, PointElement,
  LinearScale, Tooltip, Legend
} from 'chart.js'

Chart.register(ScatterController, PointElement, LinearScale, Tooltip, Legend)

const chartEl = ref(null)
const showMitigation = ref(false)
let chartInstance = null

const segments = [
  { name: 'High Value',  color: '#00d4a0', pct: '18%', desc: 'Frequent buyers, high AOV. Target for loyalty perks.', action: 'Retain with premium tier' },
  { name: 'Growth',      color: '#4a9eff', pct: '34%', desc: 'Rising spend, moderate frequency. Most scalable segment.', action: 'Upsell with personalised recs' },
  { name: 'At Risk',     color: '#f5a623', pct: '28%', desc: 'Previously active, recent churn signal detected.', action: 'Re-engage with discount' },
  { name: 'Dormant',     color: '#ff6b6b', pct: '20%', desc: 'Rural over-represented. Bias-corrected cluster shows delivery as key barrier.', action: 'Rural delivery expansion' },
]

const biasRows = [
  { seg: 'High Value', before: '5%', after: '23%', delta: '+18%', positive: true },
  { seg: 'Growth',     before: '18%', after: '31%', delta: '+13%', positive: true },
  { seg: 'At Risk',    before: '22%', after: '28%', delta: '+6%', positive: true },
  { seg: 'Dormant',    before: '71%', after: '29%', delta: '-42%', positive: false },
]

function seededRandom(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
}

function buildDatasets(mitigated) {
  const configs = [
    { seed: 42,  color: '#00d4a0', label: 'High Value', xRange: mitigated ? [7,10] : [7,10],  yRange: [120,160] },
    { seed: 99,  color: '#4a9eff', label: 'Growth',     xRange: mitigated ? [3,8]  : [3,8],   yRange: [60,110] },
    { seed: 7,   color: '#f5a623', label: 'At Risk',    xRange: mitigated ? [1,4]  : [1,4],   yRange: [35,70] },
    { seed: 31,  color: '#ff6b6b', label: 'Dormant',    xRange: mitigated ? [0.5,3] : [0.1,2], yRange: mitigated ? [15,50] : [10,30] },
  ]
  return configs.map(c => {
    const rng = seededRandom(c.seed)
    const count = mitigated ? 22 : 18
    return {
      label: c.label,
      data: Array.from({ length: count }, () => ({
        x: +(c.xRange[0] + rng() * (c.xRange[1] - c.xRange[0])).toFixed(2),
        y: +(c.yRange[0] + rng() * (c.yRange[1] - c.yRange[0])).toFixed(0),
      })),
      backgroundColor: c.color + 'bb',
      pointRadius: 7,
      pointHoverRadius: 9,
    }
  })
}

function initChart() {
  chartInstance = new Chart(chartEl.value, {
    type: 'scatter',
    data: { datasets: buildDatasets(false) },
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
          callbacks: {
            label: ctx => `${ctx.dataset.label}: freq=${ctx.parsed.x}, AOV=€${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Purchase frequency (orders/month)', color: '#7a8099', font: { size: 12, family: 'DM Sans' } },
          ticks: { color: '#7a8099', font: { size: 12 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'rgba(255,255,255,0.07)' },
          min: 0,
        },
        y: {
          title: { display: true, text: 'Avg order value (€)', color: '#7a8099', font: { size: 12, family: 'DM Sans' } },
          ticks: { color: '#7a8099', font: { size: 12 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'rgba(255,255,255,0.07)' },
          min: 0,
        }
      }
    }
  })
}

function updateChart() {
  if (!chartInstance) return
  chartInstance.data.datasets = buildDatasets(showMitigation.value)
  chartInstance.update()
}

onMounted(initChart)
</script>

<style scoped>
.seg-view { display: flex; flex-direction: column; gap: 16px; }

.top-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }

.bias-alert {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255,107,107,0.06);
  border: 1px solid rgba(255,107,107,0.25);
  border-radius: var(--radius-md);
}
.bias-title { font-size: 13px; font-weight: 600; color: #ff6b6b; margin-bottom: 6px; }
.bias-body { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }

.toggle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  min-width: 140px;
}
.toggle-label { font-size: 11px; color: var(--text-muted); text-align: center; }

.toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0;
  background: var(--bg-2);
  border: 1px solid var(--border-active);
  border-radius: 22px;
  transition: 0.3s;
  cursor: pointer;
}
.slider::before {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  left: 2px; top: 2px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: 0.3s;
}
input:checked + .slider { background: rgba(0,212,160,0.2); border-color: var(--green); }
input:checked + .slider::before { transform: translateX(18px); background: var(--green); }

.chart-wrap {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  height: 270px;
}
canvas { width: 100% !important; height: 100% !important; }

.segments-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.seg-card {
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
}
.seg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.seg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.seg-name { font-size: 13px; font-weight: 600; color: var(--text-primary); flex: 1; }
.seg-pct { font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); }
.seg-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
.seg-action { font-size: 12px; color: var(--blue); }

.bias-table-wrap {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.bias-table-title {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-3);
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 1px solid var(--border);
}
td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-secondary); }
tr:last-child td { border-bottom: none; }
td.before { color: #ff6b6b; }
td.after  { color: var(--green); }
td.pos    { color: var(--green); font-family: var(--font-mono); font-weight: 600; }
td.neg    { color: var(--amber); font-family: var(--font-mono); font-weight: 600; }

@media (max-width: 600px) {
  .segments-grid { grid-template-columns: 1fr; }
}
</style>
