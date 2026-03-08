'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface PlayerData {
  id: string
  username: string
  phone: string
  preferredLanguage: string
  gamesPlayed: number
  wins: number
}

export interface PendingMissionData {
  logId: string
  missionId: number
  missionTitleEN: string
  missionTitleZH: string
  missionTextEN: string
  missionTextZH: string
  assignedToPlayerId: string
  assignedToPlayerName: string
  triggeredAtMove: number
}

export interface MissionLogEntry {
  id: string
  missionId: number
  missionText: string
  assignedToPlayer: { id: string; username: string }
  triggeredAtMove: number
  createdAt: string
}

export interface GameStateData {
  id: string
  roomCode: string
  status: string
  player1: PlayerData | null
  player2: PlayerData | null
  currentTurn: number
  currentTurnPlayerId: string | null
  boardState: number[][]
  winningStones: [number, number][]
  moveCount: number
  winnerId: string | null
  winner: { id: string; username: string } | null
  pendingMissionData: PendingMissionData | null
  missionLogs: MissionLogEntry[]
  nextGame: { id: string; roomCode: string } | null
  player1Ready: boolean
  player2Ready: boolean
}

export function useGamePolling(gameId: string | null, intervalMs = 1500) {
  const [gameState, setGameState] = useState<GameStateData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchState = useCallback(async () => {
    if (!gameId) return
    try {
      const res = await fetch(`/api/game/${gameId}/state`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setGameState(data)
        setError(null)
      }
    } catch {
      setError('Connection error')
    }
  }, [gameId])

  useEffect(() => {
    if (!gameId) return
    fetchState()
    intervalRef.current = setInterval(fetchState, intervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [gameId, intervalMs, fetchState])

  return { gameState, refresh: fetchState, error }
}
