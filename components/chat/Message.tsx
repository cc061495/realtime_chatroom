import { useTranslation } from 'next-i18next'
import { Message } from './types'

interface MessageProps {
  message: Message
  onReply: (message: Message) => void
  onCopy: (content: string) => void
}

export default function MessageComponent({ message, onReply, onCopy }: MessageProps) {
  const { t } = useTranslation('common')
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension ? imageExtensions.includes(extension) : false
  }

  const renderContent = (content: string, attachment?: { url: string, name: string }) => {
    if (attachment) {
      if (isImageFile(attachment.name)) {
        return (
          <div className="mt-2">
            <img 
              src={attachment.url} 
              alt={attachment.name}
              className="max-w-[300px] max-h-[300px] rounded-lg object-contain bg-[var(--bg-secondary)]"
              loading="lazy"
            />
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline mt-1 inline-block"
            >
              {attachment.name}
            </a>
          </div>
        )
      } else {
        // For non-image files
        return (
          <div className="mt-2 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {attachment.name}
            </a>
          </div>
        )
      }
    }

    // Regular message with URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="group hover:bg-[var(--hover-bg)] px-4 py-2 rounded-md">
      {/* Reply reference if exists */}
      {message.reply_to && (
        <div className="ml-12 mb-1 text-sm text-[var(--text-secondary)] flex items-center gap-2">
          <svg className="w-4 h-4 rotate-180 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
          </svg>
          <div className="flex items-center gap-1 min-w-0">
            <span className="whitespace-nowrap">
              {t('replyingTo')} {message.reply_to.user_name}:
            </span>
            <span className="truncate min-w-0">
              {message.reply_to.content}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-x-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: message.user_profiles.avatar_color || '#3B82F6' }}
        >
          {message.user_profiles.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-2">
            <span className="font-semibold text-[var(--text-primary)]">
              {message.user_profiles.username}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatDate(message.created_at)}
            </span>
          </div>
          <div className="text-[var(--text-primary)] mt-1 break-words whitespace-pre-wrap">
            {renderContent(message.content, message.attachment)}
          </div>
        </div>
        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onCopy(message.content)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            title={t('copyMessage')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onReply(message)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            title={t('reply')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 