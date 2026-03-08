'use client'

import { useState } from 'react'

interface MissionEntry {
  id: string
  missionId: number
  missionText: string
  assignedToPlayer: { id: string; username: string }
  triggeredAtMove: number
  createdAt: string
}

interface MissionLogProps {
  missions: MissionEntry[]
  lang: 'EN' | 'ZH'
}

export default function MissionLog({ missions, lang }: MissionLogProps) {
  const [collapsed, setCollapsed] = useState(false)

  const title = lang === 'ZH' ? '任务记录' : 'Mission Log'
  const emptyText = lang === 'ZH' ? '暂无任务触发' : 'No missions yet'

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-700 text-sm">
          {title}
          {missions.length > 0 && (
            <span className="ml-2 bg-[#836FFF] text-white text-xs rounded-full px-2 py-0.5">
              {missions.length}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
          {missions.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">{emptyText}</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {missions.map((m) => (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#836FFF]">#{m.missionId}</span>
                    <span className="text-xs text-gray-400">Move {m.triggeredAtMove}</span>
                    <span className="text-xs text-gray-500 ml-auto">→ {m.assignedToPlayer.username}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{m.missionText}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
