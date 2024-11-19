import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { User, OnlineUser } from './types'
import UserProfileModal from './UserProfileModal'

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
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null)

  // Calculate total online users (including current user)
  const totalOnlineUsers = onlineUsers.length + 1

  return (
    <>
      {selectedUser && (
        <UserProfileModal
          username={selectedUser.username}
          avatarColor={selectedUser.avatarColor}
          createdAt={selectedUser.created_at || ''}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <div className={className}>
        <div className="h-full bg-[var(--bg-secondary)] border-l border-[var(--border-color)]">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h2 className="text-[var(--text-primary)] text-sm font-semibold uppercase tracking-wider">
              {t('onlineUsers')} ({totalOnlineUsers})
            </h2>
          </div>
          
          <div className="p-2 space-y-1">
            {/* Current user */}
            <div 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150"
              onClick={() => setSelectedUser({ 
                username: currentUser.username,
                avatarColor: userAvatarColor,
                lastActive: lastActivity,
                status: (currentUser.status as "online" | "typing" | "away" | "busy") || 'online',
                created_at: currentUser.created_at
              })}
            >
              <div className="relative">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm transition-transform duration-150 group-hover:scale-105"
                  style={{ backgroundColor: userAvatarColor }}
                >
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] bg-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[var(--text-primary)] font-medium truncate">
                  {currentUser.username} <span className="text-[var(--text-secondary)] font-normal">({t('you')})</span>
                </div>
              </div>
            </div>

            {/* Other online users */}
            {onlineUsers.map((user) => (
              <div 
                key={user.username} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150"
                onClick={() => setSelectedUser({
                  ...user,
                  created_at: user.created_at
                })}
              >
                <div className="relative">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm transition-transform duration-150 group-hover:scale-105"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${
                    user.status === 'away' ? 'bg-yellow-500' : 
                    user.status === 'busy' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[var(--text-primary)] font-medium truncate">
                    {user.username}
                  </div>
                  {user.status !== 'online' && (
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {user.status === 'typing' ? t('typing') : 
                       user.status === 'away' ? t('away') :
                       user.status === 'busy' ? t('statusBusy') : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
} 