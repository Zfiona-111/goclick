'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PlayerCard from '@/components/PlayerCard'
import LanguageToggle from '@/components/LanguageToggle'

interface UserData {
  id: string
  username: string
  phone: string
  preferredLanguage: 'EN' | 'ZH'
  gamesPlayed: number
  wins: number
}

export default function LobbyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [lang, setLang] = useState<'EN' | 'ZH'>('EN')
  const [creating, setCreating] = useState(false)
  const [joinError, setJoinError] = useState('')

  const fetchSession = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    if (!data.user) {
      router.push('/login')
      return
    }
    setUser(data.user)
    setLang(data.user.preferredLanguage as 'EN' | 'ZH')
  }, [router])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleCreateGame() {
    setCreating(true)
    try {
      const res = await fetch('/api/room/create', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.gameId) {
        router.push(`/game/${data.gameId}`)
      }
    } catch {
      setCreating(false)
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    if (code.length !== 6) {
      setJoinError(lang === 'ZH' ? '房间码为6位字符' : 'Room code must be 6 characters')
      return
    }
    router.push(`/room/${code}`)
  }

  const t = (en: string, zh: string) => (lang === 'ZH' ? zh : en)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFACD]">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFACD] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('Logout', '退出')}
        </button>
        <LanguageToggle lang={lang} userId={user.id} onToggle={setLang} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-black text-gray-800 tracking-tight mb-2">GoClick</h1>
          <p className="text-gray-400 text-base">{t('Five in a Row', '五子连珠')}</p>
        </div>

        {/* Create game */}
        <button
          onClick={handleCreateGame}
          disabled={creating}
          className="px-12 py-5 rounded-2xl text-white text-xl font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1E90FF, #1874CD)' }}
        >
          {creating ? t('Creating...', '创建中...') : t('Create Game', '创建游戏')}
        </button>

        {/* Join by code */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              placeholder={t('Room code (e.g. A3KF9Z)', '房间码（如 A3KF9Z）')}
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] bg-white text-gray-800 uppercase tracking-widest font-mono"
              style={{ fontSize: '16px' }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #836FFF, #6A5ACD)' }}
            >
              {t('Join', '加入')}
            </button>
          </form>
          {joinError && <p className="text-red-500 text-sm mt-2 px-1">{joinError}</p>}
        </div>

        {/* Player profile */}
        <div className="w-full max-w-sm">
          <PlayerCard
            username={user.username}
            phone={user.phone}
            gamesPlayed={user.gamesPlayed}
            wins={user.wins}
            preferredLanguage={user.preferredLanguage}
            label={t('Your Profile', '我的账号')}
          />
        </div>
      </main>
    </div>
  )
}
