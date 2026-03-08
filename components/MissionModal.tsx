'use client'

interface MissionModalProps {
  missionId: number
  missionTitleEN: string
  missionTitleZH: string
  missionTextEN: string
  missionTextZH: string
  assignedToPlayerName: string
  assignedLang: 'EN' | 'ZH'
  onAcknowledge: () => void
}

export default function MissionModal({
  missionId,
  missionTitleEN,
  missionTitleZH,
  missionTextEN,
  missionTextZH,
  assignedToPlayerName,
  assignedLang,
  onAcknowledge,
}: MissionModalProps) {
  const title = assignedLang === 'ZH' ? missionTitleZH : missionTitleEN
  const text = assignedLang === 'ZH' ? missionTextZH : missionTextEN

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-[#836FFF] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
            Mission Triggered! 任务触发！
          </div>
          <div className="text-sm text-gray-500">
            Assigned to / 分配给:{' '}
            <span className="font-bold text-[#836FFF]">{assignedToPlayerName}</span>
          </div>
        </div>

        {/* Mission badge and content */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#836FFF] text-white flex items-center justify-center font-bold text-lg">
            #{missionId}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-xl mb-2">{title}</div>
            <p className="text-gray-600 leading-relaxed">{text}</p>
            {assignedLang === 'EN' && missionTextZH && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{missionTextZH}</p>
            )}
            {assignedLang === 'ZH' && missionTextEN && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{missionTextEN}</p>
            )}
          </div>
        </div>

        {/* Acknowledge button */}
        <button
          onClick={onAcknowledge}
          className="w-full py-3 rounded-xl font-bold text-white text-lg transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #836FFF, #6A5ACD)' }}
        >
          Got it! / 明白了！
        </button>
      </div>
    </div>
  )
}
