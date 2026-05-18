<template>
  <div class="app">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">🌿</div>
        <div class="brand-text">
          <div class="brand-name">EcoCart AI</div>
          <div class="brand-sub">MSc AI · NCI 2026</div>
        </div>
      </div>

      <nav class="nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <div class="nav-text">
            <div class="nav-label">{{ tab.label }}</div>
            <div class="nav-desc">{{ tab.desc }}</div>
          </div>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="module-badge">Fundamentals of AI</div>
        <div class="module-detail">TABA — Section II · 30 marks</div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main">
      <div class="main-header">
        <div>
          <h1 class="page-title">{{ currentTab.label }}</h1>
          <p class="page-subtitle">{{ currentTab.subtitle }}</p>
        </div>
        <div class="header-badges">
          <span v-for="b in currentTab.badges" :key="b.text" class="hbadge" :class="b.type">{{ b.text }}</span>
        </div>
      </div>

      <div class="content">
        <Transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="activeTab" />
        </Transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RouteOptimization from './components/RouteOptimization.vue'
import AlgorithmComparison from './components/AlgorithmComparison.vue'
import DemandForecasting from './components/DemandForecasting.vue'
import CustomerSegmentation from './components/CustomerSegmentation.vue'

const activeTab = ref('route')

const tabs = [
  {
    id: 'route',
    icon: '🗺',
    label: 'Route Optimization',
    desc: 'BFS / DFS / A* / IDA*',
    subtitle: 'Visualise search algorithms finding optimal delivery paths across EcoCart\'s logistics network.',
    badges: [{ text: 'Tasks 3 & 4', type: 'blue' }, { text: 'Interactive', type: 'green' }],
  },
  {
    id: 'compare',
    icon: '⚖',
    label: 'A* vs IDA* Analysis',
    desc: 'Urban vs rural comparison',
    subtitle: 'Comparative performance analysis across urban and rural topologies with memory efficiency metrics.',
    badges: [{ text: 'Task 4', type: 'blue' }, { text: 'Charts', type: 'amber' }],
  },
  {
    id: 'demand',
    icon: '📈',
    label: 'Demand Forecasting',
    desc: 'Ridge regression model',
    subtitle: 'Machine learning demand prediction using Ridge Regression with temporal feature engineering.',
    badges: [{ text: 'Task 5', type: 'blue' }, { text: 'ML Model', type: 'green' }],
  },
  {
    id: 'segment',
    icon: '👥',
    label: 'Customer Segmentation',
    desc: 'K-Means + bias mitigation',
    subtitle: 'K-Means clustering with SMOTE-based bias correction for rural/urban customer distribution.',
    badges: [{ text: 'Task 2', type: 'blue' }, { text: 'Bias Fix', type: 'red' }],
  },
]

const components = {
  route: RouteOptimization,
  compare: AlgorithmComparison,
  demand: DemandForecasting,
  segment: CustomerSegmentation,
}

const currentTab = computed(() => tabs.find(t => t.id === activeTab.value))
const currentComponent = computed(() => components[activeTab.value])
</script>

<style>
.app {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.brand-icon { font-size: 28px; }
.brand-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-primary); }
.brand-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.nav { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; flex: 1; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  text-align: left;
  transition: all 0.18s;
  border: 1px solid transparent;
}
.nav-item:hover { background: var(--bg-3); color: var(--text-primary); }
.nav-item.active {
  background: rgba(0,212,160,0.1);
  border-color: rgba(0,212,160,0.2);
  color: var(--text-primary);
}

.nav-icon { font-size: 18px; flex-shrink: 0; }
.nav-label { font-size: 13px; font-weight: 500; }
.nav-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.nav-item.active .nav-desc { color: rgba(0,212,160,0.6); }

.sidebar-footer {
  padding: 16px 20px 0;
  border-top: 1px solid var(--border);
  margin-top: 16px;
}
.module-badge {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(74,158,255,0.12);
  color: var(--blue);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}
.module-detail { font-size: 11px; color: var(--text-muted); }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px 20px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}
.page-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.page-subtitle { font-size: 13px; color: var(--text-secondary); line-height: 1.5; max-width: 520px; }

.header-badges { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.hbadge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.hbadge.blue  { background: rgba(74,158,255,0.12);  color: var(--blue); }
.hbadge.green { background: rgba(0,212,160,0.12);   color: var(--green); }
.hbadge.amber { background: rgba(245,166,35,0.12);  color: var(--amber); }
.hbadge.red   { background: rgba(255,107,107,0.12); color: var(--coral); }

.content { flex: 1; padding: 24px 32px; overflow-y: auto; }

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .app { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; padding: 12px; }
  .brand { border-bottom: none; padding-bottom: 0; }
  .nav { flex-direction: row; flex-wrap: wrap; }
  .sidebar-footer { display: none; }
  .main-header { padding: 16px; }
  .content { padding: 16px; }
}
</style>
