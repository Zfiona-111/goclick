'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
    confirm: '',
    preferredLanguage: 'EN',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match / 两次密码不一致')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          password: form.password,
          username: form.username,
          preferredLanguage: form.preferredLanguage,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'phoneExists' ? 'Phone already registered / 手机号已注册' : data.error || 'Registration failed')
      } else {
        router.push('/lobby')
        router.refresh()
      }
    } catch {
      setError('Network error')
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
          <h2 className="text-xl font-bold text-gray-800 mb-6">Register / 注册</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username / 用户名</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                style={{ fontSize: '16px' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone / 手机号</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                style={{ fontSize: '16px' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password / 密码</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                style={{ fontSize: '16px' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password / 确认密码</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                style={{ fontSize: '16px' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language / 语言</label>
              <div className="flex gap-3">
                {(['EN', 'ZH'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update('preferredLanguage', l)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.preferredLanguage === l
                        ? 'border-[#1E90FF] bg-[#1E90FF] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {l === 'EN' ? 'English' : '简体中文'}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1E90FF, #1874CD)', fontSize: '16px' }}
            >
              {loading ? 'Registering...' : 'Register / 注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[#1E90FF] hover:underline">
              Have an account? Login / 已有账号？登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
