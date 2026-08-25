import type { ReactNode } from 'react'

const colorClass = {
  base: 'text-base-content',
  muted: 'text-base-content/60',
  primary: 'text-primary',
  primaryContent: 'text-primary-content',
  info: 'text-info-content',
  error: 'text-error-content',
  sunday: 'text-error-content',
  saturday: 'text-info-content',
} as const

const sizeClass = {
  xs: 'text-xs lg:text-sm',
  sm: 'text-sm lg:text-base',
  md: 'text-base lg:text-lg',
  lg: 'text-lg lg:text-xl',
  xl: 'text-xl lg:text-2xl',
} as const

const weightClass = {
  normal: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
} as const

type TextTag = 'p' | 'span' | 'h1' | 'h2' | 'h3'

type TextProps = {
  as?: TextTag
  children: ReactNode
  color?: keyof typeof colorClass
  size?: keyof typeof sizeClass
  weight?: keyof typeof weightClass
  className?: string
}

export function Text({
  as: Component = 'p',
  children,
  color = 'base',
  size = 'md',
  weight = 'normal',
  className = '',
}: TextProps) {
  return (
    <Component
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
    </Component>
  )
}
