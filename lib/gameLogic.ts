export function boxMuller(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function shouldTriggerMission(): boolean {
  return Math.abs(boxMuller()) > 2.0
}

export function selectMission(): number {
  return Math.floor(Math.random() * 20) + 1
}

export function initBoard(): number[][] {
  return Array.from({ length: 15 }, () => Array(15).fill(0))
}

export interface WinResult {
  winner: number
  stones: [number, number][]
}

export function checkWin(board: number[][], row: number, col: number, player: number): WinResult | null {
  const directions: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [dr, dc] of directions) {
    const stones: [number, number][] = [[row, col]]

    for (let i = 1; i < 5; i++) {
      const r = row + dr * i
      const c = col + dc * i
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== player) break
      stones.push([r, c])
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i
      const c = col - dc * i
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== player) break
      stones.push([r, c])
    }

    if (stones.length >= 5) {
      return { winner: player, stones }
    }
  }
  return null
}
