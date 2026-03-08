'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault()
    if (!phone.trim() || sending || countdown > 0) return
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json()
      if (res.status === 429) { setError(data.message || '请求过于频繁，请稍后再试'); return }
      if (!res.ok || !data.success) { setError(data.message || '发送失败，请稍后重试'); return }
      startCountdown()
      setStep(2)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    setError('')
    if (v && index < 5) setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
    if (v && index === 5) {
      const code = next.join('')
      if (code.length === 6) submitOtp(code)
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setDigits(pasted.split('')); submitOtp(pasted) }
  }

  async function submitOtp(code: string) {
    if (verifying) return
    setError('')
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || '验证失败')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      } else {
        router.push('/lobby')
        router.refresh()
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setVerifying(false)
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
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">登录 / Login</h2>
              <p className="text-sm text-gray-400 mb-6">输入手机号获取验证码 / Enter phone to get code</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号 / Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError('') }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] text-gray-800 bg-gray-50"
                    style={{ fontSize: '16px' }}
                    placeholder="+86 138 0000 0000"
                    autoComplete="tel"
                    required
                  />
                </div>
                {error && <div className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</div>}
                <button
                  type="submit"
                  disabled={sending || countdown > 0 || !phone.trim()}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1E90FF, #1874CD)', fontSize: '16px' }}
                >
                  {sending ? '发送中...' : countdown > 0 ? `重新获取 (${countdown}s)` : '获取验证码 / Get Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">输入验证码</h2>
              <p className="text-sm text-gray-400 mb-1">
                已发送至 {phone.slice(0, 3)}****{phone.slice(-4)}
              </p>
              <p className="text-xs text-gray-400 mb-6">Enter the 6-digit code sent to your phone</p>
              <div className="flex gap-2 mb-4" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    className="flex-1 aspect-square text-center font-bold rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#1E90FF] text-gray-800 bg-gray-50 transition-colors"
                    style={{ fontSize: '24px' }}
                    disabled={verifying}
                  />
                ))}
              </div>
              {verifying && <div className="text-center text-sm text-[#1E90FF] mb-4">验证中... / Verifying...</div>}
              {error && <div className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</div>}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep(1); setError(''); setDigits(['', '', '', '', '', '']) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← 修改手机号
                </button>
                <button
                  onClick={() => handleSendOtp()}
                  disabled={countdown > 0 || sending}
                  className="text-[#1E90FF] hover:underline disabled:text-gray-300 transition-colors"
                >
                  {countdown > 0 ? `重新获取 (${countdown}s)` : '重新发送'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
