'use client'

interface PlayerCardProps {
  username: string
  phone?: string | null
  gamesPlayed: number
  wins: number
  preferredLanguage: 'EN' | 'ZH'
  isActive?: boolean
  playerNumber?: 1 | 2
  label?: string
}

export default function PlayerCard({
  username,
  phone,
  gamesPlayed,
  wins,
  isActive,
  playerNumber,
  label,
}: PlayerCardProps) {
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0
  const losses = gamesPlayed - wins

  const stoneColor = playerNumber === 1 ? 'bg-[#FFAEB9] border-[#CD8C95]' : 'bg-[#A2CD5A] border-[#6E8B3D]'
  const ringColor = playerNumber === 1 ? 'ring-[#FFAEB9]' : 'ring-[#A2CD5A]'

  return (
    <div
      className={`rounded-2xl bg-white shadow-md p-5 transition-all duration-200 ${
        isActive ? `ring-2 ${ringColor}` : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {playerNumber && (
          <div className={`w-8 h-8 rounded-full border-2 ${stoneColor} flex-shrink-0`} />
        )}
        <div>
          {label && <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>}
          <div className="font-bold text-gray-800 text-lg leading-tight">{username}</div>
          <div className="text-xs text-gray-400">{phone}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-800">{gamesPlayed}</div>
          <div className="text-xs text-gray-400">Games</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-800">{wins}</div>
          <div className="text-xs text-gray-400">Wins</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-800">{winRate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
        </div>
      </div>
    </div>
  )
}
