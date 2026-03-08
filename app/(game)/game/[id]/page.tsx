'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Board from '@/components/Board'
import MissionLog from '@/components/MissionLog'
import WinOverlay from '@/components/WinOverlay'
import PlayerCard from '@/components/PlayerCard'
import LanguageToggle from '@/components/LanguageToggle'
import { useGamePolling } from '@/lib/useGamePolling'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [lang, setLang] = useState<'EN' | 'ZH'>('EN')
  const [placing, setPlacing] = useState(false)
  const [rematchLoading, setRematchLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [myReady, setMyReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const redirectedRef = useRef(false)
  const joinedRef = useRef(false)

  const { gameState, setGameState, refresh, lockPolling, unlockPolling } = useGamePolling(gameId)

  // Fetch session once
  useEffect(() => {
    fetch('/api/auth/me').then(async (res) => {
      const data = await res.json()
      if (!data.user) {
        router.push('/login')
        return
      }
      setMyUserId(data.user.id)
      setLang(data.user.preferredLanguage as 'EN' | 'ZH')
    })
  }, [router])

  // Auto-join if not in the room yet
  useEffect(() => {
    if (!gameState || !myUserId || joinedRef.current) return
    const isInGame = gameState.player1?.id === myUserId || gameState.player2?.id === myUserId
    if (isInGame) { joinedRef.current = true; return }
    if (gameState.status === 'WAITING_FOR_PLAYER' || gameState.status === 'WAITING_READY') {
      joinedRef.current = true
      fetch(`/api/room/${gameState.roomCode}/join`, { method: 'POST' })
        .then(() => refresh())
        .catch(() => {})
    }
  }, [gameState, myUserId, refresh])

  // Sync myReady from gameState
  useEffect(() => {
    if (!gameState || !myUserId) return
    const isP1 = gameState.player1?.id === myUserId
    const isP2 = gameState.player2?.id === myUserId
    if ((isP1 && gameState.player1Ready) || (isP2 && gameState.player2Ready)) {
      setMyReady(true)
    }
  }, [gameState, myUserId])

  // Redirect to next game when rematch is available
  useEffect(() => {
    if (gameState?.nextGame && !redirectedRef.current) {
      redirectedRef.current = true
      router.push(`/game/${gameState.nextGame.id}`)
    }
  }, [gameState?.nextGame, router])

  const t = (en: string, zh: string) => (lang === 'ZH' ? zh : en)

  async function handlePlace(row: number, col: number) {
    if (!gameState || placing || gameState.status !== 'ACTIVE') return
    if (gameState.pendingMissionData) return
    if (gameState.currentTurnPlayerId !== myUserId) return

    const placingPlayer = gameState.currentTurn

    // Lock polling so stale server responses don't overwrite optimistic state
    lockPolling()
    // Optimistic: show stone instantly before network
    setGameState(prev => {
      if (!prev) return prev
      const newBoard = prev.boardState.map(r => [...r])
      newBoard[row][col] = placingPlayer
      return { ...prev, boardState: newBoard }
    })

    setPlacing(true)
    try {
      const res = await fetch(`/api/game/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row, col }),
      })
      if (!res.ok) {
        unlockPolling()
        await refresh() // rollback on error
        return
      }
      const data = await res.json()
      // Apply server response directly — no second round trip
      setGameState(prev => {
        if (!prev) return prev
        if (data.status === 'FINISHED') {
          return { ...prev, status: 'FINISHED', winnerId: data.winnerId, winningStones: data.winningStones ?? [], moveCount: data.moveCount }
        }
        const nextTurnPlayerId = data.currentTurn === 1 ? prev.player1?.id ?? null : prev.player2?.id ?? null
        return {
          ...prev,
          currentTurn: data.currentTurn,
          currentTurnPlayerId: nextTurnPlayerId,
          pendingMissionData: data.pendingMissionData ?? null,
          moveCount: data.moveCount,
        }
      })
    } finally {
      setPlacing(false)
      unlockPolling()
    }
  }

  async function handleAckMission() {
    if (!gameState) return
    const nextTurn = gameState.currentTurn === 1 ? 2 : 1
    const nextTurnPlayerId = nextTurn === 1 ? gameState.player1?.id ?? null : gameState.player2?.id ?? null
    lockPolling()
    // Optimistic: close mission modal instantly
    setGameState(prev => {
      if (!prev) return prev
      return { ...prev, pendingMissionData: null, currentTurn: nextTurn, currentTurnPlayerId: nextTurnPlayerId }
    })
    try {
      await fetch(`/api/game/${gameId}/mission/ack`, { method: 'POST' })
    } catch {
      await refresh() // rollback on error
    } finally {
      unlockPolling()
    }
  }

  async function handleRematch() {
    setRematchLoading(true)
    try {
      const res = await fetch(`/api/game/${gameId}/rematch`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.gameId) {
        router.push(`/game/${data.gameId}`)
      } else {
        setRematchLoading(false)
      }
    } catch {
      setRematchLoading(false)
    }
  }

  async function handleReady() {
    if (!gameState || myReady) return
    setMyReady(true)
    try {
      await fetch(`/api/room/${gameState.roomCode}/ready`, { method: 'POST' })
      await refresh()
    } catch {
      setMyReady(false)
    }
  }

  async function handleCopy() {
    if (!gameState) return
    const shareUrl = `${window.location.origin}/room/${gameState.roomCode}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  // --- Loading ---
  if (!gameState || !myUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFACD]">
        <div className="text-gray-400">{t('Loading game...', '加载游戏...')}</div>
      </div>
    )
  }

  // --- Waiting state (before both players ready) ---
  const isWaiting = gameState.status === 'WAITING_FOR_PLAYER' || gameState.status === 'WAITING_READY'

  if (isWaiting) {
    const { player1, player2, boardState, roomCode } = gameState
    const bothPresent = !!(player1 && player2)
    const isP1 = player1?.id === myUserId
    const isP2 = player2?.id === myUserId
    const amIReady = (isP1 && gameState.player1Ready) || (isP2 && gameState.player2Ready) || myReady
    const myPlayerNum = isP1 ? 1 : isP2 ? 2 : null
    const myStoneColor = myPlayerNum === 1 ? '#FFAEB9' : myPlayerNum === 2 ? '#A2CD5A' : null
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : `/room/${roomCode}`

    return (
      <div className="min-h-screen bg-[#FFFACD] flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur-sm border-b border-gray-100">
          <button onClick={() => router.push('/lobby')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('Lobby', '大厅')}
          </button>
          <h1 className="text-lg font-bold text-gray-700">GoClick</h1>
          <LanguageToggle lang={lang} userId={myUserId} onToggle={setLang} />
        </header>

        <main className="flex-1 flex flex-col items-center justify-start p-4 gap-0">
          {/* Board in background with white overlay */}
          <div className="relative w-full" style={{ maxWidth: 'min(calc(100vw - 32px), 480px)' }}>
            <div className="pointer-events-none">
              <Board board={boardState} winningStones={[]} onPlace={() => {}} currentPlayer={1} disabled={true} />
            </div>
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-white/60 rounded-lg" />
            {/* Centered card */}
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-5 w-full">
                {/* Room code */}
                <div className="text-center mb-4">
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{t('Room Code', '房间码')}</div>
                  <div className="text-2xl font-black text-gray-800 tracking-widest font-mono">{roomCode}</div>
                </div>

                {/* Share link */}
                <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="flex-1 text-xs text-gray-500 truncate font-mono">{shareUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all active:scale-95"
                    style={{ background: copied ? '#22c55e' : 'linear-gradient(135deg, #836FFF, #6A5ACD)' }}
                  >
                    {copied ? t('Copied!', '已复制！') : t('Copy', '复制')}
                  </button>
                </div>

                {/* Player slots */}
                <div className="flex gap-2 mb-4">
                  {/* Player 1 */}
                  <div className={`flex-1 rounded-2xl p-3 border-2 transition-all ${player1?.id === myUserId ? 'border-[#1E90FF] bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="text-xs text-gray-400 mb-2">{t('Player 1', '玩家1')}</div>
                    {player1 ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#FFAEB9] flex-shrink-0" />
                          <span className="text-xs font-bold text-gray-800 truncate">{player1.username}</span>
                        </div>
                        <div className={`text-xs text-center py-1 rounded-lg ${gameState.player1Ready ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {gameState.player1Ready ? '✓ Ready' : t('Waiting...', '等待中...')}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#FFAEB9] animate-pulse" />
                        <span className="text-xs text-gray-400">{t('Waiting...', '等待中...')}</span>
                      </div>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className={`flex-1 rounded-2xl p-3 border-2 transition-all ${player2?.id === myUserId ? 'border-[#1E90FF] bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="text-xs text-gray-400 mb-2">{t('Player 2', '玩家2')}</div>
                    {player2 ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#A2CD5A] flex-shrink-0" />
                          <span className="text-xs font-bold text-gray-800 truncate">{player2.username}</span>
                        </div>
                        <div className={`text-xs text-center py-1 rounded-lg ${gameState.player2Ready ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {gameState.player2Ready ? '✓ Ready' : t('Waiting...', '等待中...')}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#A2CD5A] animate-pulse" />
                        <span className="text-xs text-gray-400">{t('Waiting to join...', '等待加入...')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Let's GO button */}
                {bothPresent ? (
                  <button
                    onClick={handleReady}
                    disabled={amIReady}
                    className="w-full py-4 rounded-full font-bold text-xl transition-all active:scale-95"
                    style={{
                      background: amIReady ? '#e5e7eb' : 'linear-gradient(135deg, #1E90FF, #1874CD)',
                      color: amIReady ? '#9ca3af' : 'white',
                      cursor: amIReady ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {amIReady ? t("✓ Ready! Waiting...", "✓ 已准备！等待对方...") : "Let's GO!"}
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-3 animate-pulse">
                    {t('Waiting for opponent to join...', '等待对手加入...')}
                  </div>
                )}

                {/* Stone color hint */}
                {myStoneColor && (
                  <div className="mt-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                    <span>{t('Your stone:', '你的棋子：')}</span>
                    <div className="w-3 h-3 rounded-full border border-gray-200" style={{ background: myStoneColor }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // --- Active / Finished game ---
  const { player1, player2, currentTurn, currentTurnPlayerId, boardState, winningStones,
    pendingMissionData, missionLogs, status, winner } = gameState

  if (!player1 || !player2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFACD]">
        <div className="text-gray-400">{t('Waiting for players...', '等待玩家加入...')}</div>
      </div>
    )
  }

  const myPlayerNum: 1 | 2 | null =
    player1.id === myUserId ? 1 : player2.id === myUserId ? 2 : null
  const isMyTurn = currentTurnPlayerId === myUserId && status === 'ACTIVE' && !pendingMissionData
  const isFinished = status === 'FINISHED'
  const isBoardDisabled = !isMyTurn || placing

  const missionIsForMe = pendingMissionData?.assignedToPlayerId === myUserId
  const waitingForMissionAck = !!pendingMissionData && !missionIsForMe

  const missionAssignedLang: 'EN' | 'ZH' =
    pendingMissionData?.assignedToPlayerId === player1.id
      ? (player1.preferredLanguage as 'EN' | 'ZH')
      : (player2.preferredLanguage as 'EN' | 'ZH')

  function InfoPanel() {
    const p1 = player1!
    const p2 = player2!
    return (
      <>
        {/* Turn indicator */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            {t('Current Turn', '当前回合')} · {t('Move', '第')} {gameState!.moveCount + 1}
          </div>
          <div className="space-y-2">
            {([p1, p2] as const).map((p, i) => {
              const pNum = i + 1
              const isActive = currentTurn === pNum && !isFinished && !pendingMissionData
              const stoneColor = pNum === 1 ? 'bg-[#FFAEB9]' : 'bg-[#A2CD5A]'
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive ? 'bg-gray-50 ring-2 ring-gray-200' : 'opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${stoneColor} flex-shrink-0 ${isActive ? 'animate-pulse2' : ''}`} />
                  <span className={`font-semibold text-sm ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                    {p.username}
                    {p.id === myUserId && <span className="text-gray-400 font-normal ml-1">({t('You', '你')})</span>}
                  </span>
                  {isActive && !pendingMissionData && (
                    <span className="ml-auto text-xs text-[#1E90FF] font-medium">
                      {p.id === myUserId ? t('Your turn', '你的回合') : t("Opponent's turn", '对方回合')}
                    </span>
                  )}
                  {pendingMissionData && (
                    <span className="ml-auto text-xs text-[#836FFF] font-medium">
                      {t('Mission...', '任务...')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {waitingForMissionAck && (
            <div className="mt-3 text-xs text-[#836FFF] bg-purple-50 rounded-lg px-3 py-2 text-center">
              {t(`Waiting for ${pendingMissionData!.assignedToPlayerName} to accept mission...`,
                 `等待 ${pendingMissionData!.assignedToPlayerName} 确认任务...`)}
            </div>
          )}
        </div>

        {/* Player cards */}
        <PlayerCard
          username={p1.username}
          phone={p1.phone}
          gamesPlayed={p1.gamesPlayed}
          wins={p1.wins}
          preferredLanguage={p1.preferredLanguage as 'EN' | 'ZH'}
          playerNumber={1}
          isActive={myPlayerNum === 1}
          label={t('Player 1 (Pink)', '玩家1（粉色）')}
        />
        <PlayerCard
          username={p2.username}
          phone={p2.phone}
          gamesPlayed={p2.gamesPlayed}
          wins={p2.wins}
          preferredLanguage={p2.preferredLanguage as 'EN' | 'ZH'}
          playerNumber={2}
          isActive={myPlayerNum === 2}
          label={t('Player 2 (Green)', '玩家2（绿色）')}
        />

        {/* Mission Log */}
        <MissionLog missions={missionLogs} lang={lang} />
      </>
    )
  }

  const currentOpponentName = currentTurnPlayerId === player1.id ? player1.username : player2.username

  return (
    <div className="min-h-screen bg-[#FFFACD] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <button
          onClick={() => router.push('/lobby')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('Lobby', '大厅')}
        </button>
        <h1 className="text-lg font-bold text-gray-700">GoClick</h1>
        <LanguageToggle lang={lang} userId={myUserId} onToggle={setLang} />
      </header>

      {/* Desktop layout */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 pb-20 md:pb-4 max-w-6xl mx-auto w-full">
        {/* Board */}
        <div className="flex-1 flex flex-col items-center justify-start gap-2">
          <div className="w-full" style={{ maxWidth: 'min(calc(100vw - 32px), 540px)' }}>
            <div className="relative">
              <Board
                board={boardState}
                winningStones={winningStones}
                onPlace={handlePlace}
                currentPlayer={(myPlayerNum ?? currentTurn) as 1 | 2}
                disabled={isBoardDisabled}
              />
              {/* Waiting overlay */}
              {!isMyTurn && !isFinished && !pendingMissionData && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-medium">
                    {t(`Waiting for ${currentOpponentName}...`, `等待 ${currentOpponentName} 落子...`)}
                  </div>
                </div>
              )}
              {waitingForMissionAck && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
                  <div className="bg-[#836FFF]/30 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-medium">
                    {t(`Waiting for ${pendingMissionData!.assignedToPlayerName} to accept mission...`,
                       `等待 ${pendingMissionData!.assignedToPlayerName} 确认任务...`)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop info panel */}
        <div className="hidden md:flex w-72 flex-col gap-4">
          <InfoPanel />
        </div>
      </main>

      {/* Mobile bottom sheet */}
      <div
        className="fixed md:hidden bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300"
        style={{ transform: sheetOpen ? 'translateY(0)' : 'translateY(calc(100% - 56px))' }}
      >
        <button
          onClick={() => setSheetOpen((s) => !s)}
          className="w-full h-14 flex items-center gap-3 px-4 border-b border-gray-100"
        >
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto absolute left-1/2 top-3 -translate-x-1/2" />
          <div className="flex items-center gap-2 flex-1 pt-1">
            <div className={`w-3 h-3 rounded-full ${myPlayerNum === 1 ? 'bg-[#FFAEB9]' : 'bg-[#A2CD5A]'}`} />
            <span className="text-sm text-gray-600 truncate">
              {isMyTurn
                ? t('Your turn to play', '轮到你落子')
                : pendingMissionData
                ? t('Mission in progress...', '任务进行中...')
                : t(`Waiting for ${currentOpponentName}`, `等待 ${currentOpponentName}`)}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${sheetOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="px-4 pb-8 pt-2 space-y-4 max-h-[60vh] overflow-y-auto">
          <InfoPanel />
        </div>
      </div>

      {/* Mission Modal */}
      {missionIsForMe && pendingMissionData && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md p-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-[#836FFF] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
                Mission Triggered! 任务触发！
              </div>
              <div className="text-sm text-gray-500">
                {t('Assigned to', '分配给')}: <span className="font-bold text-[#836FFF]">{pendingMissionData.assignedToPlayerName}</span>
              </div>
            </div>
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#836FFF] text-white flex items-center justify-center font-bold text-lg">
                #{pendingMissionData.missionId}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-xl mb-2">
                  {missionAssignedLang === 'ZH' ? pendingMissionData.missionTitleZH : pendingMissionData.missionTitleEN}
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {missionAssignedLang === 'ZH' ? pendingMissionData.missionTextZH : pendingMissionData.missionTextEN}
                </p>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  {missionAssignedLang === 'ZH' ? pendingMissionData.missionTextEN : pendingMissionData.missionTextZH}
                </p>
              </div>
            </div>
            <button
              onClick={handleAckMission}
              className="w-full py-3 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #836FFF, #6A5ACD)' }}
            >
              Got it! / 明白了！
            </button>
          </div>
        </div>
      )}

      {/* Win Overlay */}
      {isFinished && winner && !missionIsForMe && (
        <WinOverlay
          winnerName={winner.username}
          lang={lang}
          onPlayAgain={handleRematch}
          onBackToLobby={() => router.push('/lobby')}
          isLoading={rematchLoading}
        />
      )}
    </div>
  )
}
