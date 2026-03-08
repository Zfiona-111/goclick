'use client'

interface LanguageToggleProps {
  lang: 'EN' | 'ZH'
  userId: string
  onToggle: (newLang: 'EN' | 'ZH') => void
}

export default function LanguageToggle({ lang, userId, onToggle }: LanguageToggleProps) {
  async function toggle() {
    const newLang = lang === 'EN' ? 'ZH' : 'EN'
    try {
      await fetch('/api/auth/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: newLang, playerId: userId }),
      })
      onToggle(newLang)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
      title="Toggle Language"
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      {lang === 'EN' ? '中文' : 'EN'}
    </button>
  )
}
