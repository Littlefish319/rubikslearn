import { solveFacelets } from '../lib/cubeSolver'

self.onmessage = (event: MessageEvent<{ id: number; facelets: string }>) => {
  const { id, facelets } = event.data
  try {
    const solution = solveFacelets(facelets, status => self.postMessage({ id, type: 'status', status }))
    self.postMessage({ id, type: 'result', solution })
  } catch (error) {
    self.postMessage({ id, type: 'error', message: error instanceof Error ? error.message : 'The solver could not complete this cube.' })
  }
}
