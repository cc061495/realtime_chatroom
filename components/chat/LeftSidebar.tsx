import { useTranslation } from 'next-i18next'
import { User } from './types'

interface LeftSidebarProps {
  onSettingsClick: () => void
  onLogout: () => void
  user: User
  avatarColor: string
  isAway: boolean
  onUserInfoClick: () => void
}

export default function LeftSidebar({ 
  onSettingsClick, 
  onLogout, 
  user,
  avatarColor,
  isAway,
  onUserInfoClick
}: LeftSidebarProps) {
  const { t } = useTranslation('common')

  return (
    <div className="w-14 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] hidden md:flex flex-col items-center py-4 shadow-lg relative">
      {/* User Avatar */}
      <button 
        onClick={onUserInfoClick}
        className="relative mb-4 group"
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium transition-transform group-hover:scale-105"
          style={{ backgroundColor: avatarColor }}
        >
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${
          isAway ? 'bg-yellow-500' : 'bg-green-500'
        }`} />
      </button>

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Settings Button */}
      <button
        onClick={onSettingsClick}
        className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--hover-bg)] mb-2"
        aria-label={t('settings')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 rounded-full hover:bg-[var(--hover-bg)]"
        aria-label={t('logout')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  )
} 