'use client'

import React, { useState, useRef } from 'react'
import Stone from './Stone'

const BOARD_SIZE = 15
const PADDING = 28
const CELL = 36
const TOTAL = PADDING * 2 + CELL * (BOARD_SIZE - 1)

interface BoardProps {
  board: number[][]
  winningStones: [number, number][]
  onPlace: (row: number, col: number) => void
  currentPlayer: 1 | 2
  disabled?: boolean
}

function isWinningStone(winningStones: [number, number][], row: number, col: number): boolean {
  return winningStones.some(([r, c]) => r === row && c === col)
}

export default function Board({ board, winningStones, onPlace, currentPlayer, disabled }: BoardProps) {
  const [hover, setHover] = useState<[number, number] | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  function getSVGCoords(clientX: number, clientY: number): [number, number] | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scaleX = TOTAL / rect.width
    const scaleY = TOTAL / rect.height
    const svgX = (clientX - rect.left) * scaleX
    const svgY = (clientY - rect.top) * scaleY
    const col = Math.round((svgX - PADDING) / CELL)
    const row = Math.round((svgY - PADDING) / CELL)
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
    return [row, col]
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (disabled) { setHover(null); return }
    const coords = getSVGCoords(e.clientX, e.clientY)
    if (coords && board[coords[0]][coords[1]] === 0) {
      setHover(coords)
    } else {
      setHover(null)
    }
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (disabled) return
    const coords = getSVGCoords(e.clientX, e.clientY)
    if (coords && board[coords[0]][coords[1]] === 0) {
      onPlace(coords[0], coords[1])
      setHover(null)
    }
  }

  function handleTouchEnd(e: React.TouchEvent<SVGSVGElement>) {
    if (disabled) return
    e.preventDefault() // prevent 300ms delay and ghost click
    const touch = e.changedTouches[0]
    const coords = getSVGCoords(touch.clientX, touch.clientY)
    if (coords && board[coords[0]][coords[1]] === 0) {
      onPlace(coords[0], coords[1])
      setHover(null)
    }
  }

  function handleTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    if (disabled) return
    const touch = e.touches[0]
    const coords = getSVGCoords(touch.clientX, touch.clientY)
    if (coords && board[coords[0]][coords[1]] === 0) {
      setHover(coords)
    } else {
      setHover(null)
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${TOTAL} ${TOTAL}`}
      style={{
        display: 'block',
        width: '100%',
        aspectRatio: '1',
        background: '#EEE8CD',
        borderRadius: '8px',
        cursor: disabled ? 'default' : 'crosshair',
        touchAction: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(null)}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Grid lines */}
      {Array.from({ length: BOARD_SIZE }).map((_, i) => (
        <g key={i}>
          <line x1={PADDING + i * CELL} y1={PADDING} x2={PADDING + i * CELL} y2={PADDING + (BOARD_SIZE - 1) * CELL} stroke="#CDC8B1" strokeWidth={0.8} />
          <line x1={PADDING} y1={PADDING + i * CELL} x2={PADDING + (BOARD_SIZE - 1) * CELL} y2={PADDING + i * CELL} stroke="#CDC8B1" strokeWidth={0.8} />
        </g>
      ))}

      {/* Star points */}
      {[3, 7, 11].map((r) =>
        [3, 7, 11].map((c) => (
          <circle key={`star-${r}-${c}`} cx={PADDING + c * CELL} cy={PADDING + r * CELL} r={3} fill="#CDC8B1" />
        ))
      )}

      {/* Touch-friendly transparent hit targets */}
      {Array.from({ length: BOARD_SIZE }).map((_, ri) =>
        Array.from({ length: BOARD_SIZE }).map((_, ci) => (
          <rect
            key={`hit-${ri}-${ci}`}
            x={PADDING + ci * CELL - CELL / 2}
            y={PADDING + ri * CELL - CELL / 2}
            width={CELL}
            height={CELL}
            fill="transparent"
          />
        ))
      )}

      {/* Stones */}
      {board.map((row, ri) =>
        row.map((cell, ci) => {
          if (cell === 0) return null
          const winning = isWinningStone(winningStones, ri, ci)
          return (
            <g key={`stone-${ri}-${ci}`} transform={`translate(${PADDING + ci * CELL},${PADDING + ri * CELL})`}>
              <Stone player={cell as 1 | 2} isWinning={winning} size={CELL - 4} />
            </g>
          )
        })
      )}

      {/* Hover ghost */}
      {hover && !disabled && (
        <g transform={`translate(${PADDING + hover[1] * CELL},${PADDING + hover[0] * CELL})`}>
          <Stone player={currentPlayer} isHover size={CELL - 4} />
        </g>
      )}
    </svg>
  )
}
