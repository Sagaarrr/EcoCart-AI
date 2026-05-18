# EcoCart AI — MSc AI TABA Prototype

Interactive Vue 3 prototype for the NCI MSc AI Fundamentals of AI TABA assignment.

## What's inside

| Tab | Covers | TABA Task |
|-----|--------|-----------|
| Route Optimization | BFS, DFS, A*, IDA* live visualisation | Tasks 3 & 4 |
| A* vs IDA* Analysis | Comparative charts + performance table | Task 4 |
| Demand Forecasting | Ridge regression with feature importance | Task 5 |
| Customer Segmentation | K-Means + SMOTE bias mitigation toggle | Task 2 |

## Requirements

- Node.js 18+ (check: `node -v`)
- npm 9+

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## Build for production

```bash
npm run build
# Output in ./dist — serve with any static host
```

## Project structure

```
src/
  components/
    RouteOptimization.vue    # Canvas graph + async algorithm runner
    AlgorithmComparison.vue  # A* vs IDA* charts and analysis
    DemandForecasting.vue    # ML demand chart + feature importance
    CustomerSegmentation.vue # K-Means scatter + bias toggle
  composables/
    graphData.js             # Node/edge definitions, adjacency, heuristic
    algorithms.js            # BFS, DFS, A*, IDA* as async generators
  App.vue                    # Shell with sidebar navigation
  main.js
  style.css
```

## Algorithm notes

- **BFS**: Guarantees shortest path by hop count. Does not use edge weights.
- **DFS**: Memory efficient, not optimal. Will find *a* path, not necessarily *the best*.
- **A***: Uses Euclidean heuristic. Optimal + efficient. Best for urban dense networks.
- **IDA***: A* optimality, O(d) memory. Best for rural/edge-device deployment.

## Bias mitigation

Toggle "Show bias mitigation" in the Customer Segmentation tab to see SMOTE-corrected cluster distributions. Rural customers move from 71% Dormant to a balanced distribution after stratified resampling.
