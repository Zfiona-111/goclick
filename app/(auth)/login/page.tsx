'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/nickname-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || '登录失败，请重试')
      } else {
        router.push('/lobby')
        router.refresh()
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFACD] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-800 mb-1">GoClick</h1>
          <p className="text-gray-500 text-sm">Gomoku · Five in a Row · 五子棋</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">登录 / Login</h2>
          <p className="text-sm text-gray-400 mb-6">起个昵称即可开始游戏</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                昵称 / Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError('') }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                style={{ fontSize: '16px' }}
                placeholder="起个昵称吧，中英文都行~"
                autoComplete="off"
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1E90FF, #1874CD)', fontSize: '16px' }}
            >
              {loading ? '进入中...' : '进入游戏 / Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
