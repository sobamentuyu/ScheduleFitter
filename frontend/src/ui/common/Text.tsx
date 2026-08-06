import type { ReactNode } from 'react'

// デザイン決まり次第変更
const colorClass = {
  base: 'text-base-content',
  muted: 'text-base-content/60',
  primary: 'text-primary',
} as const

const sizeClass = {
  sm: 'text-sm lg:text-base',
  md: 'text-base lg:text-lg',
  lg: 'text-lg lg:text-xl',
} as const

const weightClass = {
  normal: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
} as const

type TextProps = {
  children: ReactNode
  color?: keyof typeof colorClass
  size?: keyof typeof sizeClass
  weight?: keyof typeof weightClass
  className?: string
}

export function Text({
  children,
  color = 'base',
  size = 'md',
  weight = 'normal',
  className = '',
}: TextProps) {
  return (
    <p
      className={[
        colorClass[color],
        sizeClass[size],
        weightClass[weight],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}
