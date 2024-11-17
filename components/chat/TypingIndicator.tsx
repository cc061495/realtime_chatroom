import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'

interface TypingIndicatorProps {
  typingUsers: Set<string>
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const { t } = useTranslation('common')
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (typingUsers.size > 0) {
      setIsVisible(true)
    } else {
      // Add a small delay before hiding to allow the animation to play
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [typingUsers.size])

  if (!isVisible && typingUsers.size === 0) return null

  return (
    <div className={`text-sm text-[var(--text-secondary)] flex items-center gap-2 px-4 pt-3 bg-[var(--bg-secondary)] ${
      typingUsers.size > 0 ? 'animate-fade-in-down' : 'animate-fade-out-up'
    }`}>
      <div className="flex gap-1">
        <span className="animate-bounce">•</span>
        <span className="animate-bounce delay-100">•</span>
        <span className="animate-bounce delay-200">•</span>
      </div>
      <span className="text-xs">
        {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? t('typing') : t('areTyping')}
      </span>
    </div>
  )
} 