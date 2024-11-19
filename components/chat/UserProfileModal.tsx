import { useTranslation } from 'next-i18next'

interface UserProfileModalProps {
  username: string
  avatarColor: string
  createdAt: string
  onClose: () => void
}

export default function UserProfileModal({
  username,
  avatarColor,
  createdAt,
  onClose
}: UserProfileModalProps) {
  const { t } = useTranslation('common')

  const formatDate = (date: string | undefined) => {
    if (!date) return t('unknownDate');
    try {
      return new Date(date).toLocaleDateString()
    } catch (error) {
      console.error('Date formatting error:', error);
      return t('unknownDate');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* User Avatar */}
        <div className="flex justify-center mb-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{username}</h2>
          <div className="text-sm text-[var(--text-secondary)]">
            {t('memberSince')}: {formatDate(createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
} 