interface StoneProps {
  player: 1 | 2
  isWinning?: boolean
  isHover?: boolean
  size?: number
}

export default function Stone({ player, isWinning, isHover, size = 28 }: StoneProps) {
  const configs = {
    1: {
      fill: '#FFAEB9',
      stroke: '#CD8C95',
      winColor: '#8B5F65',
    },
    2: {
      fill: '#A2CD5A',
      stroke: '#6E8B3D',
      winColor: '#3A5F0B',
    },
  }
  const c = configs[player]
  const r = size / 2 - 1.5

  return (
    <circle
      r={r}
      fill={isHover ? c.fill + '66' : c.fill}
      stroke={isHover ? c.stroke + '88' : c.stroke}
      strokeWidth={isWinning ? 2.5 : 1.5}
      style={
        isWinning
          ? {
              filter: `drop-shadow(0 0 6px ${c.winColor}) drop-shadow(0 0 12px ${c.winColor})`,
              animation: 'glow 1s ease-in-out infinite',
            }
          : isHover
          ? { opacity: 0.55 }
          : { animation: 'scaleIn 0.15s ease-out' }
      }
    />
  )
}
