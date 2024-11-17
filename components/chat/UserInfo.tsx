import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { User, ColorOption } from './types'

interface UserInfoProps {
  user: User
  avatarColor: string
  onAvatarColorChange: (color: string) => void
  onUsernameChange: (username: string) => void
  colorOptions: ColorOption[]
  onClose: () => void
  className?: string
  onSave: (newUsername: string, newAvatarColor: string) => void
}

export default function UserInfo({
  user,
  avatarColor,
  onAvatarColorChange,
  onUsernameChange,
  colorOptions,
  onClose,
  className = '',
  onSave
}: UserInfoProps) {
  const { t } = useTranslation('common')
  const [tempUsername, setTempUsername] = useState(user.username)
  const [tempAvatarColor, setTempAvatarColor] = useState(avatarColor)

  // Update temp states when props change
  useEffect(() => {
    setTempUsername(user.username)
    setTempAvatarColor(avatarColor)
  }, [user.username, avatarColor])

  const handleSave = () => {
    onSave(tempUsername, tempAvatarColor)
    onClose()
  }

  return (
    <div className={className}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6">
        <div className="settings-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[var(--text-primary)] text-xl font-bold">{t('userSettings')}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Username Input */}
          <div className="mb-6">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              {t('username')}
            </label>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="w-full p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Avatar Color Selection */}
          <div className="mb-6">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              {t('avatarColor')}
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTempAvatarColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    tempAvatarColor === color.value ? 'scale-110 ring-2 ring-[var(--text-primary)]' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              {t('saveSettings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 