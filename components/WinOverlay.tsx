'use client'

interface WinOverlayProps {
  winnerName: string
  lang: 'EN' | 'ZH'
  onPlayAgain: () => void
  onBackToLobby: () => void
  isLoading?: boolean
}

export default function WinOverlay({ winnerName, lang, onPlayAgain, onBackToLobby, isLoading }: WinOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-10 text-center">
        {/* Trophy icon */}
        <svg className="w-20 h-20 mx-auto mb-4 text-[#1E90FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5m-9 4.5v-4.5M4.5 7.5a2.25 2.25 0 00-.75 1.698V9a5.25 5.25 0 005.25 5.25h6A5.25 5.25 0 0020.25 9v-.802a2.25 2.25 0 00-.75-1.698M4.5 7.5V6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 6v1.5M4.5 7.5h15" />
        </svg>

        <div className="text-3xl font-bold text-gray-900 mb-1">
          {lang === 'ZH' ? `${winnerName} 获胜！` : `${winnerName} Wins!`}
        </div>
        <div className="text-gray-400 text-sm mb-8">
          {lang === 'ZH' ? '五子连珠！' : 'Five in a Row!'}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1E90FF, #1874CD)' }}
          >
            {lang === 'ZH' ? '再来一局 🔄' : 'Play Again 🔄'}
          </button>
          <button
            onClick={onBackToLobby}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50"
          >
            {lang === 'ZH' ? '返回大厅' : 'Back to Lobby'}
          </button>
        </div>
      </div>
    </div>
  )
}
