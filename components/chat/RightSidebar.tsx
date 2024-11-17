import { useTranslation } from 'next-i18next'
import { OnlineUser, User } from './types'

interface RightSidebarProps {
  currentUser: User
  onlineUsers: OnlineUser[]
  userAvatarColor: string
  isUserAway: (lastActive: number) => boolean
  lastActivity: number
  className?: string
}

export default function RightSidebar({ 
  currentUser, 
  onlineUsers, 
  userAvatarColor,
  isUserAway,
  lastActivity,
  className = ''
}: RightSidebarProps) {
  const { t } = useTranslation('common')

  return (
    <div className={`bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-lg ${className}`}>
      <div className="p-4 h-full overflow-y-auto">
        <h2 className="text-[var(--text-primary)] font-semibold text-lg mb-3">
          {t('onlineUsers')} ({onlineUsers.length + 1})
        </h2>
        <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
          {/* Current user */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: userAvatarColor }}
              >
                {currentUser?.username.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${
                isUserAway(lastActivity) ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-primary)]">
                {currentUser?.username} ({t('you')})
              </span>
              {isUserAway(lastActivity) && (
                <span className="text-[var(--text-secondary)] text-sm">
                  {t('away')}
                </span>
              )}
            </div>
          </div>
          
          {/* Other online users */}
          {onlineUsers.map((onlineUser, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: onlineUser.avatarColor }}
                >
                  {onlineUser.username.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${
                  onlineUser.status === 'away' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-primary)]">
                  {onlineUser.username}
                </span>
                {onlineUser.status === 'typing' && (
                  <span className="text-[var(--text-secondary)] text-sm">
                    {t('typing')}
                  </span>
                )}
                {onlineUser.status === 'away' && (
                  <span className="text-[var(--text-secondary)] text-sm">
                    {t('away')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 