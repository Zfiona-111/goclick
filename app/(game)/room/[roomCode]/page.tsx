'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface PlayerInfo {
  id: string
  username: string
  phone: string
  preferredLanguage: string
  gamesPlayed: number
  wins: number
}

interface RoomState {
  roomCode: string
  gameId: string
  status: string
  player1: PlayerInfo | null
  player2: PlayerInfo | null
  player1Ready: boolean
  player2Ready: boolean
}

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = (params.roomCode as string).toUpperCase()

  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myLang, setMyLang] = useState<'EN' | 'ZH'>('EN')
  const [room, setRoom] = useState<RoomState | null>(null)
  const [myReady, setMyReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const hasJoined = useRef(false)

  const shareUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : typeof window !== 'undefined'
      ? window.location.origin
      : '') + `/room/${roomCode}`

  const t = (en: string, zh: string) => (myLang === 'ZH' ? zh : en)

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me').then(async (res) => {
      const data = await res.json()
      if (!data.user) {
        router.push(`/login?next=/room/${roomCode}`)
        return
      }
      setMyUserId(data.user.id)
      setMyLang(data.user.preferredLanguage as 'EN' | 'ZH')
    })
  }, [router, roomCode])

  // Join room once user is known
  const joinRoom = useCallback(async () => {
    if (!myUserId || hasJoined.current) return
    hasJoined.current = true
    setJoining(true)
    try {
      const res = await fetch(`/api/room/${roomCode}/join`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join room')
      }
    } catch {
      setError('Network error')
    } finally {
      setJoining(false)
    }
  }, [myUserId, roomCode])

  useEffect(() => {
    joinRoom()
  }, [joinRoom])

  // Poll room state
  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomCode}/state`, { cache: 'no-store' })
      if (!res.ok) return
      const data: RoomState = await res.json()
      setRoom(data)

      // Sync ready state
      if (myUserId) {
        if (data.player1?.id === myUserId && data.player1Ready) setMyReady(true)
        if (data.player2?.id === myUserId && data.player2Ready) setMyReady(true)
      }

      if (data.status === 'ACTIVE') {
        if (pollingRef.current) clearInterval(pollingRef.current)
        router.push(`/game/${data.gameId}`)
      }
    } catch {
      // silent
    }
  }, [roomCode, myUserId, router])

  useEffect(() => {
    pollRoom()
    pollingRef.current = setInterval(pollRoom, 2000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [pollRoom])

  async function handleReady() {
    if (myReady) return
    setMyReady(true)
    try {
      await fetch(`/api/room/${roomCode}/ready`, { method: 'POST' })
      await pollRoom()
    } catch {
      setMyReady(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  async function handleShare() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'GoClick Game Room',
          text: `${t('Join my GoClick game! Room:', '加入我的 GoClick 对局！房间码：')} ${roomCode}`,
          url: shareUrl,
        })
        return
      } catch {
        // user cancelled or not supported
      }
    }
    handleCopy()
  }

  if (!room || !myUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFACD]">
        <div className="text-gray-400">{joining ? t('Joining room...', '加入房间中...') : t('Loading...', '加载中...')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFACD] gap-4 p-4">
        <div className="text-red-500 font-medium">{error}</div>
        <Link href="/lobby" className="text-[#1E90FF] hover:underline text-sm">
          {t('Back to Lobby', '返回大厅')}
        </Link>
      </div>
    )
  }

  const isPlayer1 = room.player1?.id === myUserId
  const isPlayer2 = room.player2?.id === myUserId
  const amIReady = (isPlayer1 && room.player1Ready) || (isPlayer2 && room.player2Ready)
  const bothPresent = !!(room.player1 && room.player2)
  const bothReady = room.player1Ready && room.player2Ready

  function PlayerSlot({ player, ready, isMe, playerNum }: {
    player: PlayerInfo | null
    ready: boolean
    isMe: boolean
    playerNum: 1 | 2
  }) {
    const stoneColor = playerNum === 1 ? 'bg-[#FFAEB9] border-[#CD8C95]' : 'bg-[#A2CD5A] border-[#6E8B3D]'
    const label = playerNum === 1 ? t('Player 1 (Pink)', '玩家1（粉色）') : t('Player 2 (Green)', '玩家2（绿色）')

    return (
      <div className={`bg-white rounded-2xl p-5 shadow-sm flex-1 transition-all ${isMe ? 'ring-2 ring-[#1E90FF]' : ''}`}>
        <div className="text-xs text-gray-400 font-medium mb-3">{label}</div>
        {player ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full border-2 ${stoneColor}`} />
              <div>
                <div className="font-bold text-gray-800">{player.username}</div>
                {isMe && <div className="text-xs text-[#1E90FF]">{t('(You)', '（你）')}</div>}
              </div>
            </div>
            <div className={`text-sm font-medium rounded-lg py-2 text-center ${
              ready
                ? 'bg-green-50 text-green-600'
                : 'bg-gray-50 text-gray-400'
            }`}>
              {ready ? '✓ ' + t('Ready', '准备好了') : t('Not ready', '未准备')}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 border-dashed ${playerNum === 1 ? 'border-[#FFAEB9]' : 'border-[#A2CD5A]'} animate-pulse2`} />
            <div className="text-sm text-gray-400">{t('Waiting to join...', '等待加入...')}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFACD] flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <Link href="/lobby" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('Lobby', '大厅')}
        </Link>
        <h1 className="text-lg font-bold text-gray-700">GoClick</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-lg mx-auto w-full">
        {/* Room code */}
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{t('Room Code', '房间码')}</div>
          <div className="text-5xl font-black text-gray-800 tracking-widest font-mono">{roomCode}</div>
        </div>

        {/* Share link */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-gray-400 mb-2">{t('Invite Link', '邀请链接')}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-sm text-gray-600 truncate font-mono bg-gray-50 rounded-lg px-3 py-2">
              {shareUrl}
            </div>
            <button
              onClick={handleShare}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: copied ? '#22c55e' : 'linear-gradient(135deg, #836FFF, #6A5ACD)' }}
            >
              {copied ? t('Copied!', '已复制！') : t('Share', '分享')}
            </button>
          </div>
        </div>

        {/* Player slots */}
        <div className="flex gap-3 w-full">
          <PlayerSlot player={room.player1} ready={room.player1Ready} isMe={isPlayer1} playerNum={1} />
          <PlayerSlot player={room.player2} ready={room.player2Ready} isMe={isPlayer2} playerNum={2} />
        </div>

        {/* Status / ready button */}
        {!bothPresent && (
          <div className="text-center text-gray-500 text-sm animate-pulse2">
            {t('Waiting for opponent to join...', '等待对手加入...')}
          </div>
        )}

        {bothPresent && !bothReady && (
          <button
            onClick={handleReady}
            disabled={amIReady}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
            style={{
              background: amIReady
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #1E90FF, #1874CD)',
              color: amIReady ? '#9ca3af' : 'white',
            }}
          >
            {amIReady
              ? t('Waiting for opponent...', '等待对手准备...')
              : t('Ready! / 准备好了！', '准备好了！')}
          </button>
        )}

        {bothReady && (
          <div className="text-center py-4">
            <div className="text-2xl animate-coinFlip inline-block mb-2">🪙</div>
            <p className="text-gray-600 font-medium">{t('Both ready! Deciding who goes first...', '双方就绪！决定先手...')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
