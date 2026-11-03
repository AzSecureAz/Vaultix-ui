import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }
>(({ className, glow, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111116]/90 backdrop-blur-xl shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_12px_36px_-6px_rgba(0,0,0,0.5)] text-zinc-900 dark:text-zinc-100 transition-all duration-200',
      glow && 'hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-md dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_16px_40px_-8px_rgba(0,0,0,0.7)]',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-5 sm:p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-sm sm:text-base font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 sm:p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-5 sm:p-6 pt-4 border-t border-zinc-100 dark:border-white/[0.06]', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
