<template>
  <div class="route-view">
    <div class="controls">
      <select v-model="selectedAlgo" class="algo-select" :disabled="running">
        <option value="bfs">BFS — Breadth-First Search</option>
        <option value="dfs">DFS — Depth-First Search</option>
        <option value="astar">A* Search (recommended)</option>
        <option value="idastar">IDA* Search</option>
      </select>

      <div class="speed-wrap">
        <span class="speed-label">Speed</span>
        <input type="range" min="50" max="600" :value="600 - speed + 50" @input="speed = 600 - Number($event.target.value) + 50" :disabled="running" />
      </div>

      <button class="btn-run" @click="run" :disabled="running">
        <span v-if="!running">▶ Run</span>
        <span v-else class="running-dot">●</span>
      </button>
      <button class="btn-reset" @click="reset" :disabled="running">↺</button>
    </div>

    <div class="algo-info" v-if="algoDescriptions[selectedAlgo]">
      {{ algoDescriptions[selectedAlgo] }}
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl" :width="canvasW" :height="canvasH" />
    </div>

    <div class="log-wrap" ref="logEl">
      <div class="log-placeholder" v-if="logs.length === 0">Select an algorithm and press Run…</div>
      <div
        v-for="(l, i) in logs"
        :key="i"
        class="log-line"
        :class="{ highlight: l.startsWith('✓') }"
      >{{ l }}</div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Nodes explored</div>
        <div class="metric-value">{{ metrics.explored ?? '—' }}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Path cost</div>
        <div class="metric-value">{{ metrics.cost !== undefined ? metrics.cost + ' km' : '—' }}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Algorithm</div>
        <div class="metric-value algo-name">{{ selectedAlgo.toUpperCase() }}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Optimal?</div>
        <div class="metric-value" :class="metrics.optimal?.startsWith('Yes') ? 'green' : 'amber'">
          {{ metrics.optimal ?? '—' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { NODES, EDGES, getNode } from '../composables/graphData.js'
import { runBFS, runDFS, runAStar, runIDAStar } from '../composables/algorithms.js'

const canvasW = 660
const canvasH = 420
const canvasEl = ref(null)
const logEl = ref(null)
const selectedAlgo = ref('astar')
const running = ref(false)
const speed = ref(350)
const logs = ref([])
const metrics = ref({})

let visitedState = []
let pathState = []

const algoDescriptions = {
  bfs: 'Breadth-First Search explores nodes layer by layer. Guarantees shortest path by hop count but ignores edge weights.',
  dfs: 'Depth-First Search dives deep before backtracking. Memory efficient but not guaranteed to find optimal routes.',
  astar: 'A* uses a heuristic (Euclidean distance) to guide search. Optimal and efficient — ideal for urban route planning.',
  idastar: 'IDA* achieves A* optimality with O(d) memory. Preferred for rural/edge-device deployment with RAM constraints.',
}

function drawGraph(visited = [], path = []) {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Draw edges
  EDGES.forEach(([u, v, w]) => {
    const nu = getNode(u), nv = getNode(v)
    const inPath = path.length > 1 && isEdgeInPath(u, v, path)
    ctx.beginPath()
    ctx.moveTo(nu.x, nu.y)
    ctx.lineTo(nv.x, nv.y)
    ctx.strokeStyle = inPath ? '#00d4a0' : 'rgba(255,255,255,0.07)'
    ctx.lineWidth = inPath ? 3 : 1.5
    ctx.stroke()

    // Edge weight label
    const mx = (nu.x + nv.x) / 2, my = (nu.y + nv.y) / 2
    ctx.fillStyle = inPath ? '#00d4a0' : 'rgba(255,255,255,0.25)'
    ctx.font = '11px DM Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(w, mx, my - 5)
  })

  // Draw nodes
  NODES.forEach(n => {
    const inPath = path.includes(n.id)
    const inVisited = visited.includes(n.id)

    // Glow for visited/path
    if (inPath || inVisited) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, 28, 0, Math.PI * 2)
      ctx.fillStyle = inPath
        ? 'rgba(0,212,160,0.15)'
        : 'rgba(245,166,35,0.1)'
      ctx.fill()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(n.x, n.y, 20, 0, Math.PI * 2)
    if (inPath) {
      ctx.fillStyle = '#00d4a0'
    } else if (inVisited) {
      ctx.fillStyle = n.type === 'rural' ? '#f5a623' : '#2a3550'
    } else {
      ctx.fillStyle = n.type === 'depot' ? '#1a2540' : n.type === 'goal' ? '#1a2540' : '#141921'
    }
    ctx.fill()

    ctx.strokeStyle = inPath
      ? '#00d4a0'
      : n.type === 'depot' ? '#4a9eff'
      : n.type === 'goal' ? '#f5a623'
      : n.type === 'rural' ? 'rgba(245,166,35,0.4)'
      : 'rgba(255,255,255,0.12)'
    ctx.lineWidth = inPath ? 2 : 1.5
    ctx.stroke()

    // Node label
    ctx.fillStyle = inPath ? '#0a0e12' : inVisited ? '#e8eaf0' : '#7a8099'
    ctx.font = `${inPath ? '600' : '500'} 12px Syne, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.id, n.x, n.y)

    // Below label
    ctx.fillStyle = inPath ? '#00d4a0' : 'rgba(255,255,255,0.3)'
    ctx.font = '10px DM Sans, sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText(n.label, n.x, n.y + 24)
  })
}

function isEdgeInPath(u, v, path) {
  for (let i = 0; i < path.length - 1; i++) {
    if ((path[i] === u && path[i+1] === v) || (path[i] === v && path[i+1] === u)) return true
  }
  return false
}

async function run() {
  if (running.value) return
  running.value = true
  logs.value = []
  metrics.value = {}
  visitedState = []
  pathState = []

  const generators = {
    bfs: () => runBFS(speed.value),
    dfs: () => runDFS(speed.value),
    astar: () => runAStar(speed.value),
    idastar: () => runIDAStar(speed.value),
  }

  const gen = generators[selectedAlgo.value]()

  for await (const step of gen) {
    visitedState = step.visited
    pathState = step.path
    drawGraph(visitedState, pathState)
    logs.value.push(step.log)
    await nextTick()
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
    if (step.done) {
      metrics.value = {
        explored: step.explored,
        cost: step.cost,
        optimal: step.optimal,
      }
    }
  }

  running.value = false
}

function reset() {
  visitedState = []
  pathState = []
  logs.value = []
  metrics.value = {}
  drawGraph()
}

onMounted(() => drawGraph())
watch(selectedAlgo, reset)
</script>

<style scoped>
.route-view { display: flex; flex-direction: column; gap: 14px; }

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.algo-select {
  flex: 1;
  min-width: 220px;
  padding: 9px 14px;
  background: var(--bg-3);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: border-color 0.2s;
}
.algo-select:hover { border-color: var(--border-active); }
.algo-select:disabled { opacity: 0.5; cursor: not-allowed; }

.speed-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.speed-label { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.speed-wrap input { width: 80px; accent-color: var(--green); }

.btn-run {
  padding: 9px 22px;
  background: var(--green);
  color: #0a0e12;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.02em;
}
.btn-run:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
.btn-run:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-reset {
  padding: 9px 14px;
  background: var(--bg-3);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 16px;
}
.btn-reset:hover:not(:disabled) { border-color: var(--border-active); color: var(--text-primary); }
.btn-reset:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.running-dot { animation: pulse 1s ease-in-out infinite; color: #0a0e12; }

.algo-info {
  padding: 10px 14px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-left: 3px solid var(--green);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.canvas-wrap {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-2);
  overflow: hidden;
}
canvas { width: 100%; height: auto; }

.log-wrap {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  height: 130px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.9;
}
.log-placeholder { color: var(--text-muted); }
.log-line { color: var(--text-secondary); }
.log-line.highlight { color: var(--green); font-weight: 500; }

.metrics {
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
.metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
.metric-value { font-size: 20px; font-weight: 600; font-family: var(--font-display); color: var(--text-primary); }
.metric-value.algo-name { font-size: 16px; color: var(--blue); }
.metric-value.green { color: var(--green); }
.metric-value.amber { color: var(--amber); }

@media (max-width: 600px) {
  .metrics { grid-template-columns: repeat(2, 1fr); }
}
</style>
