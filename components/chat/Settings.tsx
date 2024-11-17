import { useTranslation } from 'next-i18next'

interface SettingsProps {
  onClose: () => void
  locale: string
  onLocaleChange: (value: string) => void
  theme: 'dark' | 'light'
  onThemeChange: (value: 'dark' | 'light') => void
  onSave: () => void
  className?: string
}

export default function Settings({
  onClose,
  locale,
  onLocaleChange,
  theme,
  onThemeChange,
  onSave,
  className = ''
}: SettingsProps) {
  const { t } = useTranslation('common')

  return (
    <div className={className}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6">
        <div className="settings-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[var(--text-primary)] text-xl font-bold">{t('settings')}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              {t('theme')}
            </label>
            <div className="flex items-center gap-4 p-2 bg-[var(--bg-primary)] rounded-md">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  theme === 'light' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
                {t('light')}
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
                {t('dark')}
              </button>
            </div>
          </div>

          {/* Language selector */}
          <div className="mb-6">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              {t('language')}
            </label>
            <select
              onChange={(e) => onLocaleChange(e.target.value)}
              value={locale}
              className="w-full p-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded focus:outline-none focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={onSave}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              {t('saveSettings')}
            </button>
          </div>

          {/* Version Info */}
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
            <p>{t('version')} 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
} 