import { buildAdj, heuristic } from './graphData.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Each algorithm yields step objects: { visited, current, path, log, done }
export async function* runBFS(speed = 300) {
  const adj = buildAdj()
  const queue = [['S', ['S']]]
  const vis = new Set(['S'])
  while (queue.length) {
    const [cur, path] = queue.shift()
    yield { visited: [...vis], current: cur, path: cur === 'G' ? path : [], log: `BFS — dequeued: ${cur} | queue size: ${queue.length}`, done: false }
    await sleep(speed)
    if (cur === 'G') {
      yield { visited: [...vis], current: cur, path, log: `✓ Goal reached! Path: ${path.join(' → ')}`, done: true, explored: vis.size, cost: path.length - 1, optimal: 'Yes (fewest hops)', pathFinal: path }
      return
    }
    for (const { to } of adj[cur]) {
      if (!vis.has(to)) { vis.add(to); queue.push([to, [...path, to]]) }
    }
  }
}

export async function* runDFS(speed = 300) {
  const adj = buildAdj()
  const stack = [['S', ['S']]]
  const vis = new Set()
  while (stack.length) {
    const [cur, path] = stack.pop()
    if (vis.has(cur)) continue
    vis.add(cur)
    yield { visited: [...vis], current: cur, path: cur === 'G' ? path : [], log: `DFS — visiting: ${cur} | stack depth: ${stack.length}`, done: false }
    await sleep(speed)
    if (cur === 'G') {
      yield { visited: [...vis], current: cur, path, log: `✓ Goal reached! Path: ${path.join(' → ')}`, done: true, explored: vis.size, cost: path.length - 1, optimal: 'Not guaranteed', pathFinal: path }
      return
    }
    for (const { to } of adj[cur]) {
      if (!vis.has(to)) stack.push([to, [...path, to]])
    }
  }
}

export async function* runAStar(speed = 350) {
  const adj = buildAdj()
  const open = [{ id: 'S', g: 0, f: heuristic('S'), path: ['S'] }]
  const gScore = { 'S': 0 }
  const vis = []
  while (open.length) {
    open.sort((a, b) => a.f - b.f)
    const cur = open.shift()
    vis.push(cur.id)
    yield {
      visited: [...vis], current: cur.id,
      path: cur.id === 'G' ? cur.path : [],
      log: `A* — node: ${cur.id} | f=${cur.f.toFixed(2)} g=${cur.g.toFixed(2)} h=${heuristic(cur.id).toFixed(2)} | open: ${open.length}`,
      done: false
    }
    await sleep(speed)
    if (cur.id === 'G') {
      yield { visited: [...vis], current: cur.id, path: cur.path, log: `✓ Optimal path found! Cost: ${Math.round(cur.g)} | Path: ${cur.path.join(' → ')}`, done: true, explored: vis.length, cost: Math.round(cur.g), optimal: 'Yes — optimal', pathFinal: cur.path }
      return
    }
    for (const { to, w } of adj[cur.id]) {
      const ng = cur.g + w
      if (ng < (gScore[to] ?? Infinity)) {
        gScore[to] = ng
        open.push({ id: to, g: ng, f: ng + heuristic(to), path: [...cur.path, to] })
      }
    }
  }
}

export async function* runIDAStar(speed = 280) {
  const adj = buildAdj()
  let bound = heuristic('S')
  const pathSet = ['S']
  const vis = []
  let found = false
  let finalPath = []
  let finalCost = 0
  let explored = 0

  async function* search(node, g, b) {
    const f = g + heuristic(node)
    if (f > b) { return f }
    if (node === 'G') { found = true; finalPath = [...pathSet]; finalCost = Math.round(g); return -1 }
    let min = Infinity
    for (const { to, w } of adj[node]) {
      if (pathSet.includes(to)) continue
      pathSet.push(to); explored++
      vis.push(to)
      yield { visited: [...vis], current: to, path: [], log: `IDA* — threshold: ${b.toFixed(1)} | exploring: ${to} | f=${(g+w+heuristic(to)).toFixed(2)}`, done: false }
      await sleep(speed)
      const gen = search(to, g + w, b)
      let res
      while (true) {
        const step = await gen.next()
        if (step.value !== undefined && typeof step.value === 'object' && step.value.log) yield step.value
        if (step.done) { res = step.value; break }
        if (step.value !== undefined && typeof step.value !== 'object') { res = step.value; break }
      }
      if (found) return -1
      if (res < min) min = res
      pathSet.pop()
    }
    return min
  }

  while (!found && bound < 300) {
    const gen = search('S', 0, bound)
    let newBound = Infinity
    while (true) {
      const step = await gen.next()
      if (step.value !== undefined && typeof step.value === 'object' && step.value.log) yield step.value
      if (step.done) { newBound = step.value ?? Infinity; break }
    }
    if (found) break
    bound = newBound
  }

  yield {
    visited: [...vis], current: 'G', path: finalPath,
    log: `✓ IDA* complete — cost: ${finalCost} | Path: ${finalPath.join(' → ')}`,
    done: true, explored, cost: finalCost, optimal: 'Yes — optimal', pathFinal: finalPath
  }
}
