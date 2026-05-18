<template>
  <div class="compare-view">
    <div class="insight-bar">
      <span class="insight-icon">💡</span>
      <span>
        A* is superior for urban networks (fewer nodes explored, fast heuristic). IDA* wins in rural/edge deployments where RAM is limited — it uses O(d) memory vs O(b^d) for A*.
      </span>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Nodes Explored</div>
        <canvas ref="nodesChart" aria-label="Bar chart comparing nodes explored by A* and IDA* in urban and rural networks"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">Memory Usage (nodes stored)</div>
        <canvas ref="memChart" aria-label="Bar chart comparing memory usage of A* and IDA*"></canvas>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>A* Urban</th>
            <th>A* Rural</th>
            <th>IDA* Urban</th>
            <th>IDA* Rural</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="row.metric">
            <td class="metric-col">{{ row.metric }}</td>
            <td v-html="row.astar_urban"></td>
            <td v-html="row.astar_rural"></td>
            <td v-html="row.idastar_urban"></td>
            <td v-html="row.idastar_rural"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="verdict-grid">
      <div class="verdict-card green">
        <div class="verdict-title">A* — Best for Urban</div>
        <div class="verdict-body">Dense graph, reliable heuristic, memory available. Priority queue avoids redundant expansions. Explored 18 nodes vs IDA*'s 34 on same graph.</div>
      </div>
      <div class="verdict-card amber">
        <div class="verdict-title">IDA* — Best for Rural / Edge</div>
        <div class="verdict-body">Sparse graph, limited RAM on vehicle hardware. Stores only current path (4 nodes) vs A*'s full open list. Same optimal path, 78% less memory.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const nodesChart = ref(null)
const memChart = ref(null)

const tableData = [
  { metric: 'Nodes explored',    astar_urban: '18', astar_rural: '12', idastar_urban: '34', idastar_rural: '22' },
  { metric: 'Path cost (km)',    astar_urban: '47', astar_rural: '89', idastar_urban: '47', idastar_rural: '89' },
  { metric: 'Memory (nodes)',    astar_urban: '18', astar_rural: '12', idastar_urban: '4',  idastar_rural: '4'  },
  { metric: 'Time complexity',   astar_urban: 'O(b^d)', astar_rural: 'O(b^d)', idastar_urban: 'O(b^d)', idastar_rural: 'O(b^d)' },
  { metric: 'Space complexity',  astar_urban: 'O(b^d)', astar_rural: 'O(b^d)', idastar_urban: 'O(d)', idastar_rural: 'O(d)' },
  { metric: 'Optimal?',         astar_urban: '<span class="badge green">Yes</span>', astar_rural: '<span class="badge green">Yes</span>', idastar_urban: '<span class="badge green">Yes</span>', idastar_rural: '<span class="badge green">Yes</span>' },
  { metric: 'EcoCart fit?',     astar_urban: '<span class="badge green">Urban ✓</span>', astar_rural: '—', idastar_urban: '—', idastar_rural: '<span class="badge amber">Rural ✓</span>' },
]

const chartOptions = (max) => ({
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
      max,
      ticks: { color: '#7a8099', font: { size: 12, family: 'DM Sans' } },
      grid: { color: 'rgba(255,255,255,0.05)' },
      border: { color: 'rgba(255,255,255,0.07)' },
      beginAtZero: true
    }
  }
})

onMounted(() => {
  new Chart(nodesChart.value, {
    type: 'bar',
    data: {
      labels: ['Urban', 'Rural'],
      datasets: [
        { label: 'A*', data: [18, 12], backgroundColor: '#00d4a0', borderRadius: 6, borderSkipped: false },
        { label: 'IDA*', data: [34, 22], backgroundColor: '#4a9eff', borderRadius: 6, borderSkipped: false },
      ]
    },
    options: chartOptions(40)
  })

  new Chart(memChart.value, {
    type: 'bar',
    data: {
      labels: ['Urban', 'Rural'],
      datasets: [
        { label: 'A*', data: [18, 12], backgroundColor: '#00d4a0', borderRadius: 6, borderSkipped: false },
        { label: 'IDA*', data: [4, 4], backgroundColor: '#4a9eff', borderRadius: 6, borderSkipped: false },
      ]
    },
    options: chartOptions(25)
  })
})
</script>

<style scoped>
.compare-view { display: flex; flex-direction: column; gap: 16px; }

.insight-bar {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 16px;
  background: rgba(0,212,160,0.06);
  border: 1px solid rgba(0,212,160,0.2);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.insight-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.chart-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
}
.chart-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}
canvas { height: 180px !important; width: 100% !important; }

.table-wrap {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--border);
  background: var(--bg-3);
}
td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: var(--text-secondary);
}
td.metric-col { color: var(--text-primary); font-weight: 500; }
tr:last-child td { border-bottom: none; }

:deep(.badge) {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
:deep(.badge.green) { background: rgba(0,212,160,0.15); color: var(--green); }
:deep(.badge.amber) { background: rgba(245,166,35,0.15); color: var(--amber); }

.verdict-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.verdict-card {
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid;
}
.verdict-card.green { background: rgba(0,212,160,0.05); border-color: rgba(0,212,160,0.2); }
.verdict-card.amber { background: rgba(245,166,35,0.05); border-color: rgba(245,166,35,0.2); }
.verdict-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.verdict-card.green .verdict-title { color: var(--green); }
.verdict-card.amber .verdict-title { color: var(--amber); }
.verdict-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 600px) {
  .charts-grid, .verdict-grid { grid-template-columns: 1fr; }
}
</style>
