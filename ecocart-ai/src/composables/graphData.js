export const NODES = [
  { id: 'S', x: 70,  y: 200, label: 'Depot',      type: 'depot' },
  { id: 'A', x: 180, y: 90,  label: 'Zone A',      type: 'urban' },
  { id: 'B', x: 180, y: 300, label: 'Zone B',      type: 'urban' },
  { id: 'C', x: 300, y: 140, label: 'Zone C',      type: 'urban' },
  { id: 'D', x: 300, y: 260, label: 'Zone D',      type: 'urban' },
  { id: 'E', x: 430, y: 80,  label: 'Zone E',      type: 'urban' },
  { id: 'F', x: 430, y: 210, label: 'Zone F',      type: 'urban' },
  { id: 'G', x: 570, y: 145, label: 'Customer',    type: 'goal' },
  { id: 'H', x: 420, y: 340, label: 'Rural NW',    type: 'rural' },
  { id: 'I', x: 555, y: 310, label: 'Rural SE',    type: 'rural' },
]

export const EDGES = [
  ['S','A',4], ['S','B',6],
  ['A','C',3], ['B','D',2],
  ['C','E',5], ['C','F',4],
  ['D','F',3], ['E','G',2],
  ['F','G',3], ['F','H',7],
  ['H','I',4], ['G','I',5],
  ['D','H',5], ['A','E',6],
]

export function buildAdj() {
  const adj = {}
  NODES.forEach(n => adj[n.id] = [])
  EDGES.forEach(([u, v, w]) => {
    adj[u].push({ to: v, w })
    adj[v].push({ to: u, w })
  })
  return adj
}

export function heuristic(id) {
  const n = NODES.find(x => x.id === id)
  const g = NODES.find(x => x.id === 'G')
  return Math.sqrt((n.x - g.x) ** 2 + (n.y - g.y) ** 2) / 100
}

export function getNode(id) {
  return NODES.find(n => n.id === id)
}
